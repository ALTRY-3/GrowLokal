import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import ProductReview from "@/models/ProductReview";
import Order from "@/models/Order";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

const isValidObjectId = (value: string) =>
  mongoose.Types.ObjectId.isValid(value);

interface ReviewDoc {
  _id: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface UserDoc {
  _id: mongoose.Types.ObjectId;
  fullName?: string;
  name: string;
  email: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid product ID" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // Check if current user has purchased this product
    let canReview = false;
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email })
        .select("_id email")
        .lean() as { _id: mongoose.Types.ObjectId; email: string } | null;
      
      if (user) {
        const hasPurchased = await Order.exists({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
            { "shippingAddress.email": user.email },
          ],
          "items.productId": new mongoose.Types.ObjectId(id),
          "paymentDetails.status": "paid",
        });
        canReview = !!hasPurchased;
      }
    }

    // Only return reviews if user can review (has purchased)
    if (!canReview) {
      return NextResponse.json({
        success: true,
        data: {
          reviews: [],
          averageRating: 0,
          totalReviews: 0,
          canReview: false,
        },
      });
    }

    const reviewQuery = ProductReview.find({ productId: id })
      .sort({ createdAt: -1 })
      .lean();
    const productQuery = Product.findById(id).select(
      "averageRating totalReviews"
    );

    const [rawReviews, product] = await Promise.all([reviewQuery, productQuery]);
    const reviews: ReviewDoc[] = Array.isArray(rawReviews)
      ? (rawReviews as ReviewDoc[])
      : [];

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map((review: ReviewDoc) => ({
          id: review._id.toString(),
          userName: review.userName,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        })),
        averageRating: product?.averageRating ?? 0,
        totalReviews: product?.totalReviews ?? reviews.length,
        canReview: true,
      },
    });
  } catch (error) {
    console.error("Error fetching product reviews", error);
    return NextResponse.json(
      { success: false, message: "Failed to load reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid product ID" },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body as { rating?: number; comment?: string };

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || comment.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Review comment must be at least 10 characters",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const product = await Product.findById(id).select("_id");
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const user = (await User.findOne({ email: session.user.email })
      .select({ _id: 1, fullName: 1, name: 1, email: 1 })
      .lean()) as UserDoc | null;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if user has purchased this product (only paid orders)
    const hasPurchased = await Order.exists({
      $or: [
        { userId: user._id },
        { userId: user._id.toString() },
        { "shippingAddress.email": user.email },
      ],
      "items.productId": new mongoose.Types.ObjectId(id),
      "paymentDetails.status": "paid",
    });

    if (!hasPurchased) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only review products you have purchased",
        },
        { status: 403 }
      );
    }

    const reviewerName = user.fullName || user.name || "GrowLokal User";
    const sanitizedComment = comment.trim();

    const existingReview = await ProductReview.findOne({
      productId: id,
      userId: user._id,
    });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = sanitizedComment;
      await existingReview.save();
    } else {
      await ProductReview.create({
        productId: id,
        userId: user._id,
        userName: reviewerName,
        userEmail: user.email,
        rating,
        comment: sanitizedComment,
      });
    }

    // Re-calculate product rating stats
    const stats = await ProductReview.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const aggregatedStats = stats[0] || { averageRating: 0, totalReviews: 0 };

    await Product.findByIdAndUpdate(id, {
      averageRating: aggregatedStats.averageRating,
      totalReviews: aggregatedStats.totalReviews,
    });

    const freshReview = (await ProductReview.findOne({
      productId: id,
      userId: user._id,
    })
      .sort({ updatedAt: -1 })
      .lean()) as ReviewDoc | null;

    return NextResponse.json({
      success: true,
      message: existingReview ? "Review updated" : "Review submitted",
      data: freshReview
        ? {
            id: freshReview._id.toString(),
            userName: freshReview.userName,
            rating: freshReview.rating,
            comment: freshReview.comment,
            createdAt: freshReview.createdAt,
          }
        : null,
      averageRating: aggregatedStats.averageRating,
      totalReviews: aggregatedStats.totalReviews,
    });
  } catch (error) {
    console.error("Error submitting review", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit review" },
      { status: 500 }
    );
  }
}
