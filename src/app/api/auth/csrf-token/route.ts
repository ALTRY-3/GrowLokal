import { NextRequest, NextResponse } from 'next/server';
import { getCsrfTokenResponse } from '@/lib/csrf';

/**
 * Get CSRF token for client-side use
 */
export async function GET(req: NextRequest) {
  try {
    const { token, cookieOptions } = getCsrfTokenResponse();

    const response = NextResponse.json({ 
      csrfToken: token 
    });

    // Set CSRF token cookie
    response.cookies.set(cookieOptions);

    return response;
  } catch (error) {
    console.error('Get CSRF token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
