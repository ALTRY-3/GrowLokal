import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { createPaymentIntent, createSource } from '@/lib/paymongo/client';

// POST /api/payment/create-intent - Create payment intent for an order
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId, paymentMethod, provider } = body;

    const normalizedMethod = paymentMethod === 'ewallet'
      ? provider || 'gcash'
      : paymentMethod;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find the order
    // Check if orderId is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    const order = await Order.findOne(
      isValidObjectId
        ? { $or: [{ orderId }, { _id: orderId }] }
        : { orderId } // Only search by readable orderId if not valid ObjectId
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.paymentDetails.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Create payment based on method
    if (normalizedMethod === 'card') {
      // Create Payment Intent for card payments
      const paymentIntent = await createPaymentIntent({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'PHP',
        description: `Order ${order.orderId}`,
        statement_descriptor: 'GrowLokal',
        metadata: {
          orderId: order.orderId,
          orderMongoId: order._id.toString(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          clientKey: paymentIntent.attributes.client_key,
          publicKey: process.env.PAYMONGO_PUBLIC_KEY,
          status: paymentIntent.attributes.status,
          amount: paymentIntent.attributes.amount,
        },
      });
    } else if (normalizedMethod === 'gcash' || normalizedMethod === 'grab_pay') {
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.APP_URL ||
        'http://localhost:3000';

      const sourceType = normalizedMethod === 'grab_pay' ? 'grab_pay' : 'gcash';
      const metadata = {
        orderId: order.orderId,
        orderMongoId: order._id.toString(),
        userId: order.userId?.toString?.() || String(order.userId),
      };
      const source = await createSource({
        type: sourceType as 'gcash' | 'grab_pay',
        amount: Math.round(order.total * 100),
        currency: 'PHP',
        redirect: {
          success: `${baseUrl}/payment/ewallet/success?orderId=${order.orderId}`,
          failed: `${baseUrl}/payment/ewallet/failed?orderId=${order.orderId}`,
        },
        billing: {
          name: order.shippingAddress.fullName,
          email: order.shippingAddress.email,
          phone: order.shippingAddress.phone,
        },
        metadata,
      });

      return NextResponse.json({
        success: true,
        data: {
          sourceId: source.id,
          checkoutUrl: source.attributes.redirect.checkout_url,
          status: source.attributes.status,
          metadata,
        },
      });
    } else {
      // For COD, no payment processing needed
      return NextResponse.json({
        success: true,
        data: {
          paymentMethod: 'cod',
          message: 'Cash on Delivery - No payment processing needed',
        },
      });
    }
  } catch (error: any) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to create payment intent' 
      },
      { status: 500 }
    );
  }
}
