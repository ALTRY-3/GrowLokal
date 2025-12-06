import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Cart from '@/models/Cart';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    // Get userId from session or cookie (for guest)
    let userId: string;
    if (session?.user?.email) {
      userId = session.user.email;
    } else {
      // For guest users, get from cookie
      const guestId = request.cookies.get('cart_session_id')?.value;
      if (!guestId) {
        return NextResponse.json(
          { success: false, message: 'No user session found' },
          { status: 401 }
        );
      }
      userId = guestId;
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Status filter
    const status = searchParams.get('status');
    const query: Record<string, unknown> = { userId };
    if (status) {
      query.status = status;
    }

    // Fetch orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch orders';
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      total,
    } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, message: 'Shipping address is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Get userId
    let userId: string;
    if (session?.user?.email) {
      userId = session.user.email;
    } else {
      const guestId = request.cookies.get('cart_session_id')?.value;
      if (!guestId) {
        // Generate guest ID
        userId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      } else {
        userId = guestId;
      }
    }

    // Validate stock availability for all items
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product ${item.name} not found` },
          { status: 404 }
        );
      }

      if (!product.isAvailable || product.stock < 1) {
        return NextResponse.json(
          { success: false, message: `Product ${item.name} is not available` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient stock for ${item.name}. Only ${product.stock} available` },
          { status: 400 }
        );
      }
    }

    // Generate order ID
    const orderId = await Order.generateOrderId();

    // Create order
    const order = await Order.create({
      orderId,
      userId,
      items,
      shippingAddress,
      paymentDetails: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'pending', // Will be updated after payment
      },
      subtotal,
      shippingFee,
      total,
      status: 'pending',
    });

    // Decrement product stock for each item
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user's cart after successful order
    try {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        await cart.clearCart();
      }
    } catch (cartError) {
      console.error('Error clearing cart:', cartError);
      // Don't fail the order if cart clearing fails
    }

    if (session?.user) {
      try {
        const recipientId = (session.user.id as string | undefined) || session.user.email;
        if (recipientId) {
          await createNotification({
            userId: recipientId,
            type: 'order',
            title: 'Order placed successfully',
            description: `Order #${order.orderId} has been placed. We will notify you as it progresses.`,
            metadata: {
              orderId: order.orderId,
              total: order.total,
              status: order.status,
            },
          });
        }
      } catch (notificationError) {
        console.error('Order notification error:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.orderId,
        _id: order._id,
        total: order.total,
        status: order.status,
      },
    }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create order';
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
