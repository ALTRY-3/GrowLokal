import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";

// GET - Fetch user's wishlist
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
    const user = await User.findById(session.user.id).populate({
      path: 'wishlist',
      select: '_id name price images thumbnailUrl artistName category craftType averageRating totalReviews isAvailable stock'
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.wishlist || [],
    });
  } catch (error: any) {
    console.error("Wishlist fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// POST - Add/Remove product from wishlist
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, action } = body; // action: 'add' or 'remove'

    if (!productId || !action) {
      return NextResponse.json(
        { success: false, message: "Product ID and action are required" },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action must be 'add' or 'remove'" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Initialize wishlist if it doesn't exist
    if (!user.wishlist) {
      user.wishlist = [];
    }

    let message = '';
    
    if (action === 'add') {
      // Check if product is already in wishlist
      if (user.wishlist.includes(productId)) {
        return NextResponse.json(
          { success: false, message: "Product already in wishlist" },
          { status: 400 }
        );
      }
      
      user.wishlist.push(productId);
      message = "Product added to wishlist";
    } else {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter((id: any) => id.toString() !== productId);
      message = "Product removed from wishlist";
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message,
      data: {
        wishlistCount: user.wishlist.length,
        isInWishlist: action === 'add'
      }
    });
  } catch (error: any) {
    console.error("Wishlist update error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// PUT - Toggle product in wishlist (add if not present, remove if present)
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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Initialize wishlist if it doesn't exist
    if (!user.wishlist) {
      user.wishlist = [];
    }

    let isInWishlist = false;
    let message = '';

    if (user.wishlist.includes(productId)) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter((id: any) => id.toString() !== productId);
      message = "Product removed from wishlist";
      isInWishlist = false;
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
      message = "Product added to wishlist";
      isInWishlist = true;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message,
      data: {
        wishlistCount: user.wishlist.length,
        isInWishlist
      }
    });
  } catch (error: any) {
    console.error("Wishlist toggle error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}