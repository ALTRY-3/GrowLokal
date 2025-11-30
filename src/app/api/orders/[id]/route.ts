import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { authOptions } from '@/lib/auth';

// GET /api/orders/[id] - Get single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const { id: orderId } = await params;

    // Get userId
    let userId: string | undefined;
    if (session?.user?.email) {
      userId = session.user.email;
    } else {
      userId = request.cookies.get('cart_session_id')?.value;
    }

    // Find order
    // Check if orderId is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    const order = await Order.findOne(
      isValidObjectId
        ? {
            $or: [
              { orderId }, // Find by readable order ID
              { _id: orderId } // Or by MongoDB _id
            ]
          }
        : { orderId } // Only search by readable orderId if not valid ObjectId
    ).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user owns this order (for logged-in users only)
    // For guest checkout, we allow access since there's no strict session management yet
    // TODO: In production, implement proper order access tokens or session-based verification
    if (userId && order.userId && order.userId.toString() !== userId) {
      // Only enforce for logged-in users
      if (session?.user?.email) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized access to order' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order (status, tracking, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const { id: orderId } = await params;
    const body = await request.json();

    const { status, trackingNumber, notes, paymentStatus, transactionId } = body;

    // Find order
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await Order.findOne(
      isValidObjectId
        ? { $or: [{ orderId }, { _id: orderId }] }
        : { orderId }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (status) {
      await order.updateStatus(status);
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (notes) {
      order.notes = notes;
    }

    if (paymentStatus === 'paid' && transactionId) {
      await order.markAsPaid(transactionId);
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const { id: orderId } = await params;

    // Get userId
    let userId: string | undefined;
    if (session?.user?.email) {
      userId = session.user.email;
    } else {
      userId = request.cookies.get('cart_session_id')?.value;
    }

    // Find order
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await Order.findOne(
      isValidObjectId
        ? { $or: [{ orderId }, { _id: orderId }] }
        : { orderId }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user owns this order
    if (userId && order.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to order' },
        { status: 403 }
      );
    }

    // Cancel order
    await order.cancel();

    // Restore product stock
    const Product = (await import('@/models/Product')).default;
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
