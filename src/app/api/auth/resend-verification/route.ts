import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireCsrfToken } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Verify CSRF token
    const csrfCheck = await requireCsrfToken(req);
    if (csrfCheck) return csrfCheck;

    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Rate limiting: 3 resend attempts per hour per email
    const rateLimitKey = `resend-verification:${email}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'resend-verification');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.message || 'Too many verification requests. Please try again later.',
          cooldown: rateLimitResult.resetIn || 60
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account exists with this email, a verification link has been sent.' },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified. You can log in now.' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Create verification link
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;

    // TODO: Send verification email
    // In production, you would send this via email service
    // For now, we'll just log it and optionally return it in development
    console.log('Verification URL:', verificationUrl);

    const response: any = {
      message: 'Verification email sent successfully. Please check your inbox.'
    };

    // In development, return the link for testing
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_DEV_LINKS === 'true') {
      response.developmentLink = verificationUrl;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email. Please try again.' },
      { status: 500 }
    );
  }
}
