import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import mongoose from "mongoose";

// PUT - Confirm order receipt
export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { orderId } = await params;

    // Build query to find by either MongoDB _id or readable orderId
    // Also check by email for legacy orders
    const userIdentifiers = [session.user.id];
    if (session.user.email) {
      userIdentifiers.push(session.user.email);
      userIdentifiers.push(session.user.email.toLowerCase());
    }

    let order = null;

    // Try finding by MongoDB ObjectId first
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findOne({
        _id: orderId,
        userId: { $in: userIdentifiers },
      });
    }

    // If not found, try finding by readable orderId
    if (!order) {
      order = await Order.findOne({
        orderId: orderId,
        userId: { $in: userIdentifiers },
      });
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Update status to delivered/completed
    order.status = "delivered";
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order confirmed as received",
      data: order,
    });
  } catch (error: any) {
    console.error("Order confirm error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to confirm order" },
      { status: 500 }
    );
  }
}
