import { NextRequest } from 'next/server';
import crypto from 'crypto';

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Generate a secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify CSRF token from request
 * Uses double-submit cookie pattern
 */
export async function verifyCsrfToken(req: NextRequest): Promise<boolean> {
  try {
    // Get token from header
    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    
    // Get token from cookie
    const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

    // Both must exist and match
    if (!headerToken || !cookieToken) {
      console.warn('CSRF: Missing token in header or cookie');
      return false;
    }

    if (headerToken !== cookieToken) {
      console.warn('CSRF: Token mismatch');
      return false;
    }

    // Additional check: token should not be too old (optional)
    // You can store timestamp in the token and validate it here

    return true;
  } catch (error) {
    console.error('CSRF verification error:', error);
    return false;
  }
}

/**
 * Middleware helper to check CSRF token and return error response if invalid
 */
export async function requireCsrfToken(req: NextRequest): Promise<boolean> {
  // Skip CSRF check for GET, HEAD, OPTIONS
  const method = req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // Skip CSRF check in development if explicitly disabled
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CSRF_CHECK === 'true') {
    return true;
  }

  return await verifyCsrfToken(req);
}

/**
 * Get CSRF token for client-side use
 * This should be called from an API route
 */
export function getCsrfTokenResponse() {
  const token = generateCsrfToken();
  
  return {
    token,
    cookieOptions: {
      name: CSRF_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    },
  };
}
