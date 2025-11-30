import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

// PUT - Rate order
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

    const body = await request.json();
    const { rating } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
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

    // Only allow rating for delivered orders
    if (order.status !== "delivered") {
      return NextResponse.json(
        { success: false, message: "Can only rate delivered orders" },
        { status: 400 }
      );
    }

    // Update rating (you might want to add a rating field to Order model)
    // For now, storing in notes or create a separate Review model
    order.notes = `${order.notes || ''}\nRating: ${rating}/5`;
    await order.save();

    return NextResponse.json({
      success: true,
      message: "Order rated successfully",
      data: { orderId: order._id, rating },
    });
  } catch (error: any) {
    console.error("Order rating error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to rate order" },
      { status: 500 }
    );
  }
}
