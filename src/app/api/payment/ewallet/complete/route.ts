import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { createPayment } from "@/lib/paymongo/client";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId, sourceId } = body;

    if (!orderId || !sourceId) {
      return NextResponse.json(
        { success: false, message: "Order ID and source ID are required" },
        { status: 400 }
      );
    }

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);

    const order = await Order.findOne(
      isValidObjectId
        ? { $or: [{ orderId }, { _id: orderId }] }
        : { orderId }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentDetails.status === "paid") {
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.orderId,
          paymentId: order.paymentDetails.transactionId,
          paymentStatus: "paid",
        },
      });
    }

    const payment = await createPayment(sourceId, `Order ${order.orderId}`, {
      orderId: order.orderId,
      orderMongoId: order._id.toString(),
      userId: order.userId?.toString?.() || String(order.userId),
    });
    const paymentStatus = payment.attributes.status;

    order.paymentDetails.transactionId = payment.id;

    if (paymentStatus === "paid") {
      await order.markAsPaid(payment.id);
      return NextResponse.json({
        success: true,
        message: "Payment confirmed",
        data: {
          orderId: order.orderId,
          paymentId: payment.id,
          paymentStatus,
        },
      });
    }

    if (paymentStatus === "failed" || paymentStatus === "cancelled") {
      order.paymentDetails.status = "failed";
      await order.save();
      return NextResponse.json(
        {
          success: false,
          message: "Payment failed",
          data: {
            orderId: order.orderId,
            paymentId: payment.id,
            paymentStatus,
          },
        },
        { status: 400 }
      );
    }

    order.paymentDetails.status = "pending";
    await order.save();

    return NextResponse.json(
      {
        success: true,
        message: "Payment pending confirmation",
        data: {
          orderId: order.orderId,
          paymentId: payment.id,
          paymentStatus,
          requiresWebhookConfirmation: true,
        },
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("PayMongo e-wallet completion error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to finalize e-wallet payment",
      },
      { status: 500 }
    );
  }
}
