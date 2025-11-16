import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get user ID
async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.email) {
    return session.user.email;
  }
  
  const sessionId = request.cookies.get('cart_session_id')?.value;
  return sessionId || null;
}

// DELETE /api/cart/remove - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
): Promise<NextResponse> {
  try {
    await connectDB();
    
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'No cart session found' },
        { status: 400 }
      );
    }

    const { productId } = params;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      );
    }

    await cart.removeItem(productId);

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (error: any) {
    console.error('Error removing item from cart:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to remove item from cart',
      },
      { status: 500 }
    );
  }
}
