import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

interface StoryResponse {
  id: string;
  title: string;
  artist: string;
  excerpt: string;
  img: string;
  category?: string;
  craftType?: string;
  location?: string;
  profilePic?: string;
  storeUrl: string;
}

export async function GET() {
  try {
    await dbConnect();

    const sellers = await User.find({
      isSeller: true,
      "sellerProfile.applicationStatus": "approved",
      "sellerProfile.sellerStory": { $exists: true, $ne: "" },
    })
      .select({
        name: 1,
        fullName: 1,
        profilePicture: 1,
        address: 1,
        "sellerProfile.shopName": 1,
        "sellerProfile.businessType": 1,
        "sellerProfile.shopDescription": 1,
        "sellerProfile.sellerStoryTitle": 1,
        "sellerProfile.sellerStory": 1,
        "sellerProfile.sellerPhoto": 1,
        "sellerProfile.pickupAddress": 1,
        "sellerProfile.approvedAt": 1,
      })
      .sort({ "sellerProfile.approvedAt": -1, createdAt: -1 });

    const stories: StoryResponse[] = sellers.map((seller) => {
      const fallbackArtist = seller.sellerProfile?.shopName
        ? `${seller.sellerProfile.shopName} Artisan`
        : "Local Artisan";

      const location =
        seller.sellerProfile?.pickupAddress?.barangay ??
        seller.sellerProfile?.pickupAddress?.city ??
        seller.address?.barangay ??
        seller.address?.city ??
        "Olongapo";

      const profilePicture = seller.profilePicture || "";
      const heroImage =
        seller.sellerProfile?.sellerPhoto ||
        profilePicture ||
        "/artisans4.jpeg";

      const craftLabel =
        seller.sellerProfile?.shopDescription ||
        seller.sellerProfile?.sellerStoryTitle ||
        seller.sellerProfile?.shopName ||
        null;

      return {
        id: seller._id.toString(),
        title:
          seller.sellerProfile?.sellerStoryTitle ||
          (seller.sellerProfile?.shopName
            ? `${seller.sellerProfile.shopName} Story`
            : "Artisan Story"),
        artist: seller.fullName || seller.name || fallbackArtist,
        excerpt: seller.sellerProfile?.sellerStory || "",
        img: heroImage,
        category: seller.sellerProfile?.businessType || "Handcrafted Goods",
        craftType: craftLabel || undefined,
        location,
        profilePic: profilePicture,
        storeUrl: `/artisan/${seller._id.toString()}`,
      };
    });

    return NextResponse.json({ success: true, data: stories });
  } catch (error) {
    console.error("Error fetching artisan stories", error);
    return NextResponse.json(
      { success: false, message: "Failed to load artisan stories" },
      { status: 500 }
    );
  }
}
