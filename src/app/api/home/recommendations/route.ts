import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { events, type Event } from '@/data/events';

interface RecommendedEvent {
  id: number;
  title: string;
  date: string;
  dateText: string;
  time: string;
  location: string;
  type: string;
  details: string;
  organizer?: string;
  featuredArtisan?: string;
  matchReason: string;
  matchScore: number;
}

interface RecommendedArtisan {
  id: string;
  name: string;
  shopName: string;
  avatar: string;
  craftType: string;
  category: string;
  location: string;
  rating: number;
  productsCount: number;
  matchReason: string;
  matchScore: number;
}

// Barangay list for location matching
const BARANGAYS = [
  'Asinan', 'Banicain', 'Baretto', 'East Bajac-Bajac', 'East Tapinac',
  'Gordon Heights', 'Kalaklan', 'Mabayuan', 'New Cabalan', 'New Ilalim',
  'New Kababae', 'Old Cabalan', 'Pag-asa', 'Santa Rita', 'West Bajac-Bajac',
  'West Tapinac'
];

// Event types that match craft categories
const EVENT_CATEGORY_MAPPING: Record<string, string[]> = {
  'Craft Fair': ['Handicrafts', 'Fashion', 'Beauty & Wellness'],
  'Workshop': ['Handicrafts', 'Food'],
  'Cultural Show': ['Fashion', 'Handicrafts'],
  'Festival': ['Food', 'Fashion', 'Handicrafts'],
  'Local Market': ['Food', 'Handicrafts', 'Beauty & Wellness'],
  'Demo': ['Handicrafts'],
  'Business Campaign': ['Food', 'Fashion', 'Beauty & Wellness'],
};

// GET /api/home/recommendations - Get personalized events and artisans
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    
    // Parse personalization parameters from local storage (passed via query)
    const viewedCategories = searchParams.get('viewedCategories')?.split(',').filter(Boolean) || [];
    const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];
    const userLocation = searchParams.get('userLocation') || '';
    const recentSearches = searchParams.get('recentSearches')?.split(',').filter(Boolean) || [];
    
    // Fetch user's purchase history if logged in
    let purchasedCategories: string[] = [];
    let purchasedCraftTypes: string[] = [];
    let preferredBarangays: string[] = [];
    
    if (session?.user?.id) {
      try {
        const orders = await Order.find({ 
          userId: session.user.id,
          status: { $in: ['delivered', 'completed', 'shipped', 'processing'] }
        })
        .select('items')
        .limit(30)
        .lean();
        
        const purchasedProductIds = orders.flatMap((order: any) => 
          order.items?.map((item: any) => item.productId) || []
        );
        
        if (purchasedProductIds.length > 0) {
          const purchasedProducts = await Product.find({
            _id: { $in: purchasedProductIds }
          }).select('category craftType barangay').lean();
          
          purchasedCategories = [...new Set(purchasedProducts.map((p: any) => p.category).filter(Boolean))];
          purchasedCraftTypes = [...new Set(purchasedProducts.map((p: any) => p.craftType).filter(Boolean))];
          preferredBarangays = [...new Set(purchasedProducts.map((p: any) => p.barangay).filter(Boolean))];
        }
      } catch (err) {
        console.error('Error fetching purchase history:', err);
      }
    }
    
    // Combine all user interests
    const allInterests = [...new Set([
      ...viewedCategories,
      ...interests,
      ...purchasedCategories,
      ...purchasedCraftTypes
    ])].map(i => i.toLowerCase());
    
    const allLocations = [...new Set([
      userLocation,
      ...preferredBarangays
    ])].filter(Boolean).map(l => l.toLowerCase());
    
    // Score and recommend events
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.date) >= now)
      .map(event => {
        let score = 0;
        const reasons: string[] = [];
        
        // Location matching
        const eventLocationLower = event.location.toLowerCase();
        const matchedLocation = allLocations.find(loc => 
          eventLocationLower.includes(loc) || loc.includes(eventLocationLower.split(',')[0])
        );
        if (matchedLocation) {
          score += 40;
          reasons.push('Near your area');
        }
        
        // Event type to category matching
        const matchingCategories = EVENT_CATEGORY_MAPPING[event.type] || [];
        const categoryMatch = matchingCategories.some(cat => 
          allInterests.includes(cat.toLowerCase())
        );
        if (categoryMatch) {
          score += 35;
          reasons.push(`Matches your interest in ${matchingCategories.find(cat => allInterests.includes(cat.toLowerCase()))}`);
        }
        
        // Search term matching
        const eventText = `${event.title} ${event.details} ${event.type}`.toLowerCase();
        const searchMatch = recentSearches.find(term => 
          eventText.includes(term.toLowerCase())
        );
        if (searchMatch) {
          score += 30;
          reasons.push('Related to your recent searches');
        }
        
        // Boost events happening soon (within 30 days)
        const daysUntil = Math.ceil((new Date(event.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 30) {
          score += 20;
          reasons.push('Happening soon');
        } else if (daysUntil <= 60) {
          score += 10;
        }
        
        // Featured artisan boost
        if (event.featuredArtisan) {
          score += 5;
        }
        
        return {
          id: event.id,
          title: event.title,
          date: event.date,
          dateText: event.dateText,
          time: event.time,
          location: event.location,
          type: event.type,
          details: event.details,
          organizer: event.organizer,
          featuredArtisan: event.featuredArtisan,
          matchReason: reasons[0] || 'Popular event',
          matchScore: score
        } as RecommendedEvent;
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
    
    // Fetch and score artisans (sellers)
    const sellers = await User.find({
      isSeller: true,
      'sellerProfile.applicationStatus': 'approved'
    })
    .select({
      name: 1,
      fullName: 1,
      profilePicture: 1,
      'sellerProfile.shopName': 1,
      'sellerProfile.businessType': 1,
      'sellerProfile.pickupAddress': 1,
      'sellerProfile.shopDescription': 1,
    })
    .limit(50)
    .lean();
    
    // Get product counts and ratings for each seller
    const sellerIds = sellers.map((s: any) => s._id);
    const productStats = await Product.aggregate([
      { $match: { artistId: { $in: sellerIds }, isActive: true } },
      {
        $group: {
          _id: '$artistId',
          productsCount: { $sum: 1 },
          avgRating: { $avg: '$averageRating' },
          categories: { $addToSet: '$category' },
          craftTypes: { $addToSet: '$craftType' },
          barangays: { $addToSet: '$barangay' }
        }
      }
    ]);
    
    const statsMap = new Map(productStats.map((s: any) => [s._id.toString(), s]));
    
    const scoredArtisans = sellers
      .map((seller: any) => {
        const stats = statsMap.get(seller._id.toString()) || { 
          productsCount: 0, 
          avgRating: 0,
          categories: [],
          craftTypes: [],
          barangays: []
        };
        
        let score = 0;
        const reasons: string[] = [];
        
        // Category/Craft type matching
        const sellerCategories = (stats.categories || []).map((c: string) => c?.toLowerCase());
        const sellerCraftTypes = (stats.craftTypes || []).map((c: string) => c?.toLowerCase());
        const categoryMatch = allInterests.find(interest => 
          sellerCategories.includes(interest) || sellerCraftTypes.includes(interest)
        );
        if (categoryMatch) {
          score += 40;
          reasons.push(`Specializes in ${categoryMatch}`);
        }
        
        // Location matching
        const pickupAddr = seller.sellerProfile?.pickupAddress;
        const sellerAddress = (typeof pickupAddr === 'string' ? pickupAddr : '').toLowerCase();
        const sellerBarangays = (stats.barangays || []).map((b: string) => b?.toLowerCase());
        const locationMatch = allLocations.find(loc => 
          sellerAddress.includes(loc) || sellerBarangays.includes(loc)
        );
        if (locationMatch) {
          score += 35;
          reasons.push('Near your location');
        }
        
        // Rating boost
        if (stats.avgRating >= 4.5) {
          score += 25;
          reasons.push('Highly rated');
        } else if (stats.avgRating >= 4.0) {
          score += 15;
        }
        
        // Product variety boost
        if (stats.productsCount >= 10) {
          score += 15;
          reasons.push('Wide product selection');
        } else if (stats.productsCount >= 5) {
          score += 10;
        }
        
        // Search match
        const sellerText = `${seller.sellerProfile?.shopName || ''} ${seller.sellerProfile?.shopDescription || ''} ${seller.sellerProfile?.businessType || ''}`.toLowerCase();
        const searchMatch = recentSearches.find(term => 
          sellerText.includes(term.toLowerCase())
        );
        if (searchMatch) {
          score += 20;
          reasons.push('Matches your searches');
        }
        
        // Extract location from address
        const pickupAddress = seller.sellerProfile?.pickupAddress;
        const addressString = typeof pickupAddress === 'string' ? pickupAddress : '';
        const addressParts = addressString.split(',');
        const barangay = addressParts.find((part: string) => 
          BARANGAYS.some(b => part.toLowerCase().includes(b.toLowerCase()))
        )?.trim() || addressParts[0]?.trim() || 'Olongapo City';
        
        return {
          id: seller._id.toString(),
          name: seller.fullName || seller.name || 'Artisan',
          shopName: seller.sellerProfile?.shopName || 'Artisan Shop',
          avatar: seller.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.name}`,
          craftType: seller.sellerProfile?.businessType || stats.craftTypes[0] || 'Crafts',
          category: stats.categories[0] || 'Handicrafts',
          location: barangay,
          rating: Math.round((stats.avgRating || 4.0) * 10) / 10,
          productsCount: stats.productsCount || 0,
          matchReason: reasons[0] || 'Popular artisan',
          matchScore: score
        } as RecommendedArtisan;
      })
      .filter((a: RecommendedArtisan) => a.productsCount > 0)
      .sort((a: RecommendedArtisan, b: RecommendedArtisan) => b.matchScore - a.matchScore)
      .slice(0, 6);
    
    return NextResponse.json({
      success: true,
      data: {
        events: upcomingEvents,
        artisans: scoredArtisans,
        personalizationFactors: {
          interests: allInterests.slice(0, 5),
          locations: allLocations.slice(0, 3),
          hasHistory: purchasedCategories.length > 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
