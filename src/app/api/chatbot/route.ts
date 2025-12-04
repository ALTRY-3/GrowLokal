import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// -----------------------------
// Environment & Groq Config
// -----------------------------
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const SYSTEM_PROMPT = `You are KaLokal, a professional AI shopping assistant for GrowLokal...
Keep responses SHORT (1-2 sentences), DIRECT, professional, and concise.`;

// -----------------------------
// Intent Keywords & Detection
// -----------------------------
const INTENTS: Record<string, string[]> = {
  GREETING: ['hi','hello','hey','kumusta','good morning','good afternoon','good evening'],
  GOODBYE: ['bye','goodbye','see you','later','paalam'],
  THANKS: ['thank you','thanks','salamat','appreciate'],
  WHO_ARE_YOU: ['who are you','your name','what is kalokal'],
  HOW_ARE_YOU: ['how are you','kamusta','what\'s up'],
  PRODUCT_SEARCH: ['find','search','looking for','show me','need','want','buy','product','item','shop','browse'],
  ORDER_TRACKING: ['order','track','delivery','status','shipped','package'],
  WISHLIST: ['wishlist','saved','favorites','wish list','bookmark'],
  SHIPPING: ['shipping','delivery','ship','free shipping'],
  PAYMENT: ['payment','pay','gcash','credit card','debit','payment method'],
  RETURN_REFUND: ['return','refund','exchange','cancel order','not satisfied'],
  HELP: ['help','support','how to','what is','guide','assist'],
  SELLER: ['sell','seller','become seller','apply','vendor','start selling','register as seller','registering as seller','seller registration','how to sell','how do i sell','artisan registration'],
  ACCOUNT: ['account','profile','login','signup','password','email','sign in'],
  ABOUT_PLATFORM: ['what is growlokal','about growlokal','tell me about','how does it work'],
  PRICE_INQUIRY: ['price','cost','how much','expensive','cheap','pricing'],
  ARTISAN_STORIES: ['artisan','story','stories','artist story','artisan story'],
  EVENTS: ['event','events','workshop','fair','market','calendar'],
  MAP: ['map','location','artisan location','find artisan','where are','discover artisans','locate','near','in','around'],
  HOME: ['home','homepage','landing','start','welcome']
};

// Detect intent by checking if message includes any intent keyword (supports multi-word)
// SELLER intent takes priority if it matches, to avoid ACCOUNT keyword conflict
function detectIntent(message: string): string {
  const msg = message.toLowerCase();
  
  // Priority check: SELLER intent (to avoid "register" being caught by ACCOUNT)
  const sellerKeywords = INTENTS.SELLER || [];
  for (const kw of sellerKeywords) {
    if (msg.includes(kw)) return 'SELLER';
  }
  
  // Then check all other intents
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (intent === 'SELLER') continue; // Already checked above
    for (const kw of keywords) {
      if (msg.includes(kw)) return intent;
    }
  }
  return 'GENERAL';
}
// Product categories to auto-search
const PRODUCT_CATEGORIES = [
  'handicraft', 'pottery', 'basket', 'weaving', 'embroidery', 'woodwork',
  'fashion', 'jewelry', 'bag', 'shoe', 'clothes', 'accessories',
  'home', 'decor', 'furniture', 'textile', 'decoration',
  'food', 'snack', 'delicacies', 'ingredient', 'delicacy', 'sweets', 'treats', 'edible',
  'beauty', 'cosmetic', 'skincare', 'wellness',
  'gift', 'souvenir', 'craft', 'handmade', 'artisan', 'artist'
];

// -----------------------------
// Helpers: location and announcements
// -----------------------------
function extractLocationTerm(message: string): string | null {
  const m = message.toLowerCase();
  // Simple patterns: "in <place>", "near <place>", "around <place>"
  const match = m.match(/\b(?:in|near|around)\s+([a-zA-Z\s\-']{2,30})/);
  if (match?.[1]) {
    return match[1].trim().replace(/[\.,!?].*$/, '');
  }
  // If the word barangay appears, capture next token(s)
  const brgy = m.match(/barangay\s+([a-zA-Z\s\-']{2,30})/);
  if (brgy?.[1]) return brgy[1].trim();
  return null;
}

function getCommunityAnnouncements(): string[] {
  return [
    'New: Book hands-on workshops with local artisans!',
    'Weekend craft fairs at Ayala Harbor Point this month.',
    'Support local makers – featured crafts updated daily.'
  ];
}

// Get featured/random products
async function getFeaturedProducts(limit: number = 5) {
  try {
    await connectDB();
    const products = await Product.aggregate([
      { $match: { isActive: true, isAvailable: true } },
      { $sample: { size: limit } },
      { $project: { name: 1, price: 1, category: 1, artistName: 1, images: 1, thumbnailUrl: 1, averageRating: 1 } }
    ]);
    return products;
  } catch (error) {
    console.error('Featured products error:', error);
    return [];
  }
}

// Get featured artisans with their stories and product counts
async function getFeaturedArtisans(limit: number = 4) {
  try {
    await connectDB();
    
    // Get artisans from sellers with products
    const artisans = await Product.aggregate([
      { $match: { isActive: true, isAvailable: true } },
      {
        $group: {
          _id: '$artistId',
          artistName: { $first: '$artistName' },
          artistStory: { $first: '$artistStory' },
          category: { $first: '$category' },
          productCount: { $sum: 1 },
          avgRating: { $avg: '$averageRating' }
        }
      },
      { $sort: { avgRating: -1, productCount: -1 } },
      { $limit: limit }
    ]);
    
    // Get full seller details from User collection
    const enrichedArtisans = await Promise.all(
      artisans.map(async (artisan: any) => {
        const sellerInfo = await User.findById(artisan._id)
          .select('name sellerProfile.shopName sellerProfile.sellerStory sellerProfile.sellerPhoto image')
          .lean() as any;
        
        return {
          _id: artisan._id,
          name: sellerInfo?.sellerProfile?.shopName || sellerInfo?.name || artisan.artistName,
          story: sellerInfo?.sellerProfile?.sellerStory || artisan.artistStory || 'Local artisan creating handmade crafts',
          category: artisan.category,
          productCount: artisan.productCount,
          rating: artisan.avgRating?.toFixed(1) || '4.5',
          image: sellerInfo?.sellerProfile?.sellerPhoto || sellerInfo?.image || '/default-artisan.jpg'
        };
      })
    );
    
    return enrichedArtisans.filter(a => a.name); // Filter out incomplete profiles
  } catch (error) {
    console.error('Featured artisans error:', error);
    return [];
  }
}

// Format artisans for AI context
function formatArtisansForAI(artisans: any[]): string {
  if (artisans.length === 0) return 'No artisans found.';
  
  return artisans.map((a, i) => 
    `${i + 1}. **${a.name}** - ${a.productCount} products in ${a.category} ★${a.rating}\n   Story: ${a.story.substring(0, 100)}...`
  ).join('\n');
}

// Find a specific artisan by name (shop or personal)
async function findArtisanByName(term: string) {
  await connectDB();
  // Try by User first
  const byUser = await User.findOne({
    $or: [
      { name: { $regex: term, $options: 'i' } },
      { 'sellerProfile.shopName': { $regex: term, $options: 'i' } },
    ]
  }).select('name image sellerProfile').lean() as any;
  if (byUser) return byUser;
  // Try by Product's artistName then back-resolve user
  const byProduct = await Product.findOne({ artistName: { $regex: term, $options: 'i' } })
    .select('artistId artistName')
    .lean() as any;
  if (byProduct?.artistId) {
    const u = await User.findById(byProduct.artistId).select('name image sellerProfile').lean() as any;
    if (u) return u;
  }
  return null;
}

// Get events from hardcoded data
function getEvents(yearFilter?: number): any[] {
  const events = [
    {
      id: 1,
      date: "2025-09-15",
      title: "Subic Bay Cultural Festival",
      dateText: "March 15, 2025",
      time: "9:00 AM",
      location: "Subic Bay Freeport Zone",
      type: "Cultural Show",
    },
    {
      id: 2,
      date: "2026-02-17",
      title: "Alab Sining 2026",
      dateText: "February 17, 2026",
      time: "9:00 AM",
      location: "SM City Olongapo Central",
      type: "Craft Fair",
    },
    {
      id: 3,
      date: "2025-10-25",
      title: "This Is Not Art Escape",
      dateText: "October 25, 2025",
      time: "9:00 AM",
      location: "Ayala Malls Harbor Point",
      type: "Local Market",
    },
    {
      id: 4,
      date: "2026-06-22",
      title: "Crft PINAY Pottery Experience",
      dateText: "June 22, 2026",
      time: "9:00 AM",
      location: "Sibul Kapihan, SBFZ",
      type: "Workshop",
    },
    {
      id: 5,
      date: "2025-09-16",
      title: "My City, My SM, My Crafts",
      dateText: "September 16, 2025",
      time: "9:00 AM",
      location: "SM City Olongapo",
      type: "Craft Fair",
    },
    {
      id: 6,
      date: "2025-10-12",
      title: "Luzon Art Fair 2025",
      dateText: "October 12, 2025",
      time: "9:00 AM",
      location: "Diwa ng Tarlac and Bulwagang Kanlahi, Tarlac City",
      type: "Festival",
    },
    {
      id: 7,
      date: "2025-11-11",
      title: "Sip and Sketch 'Gapo",
      dateText: "November 11, 2025",
      time: "9:00 AM",
      location: "Olongapo City, Sibul Kapihan",
      type: "Workshop",
    },
    {
      id: 8,
      date: "2026-03-20",
      title: "Pottery Demonstration",
      dateText: "March 20, 2026",
      time: "9:00 AM",
      location: "Olongapo City, Triangle",
      type: "Demo",
    },
    {
      id: 9,
      date: "2026-03-25",
      title: "Cultural Festival",
      dateText: "March 25, 2026",
      time: "9:00 AM",
      location: "Magsaysay Drive, Olongapo City",
      type: "Demo",
    },
  ];

  // Filter by year if provided
  if (yearFilter) {
    return events.filter(e => new Date(e.date).getFullYear() === yearFilter);
  }
  return events;
}

// Format events for AI context
function formatEventsForAI(events: any[]): string {
  if (events.length === 0) return 'No events found';
  
  return events.map((e, i) => 
    `${i + 1}. ${e.title} on ${e.dateText} at ${e.location} (${e.type})`
  ).join('\n');
}

// Search products based on query and optional location
async function searchProducts(query: string, limit: number = 5, locationTerm?: string) {
  try {
    await connectDB();
    
    // Map common search terms to exact MongoDB categories
    const categoryMap: { [key: string]: string } = {
      'food': 'food',
      'foods': 'food',
      'snack': 'food',
      'snacks': 'food',
      'delicacies': 'food',
      'delicacy': 'food',
      'sweets': 'food',
      'treats': 'food',
      'edible': 'food',
      'dessert': 'food',
      'handicraft': 'handicrafts',
      'handicrafts': 'handicrafts',
      'pottery': 'handicrafts',
      'basket': 'handicrafts',
      'weaving': 'handicrafts',
      'embroidery': 'handicrafts',
      'woodwork': 'handicrafts',
      'craft': 'handicrafts',
      'fashion': 'fashion',
      'jewelry': 'fashion',
      'bag': 'fashion',
      'shoes': 'fashion',
      'clothes': 'fashion',
      'accessories': 'fashion',
      'dress': 'fashion',
      'shirt': 'fashion',
      'home': 'home',
      'decor': 'home',
      'furniture': 'home',
      'textile': 'home',
      'beauty': 'beauty',
      'cosmetic': 'beauty',
      'skincare': 'beauty',
      'wellness': 'beauty',
    };
    
    const lowerQuery = query.toLowerCase().trim();
    const matchedCategory = categoryMap[lowerQuery];
    
    // If exact category match found, search by category first
    if (matchedCategory) {
      let products = await Product.find({
        category: matchedCategory,
        isActive: true,
        isAvailable: true,
      })
        .limit(limit)
        .select('name price category artistName images thumbnailUrl averageRating')
        .lean();
      
      // If category search returns results, use them
      if (products.length > 0) {
        return products;
      }
    }
    
    // If location provided, try location-aware search via lookup to users
    if (locationTerm) {
      const productsByLocation = await Product.aggregate([
        { $match: { isActive: true, isAvailable: true } },
        { $lookup: { from: 'users', localField: 'artistId', foreignField: '_id', as: 'seller' } },
        { $unwind: '$seller' },
        { $match: { 
          $or: [
            { 'seller.address.barangay': { $regex: locationTerm, $options: 'i' } },
            { 'seller.address.city': { $regex: locationTerm, $options: 'i' } },
            { 'seller.address.province': { $regex: locationTerm, $options: 'i' } },
            { 'seller.address.region': { $regex: locationTerm, $options: 'i' } },
          ]
        } },
        // Match query across key fields
        { $match: { $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { artistName: { $regex: query, $options: 'i' } },
          { tags: { $in: [ new RegExp(query, 'i') ] } },
        ] } },
        { $project: { name: 1, price: 1, category: 1, artistName: 1, images: 1, thumbnailUrl: 1, averageRating: 1 } },
        { $limit: limit }
      ]);
      if (productsByLocation.length > 0) return productsByLocation as any[];
    }

    // First try: Direct product or artisan name match (case-insensitive)
    let products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { artistName: { $regex: query, $options: 'i' } },
      ],
      isActive: true,
      isAvailable: true,
    })
      .limit(limit)
      .select('name price category artistName images thumbnailUrl averageRating')
      .lean();
    
    if (products.length > 0) {
      return products;
    }

    // Second try: Text search (captures "what it does" in description)
    products = await Product.find(
      { 
        $text: { $search: query },
        isActive: true,
        isAvailable: true,
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('name price category artistName images thumbnailUrl averageRating')
      .lean();

    if (products.length > 0) {
      return products;
    }

    // Third try: Partial match across multiple fields, including tags
    products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { artistName: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ],
      isActive: true,
      isAvailable: true,
    })
      .limit(limit)
      .select('name price category artistName images thumbnailUrl averageRating')
      .lean();

    return products;
  } catch (error) {
    console.error('Product search error:', error);
    return [];
  }
}

// Get user orders
async function getUserOrders(userId: string, limit: number = 5) {
  try {
    await connectDB();
    
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('orderId status total createdAt items')
      .lean();

    return orders;
  } catch (error) {
    console.error('Order fetch error:', error);
    return [];
  }
}

// Format products for AI context
function formatProductsForAI(products: any[]): string {
  if (products.length === 0) return 'No products found.';
  
  return products.map((p, i) => 
    `${i + 1}. ${p.name} by ${p.artistName} - ₱${p.price.toFixed(2)} (${p.category}) ${p.averageRating ? `★${p.averageRating.toFixed(1)}` : ''}`
  ).join('\n');
}

// Format orders for AI context
function formatOrdersForAI(orders: any[]): string {
  if (orders.length === 0) return 'No orders found.';
  
  return orders.map((o, i) => 
    `${i + 1}. Order ${o.orderId} - ${o.status} - ₱${o.total.toFixed(2)} (${new Date(o.createdAt).toLocaleDateString()})`
  ).join('\n');
}

// Groq API Call (with retry)
async function callGroqAPI(messages: any[]) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 150 }),
    });
    if (res.ok) return await res.json();
    if (res.status === 429) await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Groq API unavailable after retries');
}

// Quick Actions (Centralized)
const QUICK_ACTIONS = {
  BROWSE: { label: '🛍️ Browse Products', action: 'navigate', path: '/marketplace' },
  ORDERS: { label: '📦 My Orders', action: 'navigate', path: '/orders' },
  WISHLIST: { label: '❤️ Wishlist', action: 'navigate', path: '/wishlist' },
  LOGIN: { label: '🔑 Log In', action: 'navigate', path: '/login' },
  SUPPORT: { label: '📧 Contact Support', action: 'navigate', path: '/profile' },
};

// Main POST Handler
export async function POST(request: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'missing_api_key',
      message: 'Chatbot service not configured',
      data: { response: "Currently unavailable.", quickActions: [QUICK_ACTIONS.SUPPORT] },
    }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { message, conversationHistory = [] } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
  }

  // Detect intent
  const intent = detectIntent(message);
  const locationTerm = extractLocationTerm(message);

  let contextInfo = '';
  let products: any[] = [];
  let orders: any[] = [];
  let quickActions: any[] = [];

  try {
    // Handle each intent with actual database queries
    switch (intent) {
      case 'HOME':
        {
          const [homeProducts, homeArtisans] = await Promise.all([
            getFeaturedProducts(4),
            getFeaturedArtisans(4),
          ]);
          const announcements = getCommunityAnnouncements();
          contextInfo = `${homeArtisans.length ? `Top artisans:\n${formatArtisansForAI(homeArtisans)}` : ''}
${homeProducts.length ? `\nFeatured crafts:\n${formatProductsForAI(homeProducts)}` : ''}
${announcements.length ? `\nCommunity: ${announcements.join(' | ')}` : ''}`.trim();
          quickActions = [
            QUICK_ACTIONS.BROWSE,
            { label: '🎨 Stories', action: 'navigate', path: '/stories' },
            { label: '🗺️ Map', action: 'navigate', path: '/map' },
            { label: '🧑‍🎨 Start Selling', action: 'navigate', path: '/profile?tab=seller' },
          ];
        }
        break;
      case 'GREETING':
        quickActions = [QUICK_ACTIONS.BROWSE, QUICK_ACTIONS.ORDERS, QUICK_ACTIONS.WISHLIST];
        contextInfo = 'Greet warmly. Ask how you can help with: shopping, tracking orders, or browsing artisan stories/events.';
        break;

      case 'GOODBYE':
        quickActions = [QUICK_ACTIONS.BROWSE];
        contextInfo = 'Say goodbye warmly and invite them to visit again.';
        break;

      case 'WHO_ARE_YOU':
        quickActions = [QUICK_ACTIONS.BROWSE];
        contextInfo = 'Introduce yourself as KaLokal, the shopping assistant for GrowLokal marketplace, supporting local Filipino artisans.';
        break;

      case 'ARTISAN_STORIES':
        {
          // Try to extract a specific artisan name (e.g., "story of Ana", "about Maria")
          const nameMatch = message.match(/(?:about|story of|tell me about|who is)\s+([a-zA-Z\s\-']{2,40})/i);
          const nameTerm = nameMatch?.[1]?.trim();
          if (nameTerm) {
            const artisan = await findArtisanByName(nameTerm);
            if (artisan) {
              const displayName = artisan?.sellerProfile?.shopName || artisan?.name || nameTerm;
              const story = artisan?.sellerProfile?.sellerStory || 'Local artisan creating handcrafted goods.';
              contextInfo = `Story: ${displayName} – ${story.substring(0, 180)}...`;
              quickActions = [
                { label: '📖 All Stories', action: 'navigate', path: '/stories' },
                { label: `🛍️ Shop ${displayName}`, action: 'search', query: displayName },
              ];
              break;
            }
          }
          // Otherwise, show featured artisans
          const featuredArtisans = await getFeaturedArtisans(4);
          if (featuredArtisans.length > 0) {
            contextInfo = `🎨 REAL ARTISANS FROM GROWLOKAL:\n${formatArtisansForAI(featuredArtisans)}`;
            quickActions = [
              { label: '📖 Read All Stories', action: 'navigate', path: '/stories' },
              { label: '🛍️ Shop Artisans', action: 'navigate', path: '/marketplace' },
            ];
          } else {
            contextInfo = 'Meet our Filipino artisans and read their stories.';
            quickActions = [
              { label: '📖 Read Stories', action: 'navigate', path: '/stories' },
              { label: '🛍️ Browse', action: 'navigate', path: '/marketplace' },
            ];
          }
        }
        break;

      case 'EVENTS':
        // Extract year from message if mentioned (e.g., "2026", "in 2026")
        const yearMatch = message.match(/\b(202[0-9]|201[0-9])\b/);
        const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
        
        // Get events (filtered by year if mentioned)
        const allEvents = year ? getEvents(year) : getEvents();
        
        quickActions = [
          { label: '📅 View All Events', action: 'navigate', path: '/events' },
          { label: '🛍️ Shop While Browsing', action: 'navigate', path: '/marketplace' },
        ];
        
        if (allEvents.length > 0) {
          const workshopsAndDemos = allEvents.filter(e => e.type === 'Workshop' || e.type === 'Demo').length;
          const bookingInfo = workshopsAndDemos > 0 
            ? `\n\n✨ TIP: You can BOOK workshops and demos! We have ${workshopsAndDemos} hands-on experiences available where you can learn from artisans.`
            : '';
          contextInfo = `🎉 REAL EVENTS FROM GROWLOKAL:\n${formatEventsForAI(allEvents)}\n\nMention specific events with dates and locations. These are actual upcoming events where our artisans showcase and sell.${bookingInfo}`;
        } else {
          contextInfo = year 
            ? `No events scheduled for ${year} yet. Check back soon!`
            : 'We have community events, workshops, and craft fairs throughout the year. You can book workshops and demos directly! Direct them to our Events page for the full calendar.';
        }
        break;

      case 'PRODUCT_SEARCH':
        {
          const searchQuery = message.replace(/find|search|looking for|show me|need|want|buy|product|item|shop|browse|what do you|do you have|does.*marketplace have|does.*have|the marketplace/gi, '').trim();
          products = searchQuery.length > 2 || locationTerm ? await searchProducts(searchQuery || '', 5, locationTerm || undefined) : await getFeaturedProducts(5);

          if (products.length > 0) {
            contextInfo = `Real products from GrowLokal:\n${formatProductsForAI(products)}`;
            // Suggest top artisans from result set
            const artisanCounts: Record<string, { count: number, name: string }> = {};
            products.forEach((p: any) => {
              const key = p.artistName || 'Artisan';
              artisanCounts[key] = artisanCounts[key] || { count: 0, name: key };
              artisanCounts[key].count += 1;
            });
            const topArtisans = Object.values(artisanCounts).sort((a,b)=>b.count-a.count).slice(0,2);

            quickActions = [
              ...products.slice(0, 3).map(p => ({ 
                label: `₱${p.price} - ${p.name.substring(0, 25)}`, 
                action: 'view_product', 
                productId: p._id?.toString?.() || ''
              })),
              ...topArtisans.map(a => ({ label: `🧑‍🎨 ${a.name}`, action: 'search', query: a.name })),
              QUICK_ACTIONS.BROWSE,
            ];
          } else {
            const alt = await getFeaturedProducts(5);
            products = alt;
            contextInfo = alt.length ? `No exact matches. Featured crafts:\n${formatProductsForAI(alt)}` : 'No items found. Try browsing our marketplace.';
            quickActions = [QUICK_ACTIONS.BROWSE];
          }
        }
        break;

      case 'ORDER_TRACKING':
        if (session?.user?.id) {
          orders = await getUserOrders(session.user.id, 5);
          if (orders.length > 0) {
            contextInfo = `User's orders:\n${formatOrdersForAI(orders)}\nBriefly reference their order status.`;
            quickActions = [
              { label: '📦 View All Orders', action: 'navigate', path: '/orders' },
            ];
          } else {
            contextInfo = 'User has no orders yet. Encourage them to start shopping.';
            quickActions = [QUICK_ACTIONS.BROWSE];
          }
        } else {
          contextInfo = 'User is not logged in. Ask them to log in to track orders.';
          quickActions = [QUICK_ACTIONS.LOGIN];
        }
        break;

      case 'SHIPPING':
        contextInfo = 'Respond directly: "We offer free shipping on orders over ₱500. Standard delivery is 3-7 business days."';
        quickActions = [QUICK_ACTIONS.BROWSE];
        break;

      case 'PAYMENT':
        contextInfo = 'Respond directly: "We accept GCash, credit/debit cards via PayMongo, and cash on delivery."';
        quickActions = [QUICK_ACTIONS.BROWSE];
        break;

      case 'RETURN_REFUND':
        contextInfo = 'Respond: "Contact our support team for returns and refunds within 7 days of delivery."';
        quickActions = [QUICK_ACTIONS.SUPPORT];
        break;

      case 'MAP':
        {
          // If a location was mentioned, try to pull nearby items
          if (locationTerm) {
            const nearby = await searchProducts('', 5, locationTerm);
            if (nearby.length > 0) {
              contextInfo = `Nearby crafts in "${locationTerm}":\n${formatProductsForAI(nearby)}`;
            } else {
              contextInfo = `Explore artisans near ${locationTerm} on our map.`;
            }
          } else {
            contextInfo = 'Explore artisans by location using our interactive map.';
          }
          quickActions = [
            { label: '🗺️ Open Map', action: 'navigate', path: '/map' },
            QUICK_ACTIONS.BROWSE,
          ];
        }
        break;

      case 'SELLER':
        contextInfo = 'Go to your Profile, tap Start Selling, then complete verification.';
        quickActions = [{ label: '🎨 Start Selling', action: 'navigate', path: '/profile?tab=seller' }];
        break;

      case 'ABOUT_PLATFORM':
        products = await getFeaturedProducts(4);
        contextInfo = products.length
          ? `GrowLokal examples:\n${formatProductsForAI(products)}\nBriefly: GrowLokal connects Filipino artisans with customers through handmade products, artisan stories, community events, and bookable workshops. You can learn directly from artisans by booking our demo and workshop events!`
          : 'GrowLokal is an e-commerce platform supporting local Filipino artisans, featuring handmade products, artisan stories, community events, and bookable workshops where you can learn directly from artists.';
        quickActions = [
          { label: '📖 Stories', action: 'navigate', path: '/stories' },
          { label: '📅 Book Events', action: 'navigate', path: '/events' },
          { label: '🛍️ Browse', action: 'navigate', path: '/marketplace' },
        ];
        break;

      case 'PRICE_INQUIRY':
        products = await getFeaturedProducts(3);
        contextInfo = products.length
          ? `Sample pricing:\n${formatProductsForAI(products)}\nExplain prices vary by artisan and product type.`
          : 'Prices vary by product and artisan. Browse our marketplace to see available items and their pricing.';
        quickActions = [QUICK_ACTIONS.BROWSE];
        break;

      case 'WISHLIST':
        if (session?.user?.id) {
          quickActions = [
            { label: '❤️ View Wishlist', action: 'navigate', path: '/wishlist' },
            { label: '🛍️ Browse', action: 'navigate', path: '/marketplace' },
          ];
          contextInfo = 'User is logged in. Direct them to manage their wishlist.';
        } else {
          contextInfo = 'User must log in to save wishlist items.';
          quickActions = [QUICK_ACTIONS.LOGIN];
        }
        break;

      case 'ACCOUNT':
      case 'HELP':
        quickActions = [
          { label: '📅 Book Events', action: 'navigate', path: '/events' },
          { label: '👤 Profile', action: 'navigate', path: '/profile' },
        ];
        contextInfo = 'Help them with: browsing products, tracking orders, booking workshops/demos, or account support. Mention they can book hands-on workshops and demonstrations directly on our Events page!';
        break;

      case 'THANKS':
        contextInfo = 'Respond: "You\'re welcome! Need anything else?"';
        quickActions = [QUICK_ACTIONS.BROWSE];
        break;

      case 'HOW_ARE_YOU':
        contextInfo = 'Respond: "I\'m great! Looking for something to shop or want to learn about our artisans?"';
        quickActions = [QUICK_ACTIONS.BROWSE];
        break;

      case 'GENERAL':
      default:
        {
          const lower = message.toLowerCase();
          if (lower.includes('home') || lower.includes('homepage')) {
            const [hp, ha] = await Promise.all([getFeaturedProducts(3), getFeaturedArtisans(3)]);
            contextInfo = `${ha.length ? `Top artisans:\n${formatArtisansForAI(ha)}` : ''}${hp.length ? `\nFeatured crafts:\n${formatProductsForAI(hp)}` : ''}`.trim();
            quickActions = [
              QUICK_ACTIONS.BROWSE,
              { label: '📖 Stories', action: 'navigate', path: '/stories' },
              { label: '🗺️ Map', action: 'navigate', path: '/map' },
            ];
          } else if (/(artisan|story|stories|maker|handmade)/i.test(message)) {
            const generalArtisans = await getFeaturedArtisans(4);
            contextInfo = generalArtisans.length ? `🎨 Artisans:\n${formatArtisansForAI(generalArtisans)}` : 'Meet our Filipino artisans and their stories.';
            quickActions = [
              { label: '📖 Read Stories', action: 'navigate', path: '/stories' },
              QUICK_ACTIONS.BROWSE,
            ];
          } else if (/(shop|buy|find|want|need|product|item)/i.test(message)) {
            products = await getFeaturedProducts(4);
            contextInfo = products.length ? `Featured items:\n${formatProductsForAI(products)}` : 'Browse our marketplace for handmade crafts.';
            quickActions = [QUICK_ACTIONS.BROWSE];
          } else if (/(map|near|in|around|barangay|location)/i.test(message)) {
            if (locationTerm) {
              const nearby = await searchProducts('', 4, locationTerm);
              contextInfo = nearby.length ? `Nearby crafts in "${locationTerm}":\n${formatProductsForAI(nearby)}` : `Open the map to explore artisans near ${locationTerm}.`;
            } else {
              contextInfo = 'Open the map to explore artisans by location.';
            }
            quickActions = [ { label: '🗺️ Open Map', action: 'navigate', path: '/map' } ];
          } else {
            contextInfo = 'I can help you shop, explore artisans/stories, or find nearby crafts.';
            quickActions = [QUICK_ACTIONS.BROWSE, QUICK_ACTIONS.ORDERS];
          }
        }
        break;
    }
  } catch (error) {
    console.error('Error processing intent:', error);
  }

  // Build conversation context
  const conversationContext = conversationHistory.slice(-6).map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n');

  const systemPromptWithContext = `${SYSTEM_PROMPT}

${contextInfo}

${products.length > 0 ? `🛍️ REAL PRODUCTS FROM GROWLOKAL DATABASE:\n${formatProductsForAI(products)}\n\nReference these by name and price.` : ''}

${orders.length > 0 ? `📦 USER'S ACTUAL ORDERS:\n${formatOrdersForAI(orders)}` : ''}

CRITICAL: Only mention products/orders/events that exist in the above data. Do NOT make up any information. Keep response 1-2 sentences maximum.`;

  // Call Groq API
  let groqData;
  try {
    groqData = await callGroqAPI([
      { role: 'system', content: systemPromptWithContext },
      { role: 'user', content: `${conversationContext ? 'Previous:\n' + conversationContext + '\n\n' : ''}User: ${message}\n\nRespond in 1-2 sentences max. Only reference real data from above. Do not make anything up.` }
    ]);
  } catch (err) {
    console.error('Groq API error:', err);
    return NextResponse.json({
      success: false,
      error: 'chatbot_unavailable',
      message: 'Groq API error',
      data: { response: "I'm having trouble connecting right now. Please try again or browse our marketplace.", quickActions: [QUICK_ACTIONS.BROWSE, QUICK_ACTIONS.SUPPORT] },
    }, { status: 503 });
  }

  const responseText = groqData.choices?.[0]?.message?.content || "I'm here but cannot respond right now.";

  return NextResponse.json({
    success: true,
    data: {
      response: responseText,
      intent,
      products: products.slice(0, 3),
      orders: orders.slice(0, 3),
      quickActions: quickActions.length > 0 ? quickActions : undefined,
    }
  });
}
// GET Status Handler
export async function GET() {
  const hasApiKey = !!GROQ_API_KEY;
  return NextResponse.json({
    success: true,
    data: { status: hasApiKey ? 'online' : 'offline', name: 'KaLokal', model: GROQ_MODEL },
  });
}
