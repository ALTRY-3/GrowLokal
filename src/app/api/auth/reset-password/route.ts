import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireCsrfToken } from '@/lib/csrf';
import { validatePassword } from '@/lib/passwordPolicy';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfValid = await requireCsrfToken(request);
    if (!csrfValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid CSRF token. Please refresh the page and try again.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { token, email, newPassword } = await request.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Token, email, and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Find user with matching token
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: token,
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid password reset token',
          errorCode: 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    // Check if token has already been used (single-use token)
    if (user.passwordResetTokenUsed) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'This password reset link has already been used. Please request a new one.',
          errorCode: 'TOKEN_USED'
        },
        { status: 400 }
      );
    }

    // Check if token has expired (1 hour TTL)
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'This password reset link has expired. Please request a new one.',
          errorCode: 'TOKEN_EXPIRED'
        },
        { status: 400 }
      );
    }

    // Update password and invalidate reset token
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetTokenUsed = true; // Mark as used to prevent reuse
    
    await user.save();

    console.log(`Password reset successful for user: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });

  } catch (error: any) {
    console.error('Reset password error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: messages.join('. ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}