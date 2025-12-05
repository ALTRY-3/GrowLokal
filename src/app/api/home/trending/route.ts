import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import User from "@/models/User";

// GET /api/home/trending - Get trending data for home page sections
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || "all";

    const results: any = {};

    // Trending Crafts - Based on view count and recent activity
    if (section === "all" || section === "crafts") {
      const trendingCrafts = await Product.find({
        isActive: true,
        stock: { $gt: 0 },
      })
        .sort({ viewCount: -1, averageRating: -1 })
        .limit(8)
        .select({
          name: 1,
          price: 1,
          artistName: 1,
          category: 1,
          subcategory: 1,
          images: 1,
          thumbnailUrl: 1,
          viewCount: 1,
          averageRating: 1,
          artistId: 1,
        })
        .lean();

      // Get artist locations
      const artistIds = [...new Set(trendingCrafts.map((p) => p.artistId?.toString()).filter(Boolean))];
      const artists = await User.find({ _id: { $in: artistIds } })
        .select({ "sellerProfile.pickupAddress.barangay": 1, address: 1 })
        .lean();

      const artistLocationMap = new Map(
        artists.map((a: any) => [
          a._id.toString(),
          a.sellerProfile?.pickupAddress?.barangay || a.address?.barangay || "Olongapo",
        ])
      );

      results.trendingCrafts = trendingCrafts.map((product: any) => ({
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        artist: product.artistName,
        category: product.category,
        craftType: product.subcategory || product.category,
        barangay: artistLocationMap.get(product.artistId?.toString()) || "Olongapo",
        image: product.thumbnailUrl || product.images?.[0] || "/box6.png",
        trendingCount: product.viewCount || 0,
        rating: product.averageRating || 0,
        artistId: product.artistId?.toString(),
      }));
    }

    // Newest Uploads - Products created in the last 30 days, sorted by creation date
    if (section === "all" || section === "newest") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newestProducts = await Product.find({
        isActive: true,
        createdAt: { $gte: thirtyDaysAgo },
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select({
          name: 1,
          price: 1,
          artistName: 1,
          category: 1,
          subcategory: 1,
          images: 1,
          thumbnailUrl: 1,
          createdAt: 1,
          artistId: 1,
        })
        .lean();

      // Get artist locations
      const artistIds = [...new Set(newestProducts.map((p) => p.artistId?.toString()).filter(Boolean))];
      const artists = await User.find({ _id: { $in: artistIds } })
        .select({ "sellerProfile.pickupAddress.barangay": 1, address: 1 })
        .lean();

      const artistLocationMap = new Map(
        artists.map((a: any) => [
          a._id.toString(),
          a.sellerProfile?.pickupAddress?.barangay || a.address?.barangay || "Olongapo",
        ])
      );

      results.newestUploads = newestProducts.map((product: any) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          artist: product.artistName,
          category: product.category,
          craftType: product.subcategory || product.category,
          barangay: artistLocationMap.get(product.artistId?.toString()) || "Olongapo",
          image: product.thumbnailUrl || product.images?.[0] || "/box6.png",
          uploadedDaysAgo: daysAgo,
          artistId: product.artistId?.toString(),
        };
      });
    }

    // Most Viewed - High view count products (simulating "by travelers")
    if (section === "all" || section === "mostViewed") {
      const mostViewedProducts = await Product.find({
        isActive: true,
        viewCount: { $gt: 0 },
      })
        .sort({ viewCount: -1, totalReviews: -1 })
        .limit(8)
        .select({
          name: 1,
          price: 1,
          artistName: 1,
          category: 1,
          subcategory: 1,
          images: 1,
          thumbnailUrl: 1,
          viewCount: 1,
          artistId: 1,
        })
        .lean();

      // Get artist locations
      const artistIds = [...new Set(mostViewedProducts.map((p) => p.artistId?.toString()).filter(Boolean))];
      const artists = await User.find({ _id: { $in: artistIds } })
        .select({ "sellerProfile.pickupAddress.barangay": 1, address: 1 })
        .lean();

      const artistLocationMap = new Map(
        artists.map((a: any) => [
          a._id.toString(),
          a.sellerProfile?.pickupAddress?.barangay || a.address?.barangay || "Olongapo",
        ])
      );

      results.mostViewed = mostViewedProducts.map((product: any) => ({
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        artist: product.artistName,
        category: product.category,
        craftType: product.subcategory || product.category,
        barangay: artistLocationMap.get(product.artistId?.toString()) || "Olongapo",
        image: product.thumbnailUrl || product.images?.[0] || "/box6.png",
        travelersViews: product.viewCount || 0,
        artistId: product.artistId?.toString(),
      }));
    }

    // Trending Artisan Shops - Sellers with most products and best ratings
    if (section === "all" || section === "artisans") {
      // Get product counts and average ratings per artist
      const artistStats = await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$artistId",
            productsCount: { $sum: 1 },
            avgRating: { $avg: "$averageRating" },
            totalViews: { $sum: "$viewCount" },
          },
        },
        { $sort: { totalViews: -1, productsCount: -1 } },
        { $limit: 8 },
      ]);

      const artistIds = artistStats.map((a) => a._id);
      const sellers = await User.find({
        _id: { $in: artistIds },
        isSeller: true,
      })
        .select({
          name: 1,
          fullName: 1,
          profilePicture: 1,
          "sellerProfile.shopName": 1,
          "sellerProfile.businessType": 1,
          "sellerProfile.pickupAddress.barangay": 1,
          address: 1,
        })
        .lean();

      const sellerMap = new Map(sellers.map((s: any) => [s._id.toString(), s]));

      results.trendingArtisans = artistStats
        .map((stat: any) => {
          const seller = sellerMap.get(stat._id?.toString());
          if (!seller) return null;

          return {
            id: stat._id?.toString(),
            name: (seller as any).fullName || (seller as any).name || "Artisan",
            shopName: (seller as any).sellerProfile?.shopName,
            avatar:
              (seller as any).profilePicture ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${(seller as any).name || "artisan"}`,
            craftType: (seller as any).sellerProfile?.businessType || "Handicrafts",
            category: (seller as any).sellerProfile?.businessType || "Handicrafts",
            location:
              (seller as any).sellerProfile?.pickupAddress?.barangay ||
              (seller as any).address?.barangay ||
              "Olongapo",
            rating: Math.round((stat.avgRating || 0) * 10) / 10,
            productsCount: stat.productsCount,
            viewsThisWeek: stat.totalViews || 0,
          };
        })
        .filter(Boolean);
    }

    // Trending Local Events - use curated/static events (until events model exists)
    if (section === "all" || section === "events") {
      const today = new Date();
      const baseEvents = [
        {
          id: "e1",
          title: "Handcraft Workshop: Buri Weaving",
          dateOffsetDays: 3,
          location: "Asinan Community Center",
          type: "Workshop",
          viewsThisWeek: 234,
        },
        {
          id: "e2",
          title: "Olongapo Artisan Market",
          dateOffsetDays: 6,
          location: "Subic Bay Freeport Zone",
          type: "Market",
          viewsThisWeek: 189,
        },
        {
          id: "e3",
          title: "Cultural Heritage Tour",
          dateOffsetDays: 9,
          location: "Downtown Olongapo",
          type: "Tour",
          viewsThisWeek: 156,
        },
        {
          id: "e4",
          title: "Local Craft Fair 2024",
          dateOffsetDays: 14,
          location: "Olongapo Convention Center",
          type: "Fair",
          viewsThisWeek: 312,
        },
        {
          id: "e5",
          title: "Sip and Sketch 'Gapo",
          dateOffsetDays: 18,
          location: "Sibul Kapihan, Olongapo",
          type: "Exhibition",
          viewsThisWeek: 205,
        },
      ];

      results.trendingEvents = baseEvents.map((evt) => {
        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + evt.dateOffsetDays);
        return {
          id: evt.id,
          title: evt.title,
          date: eventDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          location: evt.location,
          type: evt.type,
          viewsThisWeek: evt.viewsThisWeek,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching trending data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch trending data" },
      { status: 500 }
    );
  }
}
