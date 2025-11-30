import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

// GET - Fetch user orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const identifiers = new Set<string>();
    if (session?.user?.email) {
      identifiers.add(session.user.email);
      identifiers.add(session.user.email.toLowerCase());
    }
    if (session?.user?.id) {
      identifiers.add(session.user.id);
    }

    const identifierList = Array.from(identifiers).filter(Boolean);

    if (!identifierList.length) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'all', 'pending', 'shipping', 'completed', 'cancelled'

    await connectDB();

    const query: Record<string, unknown> =
      identifierList.length === 1
        ? { userId: identifierList[0] }
        : { userId: { $in: identifierList } };
    
    if (status && status !== "all") {
      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        pending: "pending",
        "to pay": "pending",
        processing: "processing",
        "to ship": "processing",
        shipping: "shipped",
        "to receive": "shipped",
        completed: "delivered",
        delivered: "delivered",
        cancelled: "cancelled",
      };
      query.status = statusMap[status.toLowerCase()] || status;
    }

    const orders = await Order.find(query)
      .populate("items.productId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch orders";
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
