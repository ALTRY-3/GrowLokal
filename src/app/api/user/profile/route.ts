import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// GET - Fetch user profile
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fullName: user.fullName || user.name,
        email: user.email,
        phone: user.phone || "",
        profilePicture: user.profilePicture || "/default-profile.jpg",
        address: {
          street: user.address?.street || "",
          barangay: user.address?.barangay || "",
          city: user.address?.city || "",
          province: user.address?.province || "",
          region: user.address?.region || "",
          postalCode: user.address?.postalCode || "",
        },
        gender: user.gender || "",
        isSeller: user.isSeller || false,
        sellerApplicationStatus: user.sellerProfile?.applicationStatus || null,
      },
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, phone, address, gender, profilePicture } = body;

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        fullName,
        phone,
        address,
        gender,
        profilePicture,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        address: user.address,
        gender: user.gender,
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
