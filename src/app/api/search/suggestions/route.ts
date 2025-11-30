import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { expandQuery } from "@/lib/search";

interface Suggestion {
  type: "product" | "category" | "craftType" | "artist" | "keyword" | "trending" | "personalized";
  text: string;
  count?: number;
  productId?: string;
  thumbnailUrl?: string;
  price?: number;
  reason?: string; // Why this suggestion is shown
  rating?: number;
  reviewCount?: number;
}

/**
 * GET /api/search/suggestions - Get real-time intelligent search suggestions
 * 
 * Query Parameters:
 * - q: Search query (required for search, optional for personalized suggestions)
 * - limit: Maximum suggestions (default: 10, max: 20)
 * - recentViews: Comma-separated product IDs user recently viewed
 * - recentSearches: Comma-separated recent search terms
 * - interests: Comma-separated categories/craft types user is interested in
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);
    
    // Personalization parameters
    const recentViews = searchParams.get("recentViews")?.split(",").filter(Boolean) || [];
    const recentSearchTerms = searchParams.get("recentSearches")?.split(",").filter(Boolean) || [];
    const interests = searchParams.get("interests")?.split(",").filter(Boolean) || [];

    const suggestions: Suggestion[] = [];

    // If no query, return personalized/trending suggestions
    if (query.length < 2) {
      return await getPersonalizedSuggestions(suggestions, recentViews, recentSearchTerms, interests, limit);
    }

    const expandedTerms = expandQuery(query);
    const regexQuery = { $regex: query, $options: "i" };

    // 1. Product name suggestions with rich data (prioritize by relevance + popularity)
    const productSuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            { name: regexQuery },
            { tags: { $elemMatch: regexQuery } },
            { description: regexQuery },
          ],
        },
      },
      {
        $addFields: {
          // Relevance score based on match position and type
          relevanceScore: {
            $add: [
              // Exact name start match = highest score
              { $cond: [{ $eq: [{ $indexOfCP: [{ $toLower: "$name" }, query.toLowerCase()] }, 0] }, 100, 0] },
              // Name contains query
              { $cond: [{ $regexMatch: { input: { $toLower: "$name" }, regex: query.toLowerCase() } }, 50, 0] },
              // Tag match
              { $cond: [{ $gt: [{ $size: { $ifNull: [{ $filter: { input: { $ifNull: ["$tags", []] }, as: "tag", cond: { $regexMatch: { input: "$$tag", regex: query, options: "i" } } } }, []] } }, 0] }, 20, 0] },
              // Popularity boost (based on rating and reviews)
              { $multiply: [{ $ifNull: ["$averageRating", 0] }, 5] },
              { $multiply: [{ $min: [{ $ifNull: ["$totalReviews", 0] }, 100] }, 0.2] },
            ]
          }
        }
      },
      {
        $project: {
          name: 1,
          thumbnailUrl: 1,
          price: 1,
          category: 1,
          craftType: 1,
          artistName: 1,
          averageRating: 1,
          totalReviews: 1,
          relevanceScore: 1,
        },
      },
      { $sort: { relevanceScore: -1, name: 1 } },
      { $limit: 6 },
    ]);

    productSuggestions.forEach((product) => {
      const isExactMatch = product.name.toLowerCase().startsWith(query.toLowerCase());
      suggestions.push({
        type: "product",
        text: product.name,
        productId: product._id.toString(),
        thumbnailUrl: product.thumbnailUrl,
        price: product.price,
        rating: product.averageRating,
        reviewCount: product.totalReviews,
        reason: isExactMatch ? "Best match" : "Related product",
      });
    });

    // 2. Category suggestions
    const categorySuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          category: regexQuery,
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    categorySuggestions.forEach((cat) => {
      suggestions.push({
        type: "category",
        text: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
        count: cat.count,
      });
    });

    // 3. Craft type suggestions
    const craftTypeSuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          craftType: { $exists: true, $ne: null },
          $or: [
            { craftType: regexQuery },
            ...expandedTerms.map(term => ({ craftType: { $regex: term, $options: "i" } })),
          ],
        },
      },
      {
        $group: {
          _id: "$craftType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    craftTypeSuggestions.forEach((craft) => {
      if (craft._id) {
        suggestions.push({
          type: "craftType",
          text: craft._id,
          count: craft.count,
        });
      }
    });

    // 4. Artist suggestions
    const artistSuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          artistName: regexQuery,
        },
      },
      {
        $group: {
          _id: "$artistName",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    artistSuggestions.forEach((artist) => {
      suggestions.push({
        type: "artist",
        text: artist._id,
        count: artist.count,
      });
    });

    // 5. Keyword suggestions from tags
    const tagSuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          tags: { $elemMatch: regexQuery },
        },
      },
      { $unwind: "$tags" },
      {
        $match: {
          tags: regexQuery,
        },
      },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    tagSuggestions.forEach((tag) => {
      // Avoid duplicates with product names
      if (!suggestions.some(s => s.text.toLowerCase() === tag._id.toLowerCase())) {
        suggestions.push({
          type: "keyword",
          text: tag._id,
          count: tag.count,
        });
      }
    });

    // Sort and limit final suggestions
    // Prioritize: exact matches > products > categories > keywords
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // Products first if they match exactly
        if (a.type === "product" && a.text.toLowerCase().startsWith(query.toLowerCase())) return -1;
        if (b.type === "product" && b.text.toLowerCase().startsWith(query.toLowerCase())) return 1;
        
        // Then by type priority
        const typePriority: Record<string, number> = {
          product: 1,
          trending: 2,
          personalized: 3,
          category: 4,
          craftType: 5,
          artist: 6,
          keyword: 7,
        };
        return typePriority[a.type] - typePriority[b.type];
      })
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        suggestions: sortedSuggestions,
        query,
        expandedTerms: expandedTerms.slice(0, 5), // Show what synonyms were considered
      },
    });

  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to get suggestions",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

/**
 * Get personalized suggestions when there's no search query
 * Based on recent views, searches, and interests
 */
async function getPersonalizedSuggestions(
  suggestions: Suggestion[],
  recentViews: string[],
  recentSearchTerms: string[],
  interests: string[],
  limit: number
) {
  // 1. Trending products (most reviewed/rated recently)
  const trendingProducts = await Product.aggregate([
    {
      $match: {
        isActive: true,
        averageRating: { $gte: 3.5 },
      },
    },
    {
      $addFields: {
        trendScore: {
          $add: [
            { $multiply: [{ $ifNull: ["$averageRating", 0] }, 10] },
            { $multiply: [{ $min: [{ $ifNull: ["$totalReviews", 0] }, 50] }, 2] },
          ]
        }
      }
    },
    { $sort: { trendScore: -1, updatedAt: -1 } },
    { $limit: 4 },
    {
      $project: {
        name: 1,
        thumbnailUrl: 1,
        price: 1,
        category: 1,
        averageRating: 1,
        totalReviews: 1,
      }
    }
  ]);

  trendingProducts.forEach((product) => {
    suggestions.push({
      type: "trending",
      text: product.name,
      productId: product._id.toString(),
      thumbnailUrl: product.thumbnailUrl,
      price: product.price,
      rating: product.averageRating,
      reviewCount: product.totalReviews,
      reason: "Trending now",
    });
  });

  // 2. Products similar to recently viewed (if available)
  if (recentViews.length > 0) {
    try {
      const viewedProductIds = recentViews.slice(0, 3).map(id => {
        try { 
          return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null; 
        } catch { 
          return null; 
        }
      }).filter(Boolean) as mongoose.Types.ObjectId[];

      if (viewedProductIds.length > 0) {
        // Get categories of viewed products
        const viewedProducts = await Product.find(
          { _id: { $in: viewedProductIds } },
          { category: 1, craftType: 1, artistName: 1 }
        ).lean() as Array<{ category?: string; craftType?: string; artistName?: string }>;

        const viewedCategories = [...new Set(viewedProducts.map(p => p.category).filter(Boolean))];
        const viewedCraftTypes = [...new Set(viewedProducts.map(p => p.craftType).filter(Boolean))];

        // Find similar products
        const similarProducts = await Product.aggregate([
          {
            $match: {
              isActive: true,
              _id: { $nin: viewedProductIds },
              $or: [
                { category: { $in: viewedCategories } },
                ...(viewedCraftTypes.length > 0 ? [{ craftType: { $in: viewedCraftTypes } }] : []),
              ]
            }
          },
          { $sample: { size: 3 } },
          {
            $project: {
              name: 1,
              thumbnailUrl: 1,
              price: 1,
              category: 1,
              averageRating: 1,
              totalReviews: 1,
            }
          }
        ]);

        similarProducts.forEach((product) => {
          if (!suggestions.some(s => s.productId === product._id.toString())) {
            suggestions.push({
              type: "personalized",
              text: product.name,
              productId: product._id.toString(),
              thumbnailUrl: product.thumbnailUrl,
              price: product.price,
              rating: product.averageRating,
              reviewCount: product.totalReviews,
              reason: "Based on your views",
            });
          }
        });
      }
    } catch (e) {
      console.error("Error getting similar products:", e);
    }
  }

  // 3. Products matching user interests
  if (interests.length > 0) {
    const interestProducts = await Product.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            { category: { $in: interests.map(i => new RegExp(i, "i")) } },
            { craftType: { $in: interests.map(i => new RegExp(i, "i")) } },
          ]
        }
      },
      { $sample: { size: 3 } },
      {
        $project: {
          name: 1,
          thumbnailUrl: 1,
          price: 1,
          category: 1,
          averageRating: 1,
          totalReviews: 1,
        }
      }
    ]);

    interestProducts.forEach((product) => {
      if (!suggestions.some(s => s.productId === product._id.toString())) {
        suggestions.push({
          type: "personalized",
          text: product.name,
          productId: product._id.toString(),
          thumbnailUrl: product.thumbnailUrl,
          price: product.price,
          rating: product.averageRating,
          reviewCount: product.totalReviews,
          reason: "Matches your interests",
        });
      }
    });
  }

  // 4. Popular categories as quick access
  const popularCategories = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 4 }
  ]);

  popularCategories.forEach((cat) => {
    if (cat._id) {
      suggestions.push({
        type: "category",
        text: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
        count: cat.count,
        reason: "Popular category",
      });
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      suggestions: suggestions.slice(0, limit),
      query: "",
      isPersonalized: true,
    },
  });
}
