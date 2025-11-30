import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email })
      .select('isSeller sellerProfile');

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: user.sellerProfile?.applicationStatus || null,
      data: {
        isSeller: user.isSeller || false,
        applicationStatus: user.sellerProfile?.applicationStatus || null,
        shopName: user.sellerProfile?.shopName || null,
        submittedAt: user.sellerProfile?.applicationSubmittedAt || null,
        approvedAt: user.sellerProfile?.approvedAt || null
      }
    });

  } catch (error) {
    console.error("Error fetching seller status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch seller status" },
      { status: 500 }
    );
  }
}
