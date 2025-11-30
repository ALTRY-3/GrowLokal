import { NextRequest } from 'next/server';
import connectDB from './mongodb';
import RateLimit from '@/models/RateLimit';

// Rate limit configuration
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 30 },
  signup: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
  register: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
  'forgot-password': { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
  'resend-verification': { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
  resetIn?: number; // seconds until reset
  message?: string;
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

/**
 * Check rate limit for a given key and endpoint
 */
export async function checkRateLimit(
  key: string,
  endpoint: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  try {
    await connectDB();

    const config = RATE_LIMITS[endpoint];
    if (!config) {
      // No rate limit configured for this endpoint
      return { allowed: true, remaining: 999, resetAt: null };
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

    // Find or create rate limit record
    let rateLimit = await RateLimit.findOne({ key, endpoint });

    if (!rateLimit) {
      // First attempt
      rateLimit = await RateLimit.create({
        key,
        endpoint,
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        blockedUntil: null,
      });

      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
      };
    }

    // Check if currently blocked
    if (rateLimit.blockedUntil && rateLimit.blockedUntil > now) {
      const resetIn = Math.ceil((rateLimit.blockedUntil.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: rateLimit.blockedUntil,
        resetIn,
        message: `Too many attempts. Please try again after ${rateLimit.blockedUntil.toLocaleTimeString()}.`,
      };
    }

    // Check if window has expired (reset counter)
    if (rateLimit.firstAttempt < windowStart) {
      rateLimit.attempts = 1;
      rateLimit.firstAttempt = now;
      rateLimit.lastAttempt = now;
      rateLimit.blockedUntil = null;
      await rateLimit.save();

      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
      };
    }

    // Increment attempts
    rateLimit.attempts += 1;
    rateLimit.lastAttempt = now;

    // Check if limit exceeded
    if (rateLimit.attempts > config.maxAttempts) {
      rateLimit.blockedUntil = new Date(now.getTime() + config.blockMinutes * 60 * 1000);
      await rateLimit.save();

      const resetIn = config.blockMinutes * 60;
      return {
        allowed: false,
        remaining: 0,
        resetAt: rateLimit.blockedUntil,
        resetIn,
        message: `Rate limit exceeded. You have been blocked for ${config.blockMinutes} minutes.`,
      };
    }

    await rateLimit.save();

    return {
      allowed: true,
      remaining: config.maxAttempts - rateLimit.attempts,
      resetAt: new Date(rateLimit.firstAttempt.getTime() + config.windowMinutes * 60 * 1000),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log it
    return { allowed: true, remaining: 999, resetAt: null };
  }
}

/**
 * Reset rate limit for a key and endpoint (used after successful action)
 */
export async function resetRateLimit(
  key: string,
  endpoint: keyof typeof RATE_LIMITS
): Promise<void> {
  try {
    await connectDB();
    await RateLimit.deleteOne({ key, endpoint });
  } catch (error) {
    console.error('Rate limit reset error:', error);
  }
}

/**
 * Middleware helper to check rate limit and return response if blocked
 */
export async function withRateLimit(
  req: NextRequest,
  endpoint: keyof typeof RATE_LIMITS,
  additionalKey?: string
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const key = additionalKey ? `${ip}:${additionalKey}` : ip;
  
  return await checkRateLimit(key, endpoint);
}
