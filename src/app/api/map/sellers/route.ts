import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import { geocodeLocation } from "@/lib/geocode";
import type { IUser } from "@/models/User";
import type { Types } from "mongoose";

export const revalidate = 0;

interface SellerRecord {
  _id: Types.ObjectId;
  name: string;
  fullName?: string;
  profilePicture?: string;
  address?: IUser["address"];
  sellerProfile?: IUser["sellerProfile"];
  createdAt: Date;
}

interface SellerMarker {
  id: string;
  name: string;
  shopName: string;
  avatar: string;
  craftType: string;
  category: string;
  location: string;
  lat: number;
  lng: number;
  productCount: number;
  ratingCount: number;
  averageRating: number;
  shopUrl: string;
}

const diceBearAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const sanitize = (value?: string | null) => value?.trim() || "";

const buildAvatar = (seller: SellerRecord) =>
  seller.profilePicture ||
  seller.sellerProfile?.sellerPhoto ||
  diceBearAvatar(seller.fullName || seller.name || "GrowLokal Artisan");

const buildCraftLabel = (seller: SellerRecord) =>
  seller.sellerProfile?.businessType ||
  seller.sellerProfile?.shopDescription ||
  seller.sellerProfile?.sellerStoryTitle ||
  "Local Crafts";

const buildLocationLabels = (seller: SellerRecord) => {
  const pickup = seller.sellerProfile?.pickupAddress;
  const address = seller.address;

  const displayParts = new Set<string>();
  const searchParts = new Set<string>();

  const pushDisplay = (value?: string | null) => {
    const trimmed = sanitize(value);
    if (trimmed) {
      displayParts.add(trimmed);
    }
  };

  const pushSearch = (value?: string | null) => {
    const trimmed = sanitize(value);
    if (trimmed) {
      searchParts.add(trimmed);
    }
  };

  pushDisplay(pickup?.otherDetails);
  pushDisplay(pickup?.barangay);
  pushDisplay(address?.barangay);
  pushDisplay(address?.city);
  pushDisplay(address?.province);

  pushSearch(pickup?.barangay);
  pushSearch(address?.barangay);
  pushSearch(address?.city);
  pushSearch(address?.province);

  const displayLabel =
    Array.from(displayParts).filter(Boolean).join(", ") || "Olongapo City";
  const searchLabel =
    Array.from(searchParts).filter(Boolean).join(", ") || displayLabel;

  return {
    displayLabel,
    fullLabel: `${searchLabel}, Philippines`,
  };
};

export async function GET() {
  try {
    await dbConnect();

    const sellers: SellerRecord[] = await User.find({
      isSeller: true,
      "sellerProfile.applicationStatus": "approved",
    })
      .select({
        name: 1,
        fullName: 1,
        profilePicture: 1,
        address: 1,
        sellerProfile: 1,
        createdAt: 1,
      })
      .lean<SellerRecord[]>();

    if (!sellers.length) {
      return NextResponse.json({ success: true, data: [] });
    }

    const sellerIds = sellers.map((seller) => seller._id);

    const productStats = await Product.aggregate([
      {
        $match: {
          artistId: { $in: sellerIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$artistId",
          productCount: { $sum: 1 },
          ratingCount: { $sum: "$totalReviews" },
          ratingTotal: {
            $sum: { $multiply: ["$averageRating", "$totalReviews"] },
          },
        },
      },
    ]);

    const statsMap = new Map<
      string,
      { productCount: number; ratingCount: number; averageRating: number }
    >();

    productStats.forEach((stat) => {
      const ratingCount = stat.ratingCount ?? 0;
      const ratingTotal = stat.ratingTotal ?? 0;
      statsMap.set(stat._id.toString(), {
        productCount: stat.productCount ?? 0,
        ratingCount,
        averageRating: ratingCount > 0 ? ratingTotal / ratingCount : 0,
      });
    });

    const markers: SellerMarker[] = [];

    for (const seller of sellers) {
      const sellerId = seller._id.toString();
      const labels = buildLocationLabels(seller);
      const coords = await geocodeLocation(labels.fullLabel, {
        seed: sellerId,
      });
      const stats =
        statsMap.get(sellerId) ?? {
          productCount: 0,
          ratingCount: 0,
          averageRating: 0,
        };

      markers.push({
        id: sellerId,
        name: seller.fullName || seller.name,
        shopName: seller.sellerProfile?.shopName || seller.fullName || seller.name,
        avatar: buildAvatar(seller),
        craftType: buildCraftLabel(seller),
        category: seller.sellerProfile?.businessType || "Handicrafts",
        location: labels.displayLabel,
        lat: Number(coords.lat.toFixed(6)),
        lng: Number(coords.lng.toFixed(6)),
        productCount: stats.productCount,
        ratingCount: stats.ratingCount,
        averageRating: Number(stats.averageRating.toFixed(2)),
        shopUrl: `/artisan/${sellerId}`,
      });
    }

    return NextResponse.json({ success: true, data: markers });
  } catch (error) {
    console.error("Error fetching seller markers", error);
    return NextResponse.json(
      { success: false, message: "Failed to load seller map data" },
      { status: 500 }
    );
  }
}
