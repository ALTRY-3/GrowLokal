import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const CAPTCHA_REQUIRED_AFTER = 3; // Require CAPTCHA after 3 failed attempts

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ requiresCaptcha: false });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ requiresCaptcha: false });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      return NextResponse.json({ 
        requiresCaptcha: true,
        accountLocked: true,
        lockedUntil: user.accountLockedUntil 
      });
    }

    // Require CAPTCHA if there have been failed attempts
    const requiresCaptcha = user.failedLoginAttempts >= CAPTCHA_REQUIRED_AFTER;

    return NextResponse.json({ 
      requiresCaptcha,
      failedAttempts: user.failedLoginAttempts 
    });

  } catch (error) {
    console.error('Check captcha requirement error:', error);
    return NextResponse.json({ requiresCaptcha: false });
  }
}
