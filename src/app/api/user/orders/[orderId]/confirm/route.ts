import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

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

    const order = await Order.findOne({
      _id: params.orderId,
      userId: session.user.id,
    });

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
