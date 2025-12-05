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
  viewedCategories?: string[]; // Categories visited/browsed
  purchasedCategories?: string[]; // Categories user has purchased from
  excludeIds?: string[];       // Products to exclude (already in cart, etc.)
}

// Scoring weights for personalization
const WEIGHTS = {
  recentlyViewed: 50,       // Boost products similar to recently viewed
  searchMatch: 40,          // Boost products matching search history
  interestMatch: 35,        // Boost products matching user interests
  viewedCategory: 32,       // Boost categories the user browsed
  purchaseHistory: 30,      // Boost categories user has bought from
  trending: 25,             // Boost trending/popular products
  newArrival: 20,           // Boost new products
  highRating: 15,           // Boost highly rated products
  inStock: 10,              // Boost in-stock items
};

const MARKETPLACE_CATEGORIES = ['handicrafts', 'fashion', 'home', 'food', 'beauty'];

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
    const viewedCategories = searchParams.get('viewedCategories')?.split(',').filter(Boolean) || [];
    const excludeIds = searchParams.get('excludeIds')?.split(',').filter(Boolean) || [];
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Build base query
    const baseQuery: any = { 
      isActive: true,
      isAvailable: true,
      stock: { $gt: 0 },
      category: { $in: MARKETPLACE_CATEGORIES }, // Ensure we stay in Marketplace inventory
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

              // Boost for categories the user recently browsed (viewed categories)
              {
                $cond: {
                  if: { $in: ['$category', viewedCategories.map(c => c.toLowerCase())] },
                  then: WEIGHTS.viewedCategory,
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
        const recentViewObjectIds = validViewIds.map(id => new mongoose.Types.ObjectId(id));

        // Fetch recently viewed products to get their attributes
        const viewedProducts = await Product.find({
          _id: { $in: recentViewObjectIds }
        }).select('category craftType artistName tags').lean();
        
        const viewedCategories = [...new Set(viewedProducts.map((p: any) => p.category))];
        const viewedCraftTypes = [...new Set(viewedProducts.map((p: any) => p.craftType).filter(Boolean))];
        const viewedArtists = [...new Set(viewedProducts.map((p: any) => p.artistName).filter(Boolean))];

        // Weight recent categories/craft types by recency (newest view gets largest boost)
        const categoryWeights: Record<string, number> = {};
        const craftTypeWeights: Record<string, number> = {};
        viewedProducts.forEach((p: any, index: number) => {
          const positionWeight = Math.max(WEIGHTS.recentlyViewed - index * 5, 20);
          if (p.category) {
            categoryWeights[p.category] = Math.max(categoryWeights[p.category] || 0, positionWeight * 0.5);
          }
          if (p.craftType) {
            craftTypeWeights[p.craftType] = Math.max(craftTypeWeights[p.craftType] || 0, positionWeight * 0.35);
          }
        });

        // Strong boost if the exact product was recently viewed (surfacing revisits)
        pipeline[1].$addFields.personalizationScore.$add.push({
          $cond: {
            if: { $in: ['$_id', recentViewObjectIds] },
            then: WEIGHTS.recentlyViewed,
            else: 0
          }
        });

        // Add weighted boosts per category/craftType (top 3 each)
        Object.entries(categoryWeights)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .forEach(([cat, weight]) => {
            pipeline[1].$addFields.personalizationScore.$add.push({
              $cond: {
                if: { $eq: ['$category', cat] },
                then: Math.floor(weight),
                else: 0
              }
            });
          });

        Object.entries(craftTypeWeights)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .forEach(([craft, weight]) => {
            pipeline[1].$addFields.personalizationScore.$add.push({
              $cond: {
                if: { $eq: ['$craftType', craft] },
                then: Math.floor(weight),
                else: 0
              }
            });
          });

        // Keep the broader similarity boosts
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
    
    // Search history matching (boost on first token and full phrase)
    if (recentSearches.length > 0) {
      const searchTokens = recentSearches
        .slice(0, 5)
        .flatMap(term => term.toLowerCase().split(/\s+/).filter(Boolean))
        .slice(0, 6);
      const firstToken = searchTokens[0] || '';

      if (firstToken) {
        pipeline[1].$addFields.personalizationScore.$add.push({
          $cond: {
            if: {
              $or: [
                { $regexMatch: { input: { $toLower: '$name' }, regex: firstToken } },
                { $regexMatch: { input: { $toLower: '$description' }, regex: firstToken } },
                { $regexMatch: { input: { $toLower: '$craftType' }, regex: firstToken } },
                { $regexMatch: { input: { $toLower: '$category' }, regex: firstToken } }
              ]
            },
            then: WEIGHTS.searchMatch,
            else: 0
          }
        });
      }

      if (searchTokens.length > 1) {
        pipeline[1].$addFields.personalizationScore.$add.push({
          $cond: {
            if: {
              $regexMatch: { input: { $toLower: '$description' }, regex: searchTokens.join('|') }
            },
            then: Math.floor(WEIGHTS.searchMatch * 0.6),
            else: 0
          }
        });
      }
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
        purchasedCategories,
        viewedCategories
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
    purchasedCategories: string[],
    viewedCategories: string[]
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

  // Browsed categories
  if (context.viewedCategories.some(c => c.toLowerCase() === product.category?.toLowerCase())) {
    reasons.push('Hot pick for you');
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
