import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/cart/merge - Merge guest cart with user cart after login
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const guestSessionId = request.cookies.get('cart_session_id')?.value;
    
    if (!guestSessionId || !guestSessionId.startsWith('guest_')) {
      // No guest cart to merge
      const userCart = await Cart.findOrCreateCart(session.user.email);
      return NextResponse.json({
        success: true,
        message: 'No guest cart to merge',
        data: userCart,
      });
    }

    // Merge guest cart with user cart
    const mergedCart = await Cart.mergeGuestCart(guestSessionId, session.user.email);

    const response = NextResponse.json({
      success: true,
      message: 'Carts merged successfully',
      data: mergedCart,
    });

    // Clear the guest session cookie
    response.cookies.delete('cart_session_id');

    return response;
  } catch (error: any) {
    console.error('Error merging carts:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to merge carts',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
