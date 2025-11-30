import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unlockAccount } from '@/lib/accountLockout';
import { requireCsrfToken } from '@/lib/csrf';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Admin endpoint to unlock a user account
 * NOTE: In production, add proper admin authentication/authorization
 */
export async function POST(req: NextRequest) {
  try {
    // Verify CSRF token
    const csrfValid = await requireCsrfToken(req);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token. Please refresh the page and try again.' },
        { status: 403 }
      );
    }

    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // For now, we'll check if user exists and is verified
    await connectDB();
    const adminUser = await User.findById(session.user.id);
    
    if (!adminUser || !adminUser.emailVerified) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Unlock the account
    const success = await unlockAccount(email);

    if (!success) {
      return NextResponse.json(
        { error: 'User not found or account not locked' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Account for ${email} has been unlocked`,
    });

  } catch (error: any) {
    console.error('Unlock account error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock account' },
      { status: 500 }
    );
  }
}

/**
 * Get lockout status for a user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isLocked = user.accountLockedUntil && user.accountLockedUntil > now;

    return NextResponse.json({
      email: user.email,
      isLocked,
      failedAttempts: user.failedLoginAttempts,
      lockedUntil: user.accountLockedUntil,
      lastFailedLogin: user.lastFailedLogin,
    });

  } catch (error: any) {
    console.error('Get lockout status error:', error);
    return NextResponse.json(
      { error: 'Failed to get lockout status' },
      { status: 500 }
    );
  }
}
