import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { success: false, message: 'Token and email are required' },
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

    // Check if token exists and hasn't expired
    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      return NextResponse.json(
        { success: false, message: 'No verification token found. Please request a new verification link.' },
        { status: 400 }
      );
    }

    if (new Date() > user.emailVerificationExpires) {
      return NextResponse.json(
        { success: false, message: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify token
    if (user.emailVerificationToken !== token) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification link' },
        { status: 400 }
      );
    }

    // Mark email as verified and clear token data
    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    // Generate JWT token for the verified user
    const authToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        emailVerified: true 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: true,
      },
    });

  } catch (error: any) {
    console.error('Verify magic link error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify email' },
      { status: 500 }
    );
  }
}