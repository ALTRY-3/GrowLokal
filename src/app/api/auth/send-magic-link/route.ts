import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendMagicLinkEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Email already verified' },
        { status: 400 }
      );
    }

    // Generate secure random token for magic link
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration to 1 hour from now
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with verification token
    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: tokenExpires,
    });

    // Create magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    // Send magic link via email
    try {
      const emailResult = await sendMagicLinkEmail(email, magicLink);
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        return NextResponse.json(
          { success: false, message: 'Failed to send verification email' },
          { status: 500 }
        );
      } else {
        console.log('Verification email sent successfully:', emailResult.messageId);
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      return NextResponse.json(
        { success: false, message: 'Email service unavailable' },
        { status: 500 }
      );
    }

    // In development, also log the magic link for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development magic link for ${email}: ${magicLink}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Verification link sent to your email address',
    });

  } catch (error: any) {
    console.error('Send magic link error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification link' },
      { status: 500 }
    );
  }
}