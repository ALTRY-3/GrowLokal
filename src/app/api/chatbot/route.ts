import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// System prompt for KaLokal chatbot
const SYSTEM_PROMPT = `You are KaLokal, a friendly and helpful AI shopping assistant for GrowLokal - an e-commerce marketplace platform supporting local artisans and entrepreneurs in Olongapo, Philippines.

PERSONALITY & COMMUNICATION STYLE:
- Warm, friendly, and conversational (like chatting with a helpful friend)
- Professional yet approachable and personable
- Enthusiastic about Filipino culture, crafts, and local products
- Use natural Filipino expressions when appropriate (e.g., "Kumusta!", "Salamat po!", "Oo naman!")
- Empathetic and patient with users
- Positive and encouraging

CORE IDENTITY:
- Your name is KaLokal (means "Local" in Filipino)
- You represent GrowLokal marketplace
- You're here to help customers discover amazing local products
- You support Filipino artisans and small businesses

YOUR CAPABILITIES:
✅ Product Discovery: Help find handicrafts, fashion, home decor, food, beauty products
✅ Order Assistance: Track orders, check delivery status, answer shipping questions
✅ Shopping Help: Manage wishlists, provide recommendations, answer product questions
✅ Platform Support: Explain how GrowLokal works, payment methods, shipping policies
✅ Seller Support: Guide users on becoming sellers, listing products
✅ General Conversation: Greet users, answer basic questions, provide friendly chat

PRODUCT CATEGORIES WE OFFER:
🎨 Handicrafts - Traditional weaving, pottery, woodwork, embroidery, basketry
👗 Fashion - Handmade clothes, accessories, jewelry, bags, shoes
🏠 Home & Decor - Furniture, textiles, decorations, kitchenware
🍽️ Food & Delicacies - Local snacks, ingredients, specialty foods
💄 Beauty & Wellness - Natural cosmetics, skincare, wellness products

CONVERSATIONAL GUIDELINES:
1. GREETINGS: Always respond warmly to greetings. Introduce yourself naturally.
   Example: "Hi! I'm KaLokal, your friendly shopping assistant! 😊 I'm here to help you discover amazing products from local Filipino artisans. What are you looking for today?"

2. INTRODUCTIONS: When asked who you are, explain enthusiastically:
   Example: "I'm KaLokal! Think of me as your personal shopping buddy for GrowLokal marketplace. I help you find beautiful handmade products from talented local artisans in Olongapo. From pottery to fashion, I know our catalog inside out! How can I assist you?"

3. THANK YOU: Respond graciously to thanks.
   Example: "You're very welcome! Salamat for shopping local! 💚 Is there anything else I can help you with?"

4. GOODBYE: Say warm farewells.
   Example: "Thank you for visiting GrowLokal! Come back soon to discover more amazing local products. Paalam! 👋"

5. SMALL TALK: Engage naturally but guide toward shopping.
   Example: "I'm doing great, thank you for asking! I love helping people like you discover beautiful local products. Speaking of which, are you looking for anything special today?"

6. UNCLEAR QUESTIONS: Ask for clarification politely.
   Example: "I'd love to help! Could you tell me a bit more about what you're looking for?"

7. APOLOGIES: If you can't help, be understanding and offer alternatives.
   Example: "I apologize, but I don't have information about that. However, I can help you browse our amazing product collection or connect you with our support team!"

RESPONSE STYLE:
- Keep responses conversational and natural (2-4 sentences)
- Use emojis occasionally to be friendly (🛍️ 😊 💚 ✨ 🎨)
- Be specific when mentioning products or features
- Always try to be helpful and actionable
- Guide users toward next steps (browse, search, view orders, etc.)

PLATFORM KNOWLEDGE:
- Free shipping on orders over ₱500
- We support GCash, Cards, and other payment methods via PayMongo
- Standard delivery: 3-7 business days
- Users can save items to wishlist
- Sellers are verified local artisans
- Products are handmade and support local communities

Remember: You're not just a bot - you're a passionate advocate for Filipino artisans and a friendly shopping companion!`;

// Intent detection keywords
const INTENTS = {
  GREETING: ['hi', 'hello', 'hey', 'kumusta', 'good morning', 'good afternoon', 'good evening', 'greetings', 'hola', 'sup', 'yo'],
  GOODBYE: ['bye', 'goodbye', 'see you', 'later', 'paalam', 'thanks bye', 'gotta go', 'have to go'],
  THANKS: ['thank you', 'thanks', 'salamat', 'appreciate', 'grateful', 'ty', 'thx'],
  WHO_ARE_YOU: ['who are you', 'what are you', 'introduce yourself', 'tell me about yourself', 'your name', 'what is kalokal'],
  HOW_ARE_YOU: ['how are you', 'how r u', 'kamusta ka', "what's up", 'you good', 'doing well'],
  PRODUCT_SEARCH: ['find', 'search', 'looking for', 'show me', 'need', 'want', 'buy', 'product', 'item', 'shop', 'browse'],
  ORDER_TRACKING: ['order', 'track', 'delivery', 'status', 'shipped', 'when will', 'tracking', 'package', 'my order'],
  WISHLIST: ['wishlist', 'saved', 'favorites', 'wish list', 'save for later', 'bookmark'],
  SHIPPING: ['shipping', 'delivery', 'ship', 'deliver', 'shipping fee', 'free shipping', 'how long'],
  PAYMENT: ['payment', 'pay', 'gcash', 'credit card', 'debit', 'payment method', 'how to pay'],
  RETURN_REFUND: ['return', 'refund', 'exchange', 'money back', 'cancel order', 'not satisfied'],
  HELP: ['help', 'support', 'how to', 'how do i', 'what is', 'explain', 'guide', 'assist'],
  ACCOUNT: ['account', 'profile', 'login', 'signup', 'register', 'password', 'email', 'sign in'],
  SELLER: ['sell', 'seller', 'become seller', 'apply', 'vendor', 'i want to sell', 'start selling'],
  ABOUT_PLATFORM: ['what is growlokal', 'about growlokal', 'tell me about', 'how does it work', 'what do you sell'],
  PRICE_INQUIRY: ['price', 'cost', 'how much', 'expensive', 'cheap', 'afford', 'pricing'],
};

// Detect user intent from message
function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent;
    }
  }
  
  return 'GENERAL';
}

// Search products based on query
async function searchProducts(query: string, limit: number = 5) {
  try {
    await connectDB();
    
    // Try text search first
    let products = await Product.find(
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

    // If no results, try partial match
    if (products.length === 0) {
      products = await Product.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
        ],
        isActive: true,
        isAvailable: true,
      })
        .limit(limit)
        .select('name price category artistName images thumbnailUrl averageRating')
        .lean();
    }

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

// Main chatbot API endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    // Detect intent
    const intent = detectIntent(message);
    let contextInfo = '';
    let products: any[] = [];
    let orders: any[] = [];
    let quickActions: any[] = [];

    // Handle different intents
    switch (intent) {
      case 'GREETING':
        quickActions = [
          { label: '🛍️ Browse Products', action: 'navigate', path: '/marketplace' },
          { label: '📦 My Orders', action: 'navigate', path: '/orders' },
          { label: '❤️ Wishlist', action: 'navigate', path: '/wishlist' },
        ];
        contextInfo = '\n\nThis is a greeting. Introduce yourself warmly as KaLokal and ask how you can help them today.';
        break;

      case 'GOODBYE':
        quickActions = [
          { label: '🛍️ Browse Products', action: 'navigate', path: '/marketplace' },
        ];
        contextInfo = '\n\nUser is saying goodbye. Respond warmly and invite them to come back soon.';
        break;

      case 'THANKS':
        quickActions = [
          { label: '🛍️ Continue Shopping', action: 'navigate', path: '/marketplace' },
        ];
        contextInfo = '\n\nUser is thanking you. Respond graciously and ask if there is anything else you can help with.';
        break;

      case 'WHO_ARE_YOU':
        quickActions = [
          { label: '🎨 About GrowLokal', action: 'navigate', path: '/artiststory' },
          { label: '🛍️ Start Shopping', action: 'navigate', path: '/marketplace' },
        ];
        contextInfo = '\n\nUser wants to know who you are. Introduce yourself as KaLokal, explain your purpose enthusiastically.';
        break;

      case 'HOW_ARE_YOU':
        quickActions = [
          { label: '🛍️ Browse Products', action: 'navigate', path: '/marketplace' },
        ];
        contextInfo = '\n\nUser is asking how you are. Respond positively and guide toward shopping.';
        break;

      case 'SHIPPING':
        quickActions = [
          { label: '🛍️ Start Shopping', action: 'navigate', path: '/marketplace' },
        ];
        contextInfo = '\n\nUser asking about shipping. Info: Free shipping over ₱500, standard delivery 3-7 business days.';
        break;

      case 'PAYMENT':
        quickActions = [
          { label: '🛒 Go to Checkout', action: 'navigate', path: '/cart' },
        ];
        contextInfo = '\n\nUser asking about payment. Info: We accept GCash, Credit/Debit Cards via PayMongo. Safe and secure.';
        break;

      case 'RETURN_REFUND':
        quickActions = [
          { label: '📧 Contact Support', action: 'navigate', path: '/profile' },
        ];
        contextInfo = '\n\nUser asking about returns/refunds. Explain our policy and suggest contacting support for specific cases.';
        break;

      case 'ABOUT_PLATFORM':
        quickActions = [
          { label: '🎨 Our Story', action: 'navigate', path: '/artiststory' },
          { label: '🛍️ Browse Products', action: 'navigate', path: '/marketplace' },
        ];
        contextInfo = '\n\nUser asking about GrowLokal. Explain: marketplace for local Filipino artisans in Olongapo, handmade products, supporting local communities.';
        break;

      case 'PRODUCT_SEARCH':
        // Extract search query (remove common phrases)
        const searchQuery = message
          .toLowerCase()
          .replace(/find|search|looking for|show me|need|want|buy|product|item|shop|browse/gi, '')
          .trim();
        
        if (searchQuery) {
          products = await searchProducts(searchQuery);
          contextInfo = `\n\nAvailable products matching "${searchQuery}":\n${formatProductsForAI(products)}`;
          
          if (products.length > 0) {
            quickActions = products.slice(0, 3).map(p => ({
              label: p.name,
              action: 'view_product',
              productId: p._id.toString(),
            }));
          } else {
            quickActions = [
              { label: '🛍️ Browse All Products', action: 'navigate', path: '/marketplace' },
            ];
          }
        }
        break;

      case 'ORDER_TRACKING':
        if (session?.user?.email) {
          orders = await getUserOrders(session.user.email);
          contextInfo = `\n\nUser's recent orders:\n${formatOrdersForAI(orders)}`;
          
          if (orders.length > 0) {
            quickActions = orders.slice(0, 3).map(o => ({
              label: `Order ${o.orderId}`,
              action: 'view_order',
              orderId: o._id.toString(),
            }));
          } else {
            quickActions = [
              { label: '🛍️ Start Shopping', action: 'navigate', path: '/marketplace' },
            ];
          }
        } else {
          contextInfo = '\n\nUser is not logged in. They need to log in to view orders.';
          quickActions = [{ label: '🔑 Log In', action: 'navigate', path: '/login' }];
        }
        break;

      case 'WISHLIST':
        if (session?.user?.email) {
          quickActions = [
            { label: '❤️ View Wishlist', action: 'navigate', path: '/wishlist' },
            { label: '🛍️ Browse Products', action: 'navigate', path: '/marketplace' },
          ];
        } else {
          contextInfo = '\n\nUser is not logged in. They need to log in to access wishlist.';
          quickActions = [{ label: '🔑 Log In', action: 'navigate', path: '/login' }];
        }
        break;

      case 'SELLER':
        quickActions = [
          { label: '🎨 Become a Seller', action: 'navigate', path: '/profile?tab=seller' },
          { label: '📖 Learn More', action: 'navigate', path: '/artiststory' },
        ];
        contextInfo = '\n\nUser interested in becoming a seller. Explain the benefits and guide them to the seller application.';
        break;

      case 'HELP':
      case 'ACCOUNT':
        quickActions = [
          { label: '� My Profile', action: 'navigate', path: '/profile' },
          { label: '❓ Help Center', action: 'navigate', path: '/artiststory' },
        ];
        break;

      case 'PRICE_INQUIRY':
        quickActions = [
          { label: '🛍️ Browse Products', action: 'navigate', path: '/marketplace' },
        ];
        contextInfo = '\n\nUser asking about prices. Explain that prices vary by product and artisan. Guide them to browse the marketplace.';
        break;
    }

    // Build conversation context for Gemini
    const conversationContext = conversationHistory
      .slice(-6)
      .map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');

    // Build the full prompt for Gemini
    const fullPrompt = `${SYSTEM_PROMPT}${contextInfo}

Previous conversation:
${conversationContext || 'No previous conversation'}

User's current message: ${message}

IMPORTANT: Respond naturally and conversationally as KaLokal. Match the user's tone and energy. Be warm, helpful, and engaging. Use emojis sparingly but effectively. Keep it friendly and concise (2-4 sentences).`;

    // Call Gemini API
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text() || 
      "I'm sorry, I couldn't process that. Could you please rephrase?";

    return NextResponse.json({
      success: true,
      data: {
        response: aiResponse,
        intent,
        products: products.length > 0 ? products.slice(0, 3) : undefined,
        orders: orders.length > 0 ? orders.slice(0, 3) : undefined,
        quickActions: quickActions.length > 0 ? quickActions : undefined,
      },
    });

  } catch (error: any) {
    console.error('Chatbot API error:', error);
    
    // Fallback response if Gemini fails
    return NextResponse.json({
      success: true,
      data: {
        response: "I'm having trouble connecting right now. Please try asking your question in a different way, or check out our marketplace to browse products!",
        quickActions: [
          { label: 'Browse Marketplace', action: 'navigate', path: '/marketplace' },
          { label: 'Contact Support', action: 'navigate', path: '/profile' },
        ],
      },
    });
  }
}

// GET endpoint to get chatbot status
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'online',
      name: 'KaLokal',
      capabilities: [
        'Product Search',
        'Order Tracking',
        'Wishlist Management',
        'General Help',
        'Seller Assistance',
      ],
    },
  });
}
