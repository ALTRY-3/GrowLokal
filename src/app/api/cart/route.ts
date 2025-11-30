import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get user ID (authenticated user or session ID for guests)
async function getUserId(request: NextRequest): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.email) {
    return session.user.email; // Use email as user ID
  }
  
  // For guest users, use a session ID from cookie
  const sessionId = request.cookies.get('cart_session_id')?.value;
  if (sessionId) {
    return sessionId;
  }
  
  // Generate new session ID for guest
  const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  return newSessionId;
}

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await getUserId(request);
    const cart = await Cart.findOrCreateCart(userId);

    const response = NextResponse.json({
      success: true,
      data: cart,
    });

    // Set session cookie if it's a new guest
    if (userId.startsWith('guest_') && !request.cookies.get('cart_session_id')) {
      response.cookies.set('cart_session_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch cart',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/cart/add - Add item to cart
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await getUserId(request);
    const body = await request.json();
    
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product exists and get details
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.isAvailable || product.stock === 0) {
      return NextResponse.json(
        { success: false, message: 'Product is out of stock' },
        { status: 400 }
      );
    }

    if (quantity > product.stock) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Only ${product.stock} items available in stock` 
        },
        { status: 400 }
      );
    }

    // Get or create cart
    const cart = await Cart.findOrCreateCart(userId);

    // Add item to cart
    await cart.addItem(
      productId,
      product.name,
      product.price,
      product.thumbnailUrl,
      product.artistName,
      product.stock,
      quantity
    );

    const response = NextResponse.json({
      success: true,
      message: 'Item added to cart',
      data: cart,
    });

    // Set session cookie if it's a new guest
    if (userId.startsWith('guest_') && !request.cookies.get('cart_session_id')) {
      response.cookies.set('cart_session_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to add item to cart',
      },
      { status: 500 }
    );
  }
}

// PUT /api/cart/update - Update item quantity
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await getUserId(request);
    const body = await request.json();
    
    const { productId, quantity } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'Product ID and quantity are required' },
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

    await cart.updateItemQuantity(productId, quantity);

    return NextResponse.json({
      success: true,
      message: 'Cart updated',
      data: cart,
    });
  } catch (error: any) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update cart',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/clear - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const userId = await getUserId(request);
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      );
    }

    await cart.clearCart();

    return NextResponse.json({
      success: true,
      message: 'Cart cleared',
      data: cart,
    });
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clear cart',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
