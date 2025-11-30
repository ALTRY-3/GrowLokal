import connectDB from './mongodb';
import User from '@/models/User';

// Lockout configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const RESET_ATTEMPTS_AFTER_MINUTES = 60;

export interface LockoutResult {
  isLocked: boolean;
  failedAttempts: number;
  lockedUntil?: Date;
  message?: string;
}

/**
 * Check if an account is currently locked
 */
export async function checkAccountLockout(email: string): Promise<LockoutResult> {
  try {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return { isLocked: false, failedAttempts: 0 };
    }

    const now = new Date();

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > now) {
      const minutesRemaining = Math.ceil((user.accountLockedUntil.getTime() - now.getTime()) / (1000 * 60));
      return {
        isLocked: true,
        failedAttempts: user.failedLoginAttempts,
        lockedUntil: user.accountLockedUntil,
        message: `Too many failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
      };
    }

    // If lock has expired, reset failed attempts
    if (user.accountLockedUntil && user.accountLockedUntil <= now) {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      user.lastFailedLogin = null;
      await user.save();
    }

    // Check if we should reset attempts (after 60 minutes of no failed attempts)
    if (user.lastFailedLogin) {
      const minutesSinceLastFail = (now.getTime() - user.lastFailedLogin.getTime()) / (1000 * 60);
      if (minutesSinceLastFail > RESET_ATTEMPTS_AFTER_MINUTES) {
        user.failedLoginAttempts = 0;
        user.lastFailedLogin = null;
        await user.save();
      }
    }

    return {
      isLocked: false,
      failedAttempts: user.failedLoginAttempts,
    };
  } catch (error) {
    console.error('Account lockout check error:', error);
    return { isLocked: false, failedAttempts: 0 };
  }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(email: string): Promise<LockoutResult> {
  try {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists
      return { isLocked: false, failedAttempts: 0 };
    }

    const now = new Date();

    // Increment failed attempts
    user.failedLoginAttempts += 1;
    user.lastFailedLogin = now;

    // Check if we need to lock the account
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.accountLockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      await user.save();

      return {
        isLocked: true,
        failedAttempts: user.failedLoginAttempts,
        lockedUntil: user.accountLockedUntil,
        message: `Too many failed login attempts. Your account has been temporarily locked for security. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
      };
    }

    await user.save();

    // Generic error message - don't reveal remaining attempts to prevent account enumeration
    return {
      isLocked: false,
      failedAttempts: user.failedLoginAttempts,
      message: `Invalid email or password. Please try again.`,
    };
  } catch (error) {
    console.error('Record failed login error:', error);
    return { isLocked: false, failedAttempts: 0 };
  }
}

/**
 * Reset failed login attempts (called on successful login)
 */
export async function resetFailedLogins(email: string): Promise<void> {
  try {
    await connectDB();

    await User.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          failedLoginAttempts: 0,
          lastFailedLogin: null,
          accountLockedUntil: null,
        },
      }
    );
  } catch (error) {
    console.error('Reset failed logins error:', error);
  }
}

/**
 * Admin function to unlock an account manually
 */
export async function unlockAccount(email: string): Promise<boolean> {
  try {
    await connectDB();

    const result = await User.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          failedLoginAttempts: 0,
          lastFailedLogin: null,
          accountLockedUntil: null,
        },
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Unlock account error:', error);
    return false;
  }
}
