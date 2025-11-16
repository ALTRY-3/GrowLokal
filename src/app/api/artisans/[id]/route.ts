import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";

function formatCurrency(value?: number) {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(value);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const sanitizeUrl = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid artisan id" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const seller = await User.findById(id).select({
      name: 1,
      fullName: 1,
      email: 1,
      profilePicture: 1,
      address: 1,
      isSeller: 1,
      createdAt: 1,
      sellerProfile: 1,
    });

    if (
      !seller ||
      !seller.isSeller ||
      seller.sellerProfile?.applicationStatus !== "approved"
    ) {
      return NextResponse.json(
        { success: false, message: "Artisan not found" },
        { status: 404 }
      );
    }

    const products = await Product.find({ artistId: id, isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .select({
        name: 1,
        price: 1,
        images: 1,
        averageRating: 1,
        totalReviews: 1,
        stock: 1,
        category: 1,
        subcategory: 1,
        isAvailable: 1,
      });

    const pickupAddress = seller.sellerProfile?.pickupAddress;
    const location =
      pickupAddress?.barangay ||
      pickupAddress?.city ||
      seller.address?.barangay ||
      seller.address?.city ||
      "Olongapo";

    const joinedDate = seller.sellerProfile?.approvedAt || seller.createdAt;

    const craftLabel =
      seller.sellerProfile?.shopDescription ||
      seller.sellerProfile?.sellerStoryTitle ||
      seller.sellerProfile?.shopName ||
      null;

    const socialLinks = seller.sellerProfile?.socialMediaLinks || {};

    return NextResponse.json({
      success: true,
      data: {
        id: seller._id.toString(),
        shopName:
          seller.sellerProfile?.shopName || seller.fullName || seller.name,
        artistName: seller.fullName || seller.name,
        category: seller.sellerProfile?.businessType || "Handicrafts",
        craftType: craftLabel,
        location,
        joined: joinedDate,
        storyTitle:
          seller.sellerProfile?.sellerStoryTitle || "Artisan Story",
        storyExcerpt: seller.sellerProfile?.sellerStory || "",
        storyImage:
          seller.sellerProfile?.sellerPhoto || seller.profilePicture || null,
        avatar:
          seller.profilePicture ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            seller.fullName || seller.name || "Artisan"
          )}`,
        contactEmail:
          seller.sellerProfile?.shopEmail?.trim() || seller.email || null,
        contactPhone: seller.sellerProfile?.shopPhone?.trim() || null,
        socialMedia: {
          facebook: sanitizeUrl(socialLinks.facebook),
          instagram: sanitizeUrl(socialLinks.instagram),
          tiktok: sanitizeUrl(socialLinks.tiktok),
        },
        products: products.map((product) => ({
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          priceLabel: formatCurrency(product.price),
          images: product.images,
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          isAvailable: product.isAvailable,
          stock: product.stock,
          category: product.category,
          craftType: product.subcategory,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching artisan profile", error);
    return NextResponse.json(
      { success: false, message: "Failed to load artisan" },
      { status: 500 }
    );
  }
}
