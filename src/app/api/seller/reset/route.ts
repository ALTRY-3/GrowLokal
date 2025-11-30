import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Reset seller status for testing
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $unset: {
          sellerProfile: 1
        },
        $set: {
          isSeller: false
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("Reset seller status for:", session.user.email);

    return NextResponse.json({
      success: true,
      message: "Seller status reset successfully. You can now apply again."
    });

  } catch (error) {
    console.error("Error resetting seller status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset seller status" },
      { status: 500 }
    );
  }
}