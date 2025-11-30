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

    if (!user || !user.isSeller) {
      console.log("Seller profile not found for:", session.user.email);
      return NextResponse.json(
        { success: false, message: "Seller profile not found" },
        { status: 404 }
      );
    }

    console.log("Fetched seller profile:", {
      shopName: user.sellerProfile?.shopName,
      sellerStoryTitle: user.sellerProfile?.sellerStoryTitle,
      sellerStory: user.sellerProfile?.sellerStory?.substring(0, 50)
    });

    return NextResponse.json({
      success: true,
      data: user.sellerProfile
    });

  } catch (error) {
    console.error("Error fetching seller profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch seller profile" },
      { status: 500 }
    );
  }
}
