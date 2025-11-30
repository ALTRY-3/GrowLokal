import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import {
  buildSearchPipeline,
  expandQuery,
  suggestSpellingCorrection,
  getCategoryCounts,
  calculateRelevanceScore,
  highlightMatches,
  type SearchOptions,
  type SearchResult,
  type SearchResponse,
} from "@/lib/search";

/**
 * GET /api/search - Enhanced full-text search with fuzzy matching
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - limit: Number of results per page (default: 20, max: 100)
 * - page: Page number (default: 1)
 * - category: Filter by category
 * - craftType: Filter by craft type
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - barangay: Filter by barangay
 * - sortBy: Sort order (relevance, price_asc, price_desc, rating, newest, popularity)
 * - fuzzy: Enable fuzzy matching (default: true)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Get query parameters
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const category = searchParams.get("category") || undefined;
    const craftType = searchParams.get("craftType") || undefined;
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const barangay = searchParams.get("barangay") || undefined;
    const sortBy = (searchParams.get("sortBy") as SearchOptions["sortBy"]) || "relevance";
    const fuzzyEnabled = searchParams.get("fuzzy") !== "false";

    // Validate query
    if (!query || query.length < 1) {
      return NextResponse.json({
        success: false,
        message: "Search query is required",
      }, { status: 400 });
    }

    // Build search options
    const searchOptions: SearchOptions = {
      query,
      limit,
      page,
      category,
      craftType,
      minPrice,
      maxPrice,
      barangay,
      sortBy,
      fuzzyMatch: fuzzyEnabled,
    };

    // Build and execute aggregation pipeline
    const pipeline = buildSearchPipeline(searchOptions);
    
    // Get results
    const results = await Product.aggregate(pipeline);

    // If no results and fuzzy is enabled, try with expanded query
    let didYouMean: string | undefined;
    let finalResults = results;

    if (results.length === 0 && fuzzyEnabled) {
      // Try spelling correction
      const correctedQuery = suggestSpellingCorrection(query);
      if (correctedQuery && correctedQuery !== query) {
        didYouMean = correctedQuery;
        
        // Try search with corrected query
        const correctedOptions = { ...searchOptions, query: correctedQuery };
        const correctedPipeline = buildSearchPipeline(correctedOptions);
        finalResults = await Product.aggregate(correctedPipeline);
      }
    }

    // Get total count for pagination (separate query for accuracy)
    const countPipeline = pipeline.slice(0, -3); // Remove skip, limit, project
    countPipeline.push({ $count: "total" });
    const countResult = await Product.aggregate(countPipeline);
    const totalResults = countResult[0]?.total || finalResults.length;

    // Get expanded query terms for highlighting
    const queryTerms = expandQuery(query);

    // Transform results
    const transformedResults: SearchResult[] = finalResults.map((product: any) => {
      const { score, matchType } = calculateRelevanceScore(product, queryTerms, query);
      
      return {
        _id: product._id.toString(),
        name: product.name,
        description: product.shortDescription || product.description?.substring(0, 150) || "",
        category: product.category,
        price: product.price,
        artistName: product.artistName,
        images: product.images || [],
        thumbnailUrl: product.thumbnailUrl || product.images?.[0] || "",
        averageRating: product.averageRating || 0,
        totalReviews: product.totalReviews || 0,
        craftType: product.craftType,
        barangay: product.barangay,
        stock: product.stock || 0,
        isAvailable: product.isAvailable ?? true,
        relevanceScore: product.searchScore || score,
        matchType,
        highlights: {
          name: highlightMatches(product.name, queryTerms),
          description: product.description ? highlightMatches(product.description.substring(0, 150), queryTerms) : undefined,
        },
      };
    });

    // Generate search suggestions
    const suggestions = await generateSearchSuggestions(query);

    // Get category distribution
    const categories = getCategoryCounts(finalResults);

    // Build response
    const response: SearchResponse = {
      results: transformedResults,
      suggestions,
      totalResults,
      page,
      totalPages: Math.ceil(totalResults / limit),
      searchTime: Date.now() - startTime,
      query,
      didYouMean,
      categories,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({
      success: false,
      message: "Search failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

/**
 * Generate search suggestions based on query
 */
async function generateSearchSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  try {
    // Get distinct product names that match
    const nameSuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          name: { $regex: query, $options: "i" },
        },
      },
      { $group: { _id: "$name" } },
      { $limit: 5 },
    ]);

    // Get matching categories
    const categorySuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          category: { $regex: query, $options: "i" },
        },
      },
      { $group: { _id: "$category" } },
      { $limit: 3 },
    ]);

    // Get matching craft types
    const craftTypeSuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          craftType: { $regex: query, $options: "i" },
        },
      },
      { $group: { _id: "$craftType" } },
      { $limit: 3 },
    ]);

    // Get matching artist names
    const artistSuggestions = await Product.aggregate([
      {
        $match: {
          isActive: true,
          artistName: { $regex: query, $options: "i" },
        },
      },
      { $group: { _id: "$artistName" } },
      { $limit: 3 },
    ]);

    // Combine and deduplicate
    const allSuggestions = [
      ...nameSuggestions.map(s => s._id),
      ...categorySuggestions.map(s => s._id?.charAt(0).toUpperCase() + s._id?.slice(1)),
      ...craftTypeSuggestions.map(s => s._id),
      ...artistSuggestions.map(s => s._id),
    ].filter(Boolean);

    // Return unique suggestions, limited to 8
    return [...new Set(allSuggestions)].slice(0, 8);

  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
}

/**
 * POST /api/search - Advanced search with request body
 * Useful for complex search queries with multiple filters
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();

    const body = await request.json();
    const {
      query = "",
      filters = {},
      pagination = {},
      sort = {},
    } = body;

    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: false,
        message: "Search query is required",
      }, { status: 400 });
    }

    const searchOptions: SearchOptions = {
      query: query.trim(),
      limit: Math.min(pagination.limit || 20, 100),
      page: Math.max(pagination.page || 1, 1),
      category: filters.category,
      craftType: filters.craftType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      barangay: filters.barangay,
      sortBy: sort.by || "relevance",
      fuzzyMatch: filters.fuzzyMatch !== false,
    };

    // Build and execute search
    const pipeline = buildSearchPipeline(searchOptions);
    const results = await Product.aggregate(pipeline);

    // Get total count
    const countPipeline = pipeline.slice(0, -3);
    countPipeline.push({ $count: "total" });
    const countResult = await Product.aggregate(countPipeline);
    const totalResults = countResult[0]?.total || results.length;

    // Transform results
    const queryTerms = expandQuery(query);
    const transformedResults: SearchResult[] = results.map((product: any) => {
      const { score, matchType } = calculateRelevanceScore(product, queryTerms, query);
      
      return {
        _id: product._id.toString(),
        name: product.name,
        description: product.shortDescription || product.description?.substring(0, 150) || "",
        category: product.category,
        price: product.price,
        artistName: product.artistName,
        images: product.images || [],
        thumbnailUrl: product.thumbnailUrl || product.images?.[0] || "",
        averageRating: product.averageRating || 0,
        totalReviews: product.totalReviews || 0,
        craftType: product.craftType,
        barangay: product.barangay,
        stock: product.stock || 0,
        isAvailable: product.isAvailable ?? true,
        relevanceScore: product.searchScore || score,
        matchType,
      };
    });

    const response: SearchResponse = {
      results: transformedResults,
      suggestions: await generateSearchSuggestions(query),
      totalResults,
      page: searchOptions.page!,
      totalPages: Math.ceil(totalResults / searchOptions.limit!),
      searchTime: Date.now() - startTime,
      query,
      categories: getCategoryCounts(results),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({
      success: false,
      message: "Search failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
