import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendMagicLinkEmail } from '@/lib/email';
import { withRateLimit, resetRateLimit } from '@/lib/rateLimit';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { requireCsrfToken } from '@/lib/csrf';
import { validatePassword } from '@/lib/passwordPolicy';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfValid = await requireCsrfToken(request);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token. Please refresh the page and try again.' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      name,
      email,
      password,
      recaptchaToken,
      phone,
      dateOfBirth,
      gender,
      street,
      barangay,
      city,
      province,
      region,
      postalCode,
    } = body;

    // Verify reCAPTCHA token
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'signup', 0.5);
      if (!recaptchaResult.success) {
        return NextResponse.json(
          { 
            error: 'Security verification failed. Please try again.',
            details: process.env.NODE_ENV === 'development' ? recaptchaResult.error : undefined
          },
          { status: 400 }
        );
      }
    } else if (process.env.NODE_ENV !== 'development') {
      // Require reCAPTCHA in production
      return NextResponse.json(
        { error: 'Security verification required' },
        { status: 400 }
      );
    }

    // Check rate limit (by IP + email)
    const rateLimitResult = await withRateLimit(request, 'register', email);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.message || 'Too many registration attempts. Please try again later.',
          resetAt: rateLimitResult.resetAt,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt?.toISOString() || '',
          }
        }
      );
    }

    // Connect to database
    await connectDB();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide name, email, and password' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Validate phone number format (10-11 digits)
    if (phone && !/^\d{10,11}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Phone number must be 10-11 digits' },
        { status: 400 }
      );
    }

    // Validate postal code format (4 digits for PH)
    if (postalCode && !/^\d{4}$/.test(postalCode)) {
      return NextResponse.json(
        { error: 'Postal code must be 4 digits' },
        { status: 400 }
      );
    }

    // Validate age (must be at least 13 years old)
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 13) {
        return NextResponse.json(
          { error: 'You must be at least 13 years old to register' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate verification token for magic link
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Normalize gender values coming from the frontend
    let normalizedGender: 'male' | 'female' | 'other' | '' = '';
    if (typeof gender === 'string') {
      const g = gender.toLowerCase();
      if (g === 'male') normalizedGender = 'male';
      else if (g === 'female') normalizedGender = 'female';
      else if (g === 'other' || g === 'prefer not to say' || g === 'prefer not to') normalizedGender = '';
      else normalizedGender = g as any;
    }

    // Build address object from individual fields if present
    const address = {
      street: street || undefined,
      barangay: barangay || undefined,
      city: city || undefined,
      province: province || undefined,
      region: region || undefined,
      postalCode: postalCode || undefined,
    };

    // Create new user (email starts as unverified)
    const user = await User.create({
      name,
      email,
      password, // Password will be hashed by the pre-save middleware
      phone: phone || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: normalizedGender,
      address,
      emailVerified: false,
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
        // Don't fail registration if email fails, but log it
      } else {
        console.log('Verification email sent successfully:', emailResult.messageId);
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Continue with registration even if email fails
    }

    // In development, also log the magic link for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development magic link for ${email}: ${magicLink}`);
    }

    // Reset rate limit on successful registration
    await resetRateLimit(`${request.headers.get('x-forwarded-for')}:${email}`, 'register');

    // Return success response (exclude password and sensitive data)
    return NextResponse.json(
      {
        message: 'Account created successfully! Please check your email for a verification link.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        developmentLink: process.env.NODE_ENV === 'development' ? magicLink : undefined,
      },
      { 
        status: 201,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        }
      }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: messages.join('. ') },
        { status: 400 }
      );
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}