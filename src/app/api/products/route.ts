import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Category synonyms for better search relevance
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  handicrafts: ['crafts', 'handmade', 'artisan', 'traditional', 'native', 'local', 'handcraft', 'craft', 'woven', 'weaving', 'pottery', 'carving', 'woodwork', 'basket', 'rattan'],
  fashion: ['clothes', 'clothing', 'apparel', 'wear', 'outfit', 'dress', 'shirt', 'pants', 'accessories', 'jewelry', 'bag', 'bags', 'shoes'],
  home: ['furniture', 'decor', 'decoration', 'interior', 'household', 'living', 'kitchen', 'bedroom', 'lamp', 'vase', 'pillow', 'curtain'],
  food: ['snacks', 'delicacy', 'delicacies', 'edible', 'treats', 'pasalubong', 'kakanin', 'dried', 'preserved', 'specialty'],
  beauty: ['skincare', 'cosmetics', 'personal care', 'soap', 'lotion', 'organic', 'natural', 'wellness', 'herbal'],
};

// Detect if search query matches a category or its synonyms
function detectCategoryFromQuery(search: string): string | null {
  const searchLower = search.toLowerCase().trim();
  const searchTerms = searchLower.split(/\s+/);
  
  for (const [category, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    // Check if search term matches category directly
    if (searchLower === category || searchTerms.includes(category)) {
      return category;
    }
    // Check if search term matches any synonym
    for (const synonym of synonyms) {
      if (searchLower === synonym || searchTerms.includes(synonym) || searchLower.includes(synonym)) {
        return category;
      }
    }
  }
  return null;
}

// Expand search query with synonyms for better matching
function expandSearchQuery(search: string): string {
  const searchLower = search.toLowerCase().trim();
  const expandedTerms = new Set<string>([search]);
  
  // Add category name if a synonym was used
  for (const [category, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (searchLower.includes(synonym)) {
        expandedTerms.add(category);
        break;
      }
    }
    if (searchLower.includes(category)) {
      // Add some synonyms for the category
      synonyms.slice(0, 3).forEach(syn => expandedTerms.add(syn));
    }
  }
  
  return Array.from(expandedTerms).join(' ');
}

// GET /api/products - Get all products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const artistId = searchParams.get('artistId');
    const inStock = searchParams.get('inStock');
    const featured = searchParams.get('featured');
    
    // Sort
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query
    const query: any = { isActive: true };

    if (category) {
      query.category = category.toLowerCase();
    }

    // Track if we're using text search for sorting
    let useTextScore = false;
    let detectedCategory: string | null = null;

    if (search) {
      const searchTrimmed = search.trim();
      
      // Detect if search is for a specific category
      detectedCategory = detectCategoryFromQuery(searchTrimmed);
      
      // If user is explicitly searching for a category term, filter by that category
      if (detectedCategory && !category) {
        query.category = detectedCategory;
      }
      
      // Expand search query with synonyms for better text search matching
      const expandedSearch = expandSearchQuery(searchTrimmed);
      
      // Use text search with expanded terms
      query.$text = { $search: expandedSearch };
      useTextScore = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    if (artistId) {
      query.artistId = artistId;
    }

    if (inStock === 'true') {
      query.isAvailable = true;
      query.stock = { $gt: 0 };
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Execute query with relevance-based sorting for search
    let products;
    
    if (useTextScore) {
      // When searching, include text score and sort by relevance
      products = await Product.find(query, { score: { $meta: 'textScore' } })
        .sort({ 
          score: { $meta: 'textScore' }, // Primary: relevance
          isFeatured: -1,                 // Secondary: featured products
          averageRating: -1               // Tertiary: rating
        })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean();
    } else {
      // No search - use regular sorting
      products = await Product.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean();
    }

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      // Include detected category for debugging/UI purposes
      ...(detectedCategory && { detectedCategory }),
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch products',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (requires authentication)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if user is an approved seller
    const User = require('@/models/User').default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || !user.isSeller || user.sellerProfile?.applicationStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'You must be an approved seller to create products' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'images', 'stock'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Additional validation
    if (body.images.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one image is required' },
        { status: 400 }
      );
    }

    if (body.price <= 0) {
      return NextResponse.json(
        { success: false, message: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    if (body.stock < 0) {
      return NextResponse.json(
        { success: false, message: 'Stock cannot be negative' },
        { status: 400 }
      );
    }

    // Create product
    const product = await Product.create({
      ...body,
      artistId: user._id, // Use the actual user ObjectId
      artistName: user.sellerProfile?.shopName || user.name || 'Unknown Artist',
      thumbnailUrl: body.thumbnailUrl || body.images[0],
      isAvailable: body.isActive !== false, // Set availability based on active status
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle duplicate SKU error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Product with this SKU already exists' },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: messages },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create product',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
