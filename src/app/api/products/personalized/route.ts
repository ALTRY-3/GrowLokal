import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

interface PersonalizationParams {
  recentViews?: string[];      // Product IDs the user recently viewed
  recentSearches?: string[];   // Recent search terms
  interests?: string[];        // User interests (categories, craftTypes)
  purchasedCategories?: string[]; // Categories user has purchased from
  excludeIds?: string[];       // Products to exclude (already in cart, etc.)
}

// Scoring weights for personalization
const WEIGHTS = {
  recentlyViewed: 50,       // Boost products similar to recently viewed
  searchMatch: 40,          // Boost products matching search history
  interestMatch: 35,        // Boost products matching user interests
  purchaseHistory: 30,      // Boost categories user has bought from
  trending: 25,             // Boost trending/popular products
  newArrival: 20,           // Boost new products
  highRating: 15,           // Boost highly rated products
  inStock: 10,              // Boost in-stock items
};

// GET /api/products/personalized - Get personalized product recommendations
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    
    // Parse personalization parameters
    const recentViews = searchParams.get('recentViews')?.split(',').filter(Boolean) || [];
    const recentSearches = searchParams.get('recentSearches')?.split(',').filter(Boolean) || [];
    const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];
    const excludeIds = searchParams.get('excludeIds')?.split(',').filter(Boolean) || [];
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build base query
    const baseQuery: any = { 
      isActive: true,
      isAvailable: true,
      stock: { $gt: 0 }
    };
    
    if (category) {
      baseQuery.category = category.toLowerCase();
    }
    
    // Exclude specific product IDs
    if (excludeIds.length > 0) {
      const validExcludeIds = excludeIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      if (validExcludeIds.length > 0) {
        baseQuery._id = { $nin: validExcludeIds };
      }
    }
    
    // Fetch user's purchase history if logged in
    let purchasedCategories: string[] = [];
    let purchasedArtists: string[] = [];
    
    if (session?.user?.id) {
      try {
        const orders = await Order.find({ 
          userId: session.user.id,
          status: { $in: ['delivered', 'completed', 'shipped'] }
        })
        .select('items')
        .limit(20)
        .lean();
        
        // Extract categories and artists from past purchases
        const purchasedProductIds = orders.flatMap((order: any) => 
          order.items?.map((item: any) => item.productId) || []
        );
        
        if (purchasedProductIds.length > 0) {
          const purchasedProducts = await Product.find({
            _id: { $in: purchasedProductIds }
          }).select('category artistId').lean();
          
          purchasedCategories = [...new Set(purchasedProducts.map((p: any) => p.category))];
          purchasedArtists = [...new Set(purchasedProducts.map((p: any) => p.artistId?.toString()).filter(Boolean))];
        }
      } catch (err) {
        console.error('Error fetching purchase history:', err);
      }
    }
    
    // Fetch products with aggregation for scoring
    const pipeline: any[] = [
      { $match: baseQuery },
      {
        $addFields: {
          // Calculate personalization score
          personalizationScore: {
            $add: [
              // Base score
              0,
              
              // Boost for matching interests (categories, craftTypes)
              {
                $cond: {
                  if: { 
                    $or: [
                      { $in: ['$category', interests.map(i => i.toLowerCase())] },
                      { $in: ['$craftType', interests] }
                    ]
                  },
                  then: WEIGHTS.interestMatch,
                  else: 0
                }
              },
              
              // Boost for categories user has purchased from
              {
                $cond: {
                  if: { $in: ['$category', purchasedCategories] },
                  then: WEIGHTS.purchaseHistory,
                  else: 0
                }
              },
              
              // Boost for high ratings
              {
                $cond: {
                  if: { $gte: ['$averageRating', 4.0] },
                  then: { $multiply: ['$averageRating', 3] }, // Up to 15 points
                  else: 0
                }
              },
              
              // Boost for featured products (trending indicator)
              {
                $cond: {
                  if: { $eq: ['$isFeatured', true] },
                  then: WEIGHTS.trending,
                  else: 0
                }
              },
              
              // Boost for new arrivals (created in last 7 days)
              {
                $cond: {
                  if: { 
                    $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
                  },
                  then: WEIGHTS.newArrival,
                  else: 0
                }
              },
              
              // Boost for products from purchased artists
              {
                $cond: {
                  if: { $in: [{ $toString: '$artistId' }, purchasedArtists] },
                  then: 20,
                  else: 0
                }
              },
              
              // Small boost for review count (popularity indicator)
              {
                $min: [{ $multiply: ['$totalReviews', 0.5] }, 10]
              }
            ]
          }
        }
      }
    ];
    
    // If we have recently viewed products, boost similar products
    if (recentViews.length > 0) {
      const validViewIds = recentViews
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .slice(0, 10); // Limit to last 10 views
      
      if (validViewIds.length > 0) {
        // Fetch recently viewed products to get their attributes
        const viewedProducts = await Product.find({
          _id: { $in: validViewIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).select('category craftType artistName tags').lean();
        
        const viewedCategories = [...new Set(viewedProducts.map((p: any) => p.category))];
        const viewedCraftTypes = [...new Set(viewedProducts.map((p: any) => p.craftType).filter(Boolean))];
        const viewedArtists = [...new Set(viewedProducts.map((p: any) => p.artistName).filter(Boolean))];
        
        // Add boost for similarity to viewed products
        pipeline[1].$addFields.personalizationScore.$add.push({
          $cond: {
            if: { $in: ['$category', viewedCategories] },
            then: WEIGHTS.recentlyViewed * 0.5,
            else: 0
          }
        });
        
        pipeline[1].$addFields.personalizationScore.$add.push({
          $cond: {
            if: { $in: ['$craftType', viewedCraftTypes] },
            then: WEIGHTS.recentlyViewed * 0.3,
            else: 0
          }
        });
        
        pipeline[1].$addFields.personalizationScore.$add.push({
          $cond: {
            if: { $in: ['$artistName', viewedArtists] },
            then: WEIGHTS.recentlyViewed * 0.2,
            else: 0
          }
        });
      }
    }
    
    // Search history matching
    if (recentSearches.length > 0) {
      const searchTerms = recentSearches.slice(0, 5).join(' ').toLowerCase();
      
      // Add text matching boost
      pipeline[1].$addFields.personalizationScore.$add.push({
        $cond: {
          if: {
            $or: [
              { $regexMatch: { input: { $toLower: '$name' }, regex: searchTerms.split(' ')[0] || '' } },
              { $regexMatch: { input: { $toLower: '$description' }, regex: searchTerms.split(' ')[0] || '' } }
            ]
          },
          then: WEIGHTS.searchMatch,
          else: 0
        }
      });
    }
    
    // Sort by personalization score, then by rating
    pipeline.push(
      { $sort: { personalizationScore: -1, averageRating: -1, totalReviews: -1 } },
      { $limit: limit * 2 }, // Fetch extra for diversity
      { $project: { __v: 0 } }
    );
    
    let products = await Product.aggregate(pipeline);
    
    // Apply diversity: don't show too many products from the same category in a row
    products = applyDiversity(products, limit);
    
    // If not enough personalized results, fill with popular products
    if (products.length < limit) {
      const existingIds = products.map(p => p._id.toString());
      const additionalQuery = {
        ...baseQuery,
        _id: { $nin: [...existingIds.map(id => new mongoose.Types.ObjectId(id)), ...(baseQuery._id?.$nin || [])] }
      };
      
      const additionalProducts = await Product.find(additionalQuery)
        .sort({ averageRating: -1, totalReviews: -1, createdAt: -1 })
        .limit(limit - products.length)
        .select('-__v')
        .lean();
      
      products = [...products, ...additionalProducts];
    }
    
    // Add recommendation reason to each product
    const productsWithReasons = products.map((product: any) => ({
      ...product,
      recommendationReason: getRecommendationReason(product, {
        interests,
        recentViews,
        recentSearches,
        purchasedCategories
      })
    }));
    
    return NextResponse.json({
      success: true,
      data: productsWithReasons,
      meta: {
        personalized: recentViews.length > 0 || interests.length > 0 || purchasedCategories.length > 0,
        basedOn: {
          recentViews: recentViews.length,
          interests: interests.length,
          searchHistory: recentSearches.length,
          purchaseHistory: purchasedCategories.length
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching personalized products:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch personalized products',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Apply diversity to prevent too many similar products in sequence
function applyDiversity(products: any[], limit: number): any[] {
  if (products.length <= limit) return products;
  
  const result: any[] = [];
  const categoryCount: Record<string, number> = {};
  const maxPerCategory = Math.ceil(limit / 3);
  
  // First pass: add products while maintaining category diversity
  for (const product of products) {
    const cat = product.category;
    if ((categoryCount[cat] || 0) < maxPerCategory) {
      result.push(product);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      
      if (result.length >= limit) break;
    }
  }
  
  // Second pass: fill remaining slots if needed
  if (result.length < limit) {
    const addedIds = new Set(result.map(p => p._id.toString()));
    for (const product of products) {
      if (!addedIds.has(product._id.toString())) {
        result.push(product);
        if (result.length >= limit) break;
      }
    }
  }
  
  return result;
}

// Generate a human-readable recommendation reason
function getRecommendationReason(
  product: any, 
  context: { 
    interests: string[], 
    recentViews: string[], 
    recentSearches: string[],
    purchasedCategories: string[]
  }
): string | null {
  const reasons: string[] = [];
  
  // Check if it matches interests
  if (context.interests.some(i => 
    i.toLowerCase() === product.category?.toLowerCase() ||
    i === product.craftType
  )) {
    reasons.push('Matches your interests');
  }
  
  // Check if from a category user has purchased
  if (context.purchasedCategories.includes(product.category)) {
    reasons.push('Based on your purchases');
  }
  
  // High rating
  if (product.averageRating >= 4.5 && product.totalReviews >= 5) {
    reasons.push('Highly rated');
  }
  
  // Featured/trending
  if (product.isFeatured) {
    reasons.push('Trending now');
  }
  
  // New arrival
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (new Date(product.createdAt) > sevenDaysAgo) {
    reasons.push('New arrival');
  }
  
  return reasons.length > 0 ? reasons[0] : null;
}
