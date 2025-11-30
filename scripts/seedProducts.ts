/**
 * Product Seeding Script
 * 
 * This script seeds the database with the existing hardcoded products
 * from the marketplace page.
 * 
 * Run with: node --loader ts-node/esm scripts/seedProducts.ts
 * Or add to package.json scripts: "seed:products": "tsx scripts/seedProducts.ts"
 */

// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Now import after env is loaded
import connectDB from '../src/lib/mongodb.js';
import Product from '../src/models/Product.js';
import mongoose from 'mongoose';

// Dummy artist ID (you should replace this with real user IDs from your database)
const DUMMY_ARTIST_ID = new mongoose.Types.ObjectId();

const products = [
  // HANDICRAFTS
  {
    name: "Acacia Wood Deep Round Plate",
    description: "Beautifully handcrafted acacia wood deep round plate, perfect for serving your favorite dishes. Made from sustainable acacia wood with natural grain patterns that make each piece unique. Food-safe finish suitable for daily use.",
    shortDescription: "Handcrafted acacia wood serving plate with natural grain patterns",
    category: "handicrafts",
    price: 149.00,
    stock: 25,
    images: ["/box1.png", "/box1.1.png"],
    artistName: "THERESA",
    materials: ["Acacia Wood"],
    tags: ["wooden", "plate", "handmade", "kitchen", "sustainable"],
  },
  {
    name: "Classic Woven Fedora Hat",
    description: "Traditional Filipino woven fedora hat made from locally sourced materials. Provides excellent sun protection while maintaining breathability. Perfect for tropical weather and casual outings.",
    shortDescription: "Traditional woven fedora hat with excellent sun protection",
    category: "handicrafts",
    price: 249.75,
    stock: 15,
    images: ["/box2.png", "/box2.2.png"],
    artistName: "TROPIKO",
    materials: ["Buri Palm", "Rattan"],
    tags: ["hat", "woven", "summer", "accessories", "traditional"],
  },
  {
    name: "Acacia Wood Salad Tosser",
    description: "Hand-carved acacia wood salad tossers, ideal for mixing and serving salads. The smooth finish and ergonomic design make them both functional and beautiful. Set includes two tossers.",
    shortDescription: "Hand-carved wooden salad serving set",
    category: "handicrafts",
    price: 349.75,
    stock: 18,
    images: ["/box3.png", "/box3.3.png"],
    artistName: "MANG JUAN",
    materials: ["Acacia Wood"],
    tags: ["wooden", "salad", "kitchen", "utensils", "handcarved"],
  },
  {
    name: "Acacia Wood Ladle",
    description: "Sturdy hand-carved acacia wood ladle perfect for soups, stews, and sauces. Heat-resistant handle and food-safe finish. The natural wood grain makes each piece one-of-a-kind.",
    shortDescription: "Hand-carved wooden ladle with heat-resistant handle",
    category: "handicrafts",
    price: 199.00,
    stock: 30,
    images: ["/box4.png", "/box4.4.png"],
    artistName: "MARIA",
    materials: ["Acacia Wood"],
    tags: ["wooden", "ladle", "kitchen", "cooking", "handmade"],
  },
  {
    name: "Acacia Wood Plate",
    description: "Premium acacia wood serving plate with rich natural tones. Perfect for presenting appetizers, cheese boards, or main courses. Durable and easy to maintain with proper care.",
    shortDescription: "Premium wooden serving plate with rich natural tones",
    category: "handicrafts",
    price: 499.00,
    stock: 20,
    images: ["/box5.png", "/box5.5.png"],
    artistName: "JOSE",
    materials: ["Acacia Wood"],
    tags: ["wooden", "plate", "serving", "premium", "handmade"],
  },
  {
    name: "Hardin Beaded Earrings",
    description: "Intricately handcrafted beaded earrings featuring traditional Filipino patterns. Lightweight and comfortable for all-day wear. Each pair is unique with vibrant colors and detailed beadwork.",
    shortDescription: "Handcrafted beaded earrings with traditional patterns",
    category: "handicrafts",
    price: 499.00,
    stock: 12,
    images: ["/box6.png", "/box6.6.png"],
    artistName: "BOHO",
    materials: ["Glass Beads", "Metal Wire"],
    tags: ["earrings", "jewelry", "beaded", "accessories", "traditional"],
  },
  {
    name: "Handwoven Buri Bag",
    description: "Eco-friendly handwoven bag made from natural buri palm fibers. Features sturdy construction and ample storage space. Perfect for shopping, beach trips, or everyday use.",
    shortDescription: "Eco-friendly woven bag from natural palm fibers",
    category: "handicrafts",
    price: 79.00,
    stock: 35,
    images: ["/box7.png", "/box7.7.png"],
    artistName: "LENG",
    materials: ["Buri Palm Fiber"],
    tags: ["bag", "woven", "eco-friendly", "sustainable", "shopping"],
  },
  {
    name: "Round Nito Placemat",
    description: "Handwoven nito vine placemats that add rustic charm to any dining table. Heat-resistant and durable. Natural variations in color and texture make each piece unique.",
    shortDescription: "Handwoven vine placemats with rustic charm",
    category: "handicrafts",
    price: 399.00,
    stock: 28,
    images: ["/box8.png", "/box8.8.png"],
    artistName: "TAHANAN",
    materials: ["Nito Vine"],
    tags: ["placemat", "woven", "table", "dining", "rustic"],
  },

  // FASHION
  {
    name: "Blue Leaf Print Dress",
    description: "Elegant blue leaf print dress made from traditional Piña cloth. Lightweight, breathable fabric perfect for tropical weather. Features intricate botanical patterns handwoven into the fabric.",
    shortDescription: "Elegant Piña cloth dress with leaf print",
    category: "fashion",
    price: 199.75,
    stock: 10,
    images: ["/fashion1.png", "/fashion1.1.png"],
    artistName: "PIÑA CLOTH",
    materials: ["Piña Cloth"],
    tags: ["dress", "fashion", "pina", "traditional", "elegant"],
  },
  {
    name: "Tie-Dye Tube Dress",
    description: "Vibrant tie-dye tube dress made from natural cotton. Unique color patterns ensure no two dresses are alike. Comfortable stretch fit suitable for various body types.",
    shortDescription: "Vibrant tie-dye cotton tube dress",
    category: "fashion",
    price: 699.00,
    stock: 8,
    images: ["/fashion2.png", "/fashion2.2.png"],
    artistName: "NATURAL",
    materials: ["Natural Cotton"],
    tags: ["dress", "tie-dye", "summer", "casual", "colorful"],
  },
  {
    name: "Crochet Dress with Beaded Straps",
    description: "Handmade crochet dress featuring delicate beaded straps. Made from premium cotton yarn with intricate lacework. Perfect for beach vacations or summer parties.",
    shortDescription: "Handmade crochet dress with beaded details",
    category: "fashion",
    price: 799.00,
    stock: 6,
    images: ["/fashion3.png", "/fashion3.3.png"],
    artistName: "COTTON",
    materials: ["Cotton Yarn", "Glass Beads"],
    tags: ["dress", "crochet", "handmade", "beaded", "summer"],
  },
  {
    name: "Banig Belt",
    description: "Stylish handwoven banig (mat) belt with traditional patterns. Features adjustable sizing and durable construction. Adds a unique Filipino touch to any outfit.",
    shortDescription: "Handwoven traditional belt with patterns",
    category: "fashion",
    price: 399.00,
    stock: 15,
    images: ["/fashion4.png", "/fashion4.4.png"],
    artistName: "PATTERNED",
    materials: ["Banig Mat", "Cotton"],
    tags: ["belt", "accessories", "woven", "traditional", "fashion"],
  },
  {
    name: "Embroidered Shawls",
    description: "Beautifully embroidered shawls showcasing traditional Filipino needlework. Soft, flowing fabric with intricate floral patterns. Versatile piece for formal or casual occasions.",
    shortDescription: "Embroidered shawl with traditional needlework",
    category: "fashion",
    price: 699.00,
    stock: 12,
    images: ["/fashion5.png", "/fashion5.5.png"],
    artistName: "NUEVO",
    materials: ["Silk Blend", "Cotton Thread"],
    tags: ["shawl", "embroidered", "traditional", "formal", "elegant"],
  },
  {
    name: "Collared Embroidered Shirt",
    description: "Classic collared shirt featuring hand-embroidered details. Made from breathable cotton with traditional Filipino motifs. Suitable for both casual and semi-formal wear.",
    shortDescription: "Embroidered cotton shirt with traditional motifs",
    category: "fashion",
    price: 899.00,
    stock: 14,
    images: ["/fashion6.png", "/fashion6.6.png"],
    artistName: "HANDMADE",
    materials: ["Cotton", "Embroidery Thread"],
    tags: ["shirt", "embroidered", "formal", "traditional", "cotton"],
  },
  {
    name: "Native Abaca Headband",
    description: "Colorful handwoven headband made from abaca fibers. Features multicolor tribal patterns. Comfortable and adjustable fit for all head sizes.",
    shortDescription: "Handwoven multicolor abaca headband",
    category: "fashion",
    price: 199.00,
    stock: 20,
    images: ["/fashion7.png", "/fashion7.7.png"],
    artistName: "MULTICOLOR",
    materials: ["Abaca Fiber"],
    tags: ["headband", "accessories", "woven", "colorful", "tribal"],
  },
  {
    name: "PH Embroidered Cap",
    description: "Stylish cap featuring Filipino-inspired embroidered designs. Quality cotton construction with adjustable strap. Shows pride in local culture and craftsmanship.",
    shortDescription: "Cotton cap with Filipino embroidered designs",
    category: "fashion",
    price: 249.00,
    stock: 25,
    images: ["/fashion8.png", "/fashion8.8.png"],
    artistName: "NATIVE",
    materials: ["Cotton", "Embroidery Thread"],
    tags: ["cap", "hat", "embroidered", "casual", "accessories"],
  },

  // HOME
  {
    name: "Floral Hand-Painted Fan",
    description: "Decorative hand-painted fan featuring beautiful landscape and floral designs. Made from traditional materials with intricate brushwork. Perfect wall decoration or functional cooling accessory.",
    shortDescription: "Hand-painted decorative fan with floral designs",
    category: "home",
    price: 249.00,
    stock: 15,
    images: ["/home1.png", "/home1.1.png"],
    artistName: "LANDSCAPE",
    materials: ["Bamboo", "Paper", "Acrylic Paint"],
    tags: ["fan", "decoration", "painted", "art", "traditional"],
  },
  {
    name: "Miniature Jeepney",
    description: "Handcrafted miniature jeepney model showcasing the iconic Filipino vehicle. Made from quality wood with detailed painting and decorations. Perfect souvenir or display piece.",
    shortDescription: "Handcrafted wooden jeepney model",
    category: "home",
    price: 499.00,
    stock: 10,
    images: ["/home2.png", "/home2.2.png"],
    artistName: "WOOD",
    materials: ["Wood", "Paint", "Metal Details"],
    tags: ["jeepney", "souvenir", "decoration", "wooden", "miniature"],
  },
  {
    name: "Retaso Patchwork",
    description: "Custom retaso (fabric scrap) patchwork quilt or wall hanging. Each piece uniquely designed using colorful fabric remnants. Sustainable art that celebrates Filipino resourcefulness.",
    shortDescription: "Custom patchwork from colorful fabric scraps",
    category: "home",
    price: 2799.00,
    stock: 3,
    images: ["/home3.png", "/home3.3.png"],
    artistName: "CUSTOM",
    materials: ["Cotton Fabric", "Polyester Fill"],
    tags: ["quilt", "patchwork", "custom", "sustainable", "colorful"],
    isFeatured: true,
  },
  {
    name: "Mother Pearl Pen Holder",
    description: "Elegant pen holder inlaid with mother of pearl. Features intricate patterns and smooth finish. Adds sophistication to any desk or workspace.",
    shortDescription: "Elegant pearl-inlaid pen holder",
    category: "home",
    price: 799.00,
    stock: 8,
    images: ["/home4.png", "/home4.4.png"],
    artistName: "TAHANAN",
    materials: ["Wood", "Mother of Pearl"],
    tags: ["pen-holder", "desk", "office", "elegant", "pearl"],
  },
  {
    name: "Handcrafted Christmas Parol",
    description: "Traditional Filipino Christmas lantern (parol) handcrafted with care. Features vibrant colors and classic star shape. Includes Filipino quote. Battery or plug-in lighting available.",
    shortDescription: "Traditional Filipino Christmas star lantern",
    category: "home",
    price: 1099.00,
    stock: 12,
    images: ["/home5.png", "/home5.5.png"],
    artistName: "FILIPINO QUOTE",
    materials: ["Bamboo", "Paper", "LED Lights"],
    tags: ["parol", "christmas", "lantern", "decoration", "traditional"],
    isFeatured: true,
  },
  {
    name: "Rice Grooved Kuksa Mug",
    description: "Traditional kuksa-style wooden mug with rice grain groove pattern. Handcarved from single piece of wood. Perfect for hot or cold beverages.",
    shortDescription: "Handcarved wooden mug with grooved pattern",
    category: "home",
    price: 449.00,
    stock: 16,
    images: ["/home6.png", "/home6.6.png"],
    artistName: "KAHOY",
    materials: ["Wood"],
    tags: ["mug", "wooden", "kuksa", "handcarved", "beverage"],
  },
  {
    name: "Pandan Picture Frame",
    description: "Handwoven pandan leaf picture frame with tribal patterns. Natural green tones and texture. Accommodates 4x6 or 5x7 photos. Brings natural warmth to displayed memories.",
    shortDescription: "Handwoven pandan frame with tribal patterns",
    category: "home",
    price: 849.00,
    stock: 10,
    images: ["/home7.png", "/home7.7.png"],
    artistName: "TRIBAL",
    materials: ["Pandan Leaves", "Rattan"],
    tags: ["frame", "picture", "woven", "tribal", "natural"],
  },
  {
    name: "Hand-Painted Cushion Cover",
    description: "Premium hand-painted cushion cover featuring unique artistic designs. Made from durable fabric with colorfast paints. Zipper closure for easy washing. Cushion insert not included.",
    shortDescription: "Hand-painted artistic cushion cover",
    category: "home",
    price: 1499.00,
    stock: 7,
    images: ["/home8.png", "/home8.8.png"],
    artistName: "GAPO",
    materials: ["Canvas Fabric", "Fabric Paint"],
    tags: ["cushion", "pillow", "painted", "art", "home-decor"],
  },

  // FOOD
  {
    name: "Green Banana Chips 85g",
    description: "Crispy green banana chips, thinly sliced and perfectly fried. Made from locally grown bananas. Light, crunchy snack with natural sweetness. No artificial preservatives.",
    shortDescription: "Crispy local green banana chips",
    category: "food",
    price: 120.00,
    stock: 50,
    images: ["/food1.png", "/food1.1.png"],
    artistName: "KYLA",
    materials: ["Green Banana", "Vegetable Oil", "Salt"],
    tags: ["snack", "chips", "banana", "local", "healthy"],
  },
  {
    name: "Sabanana Sweet Original 100g",
    description: "Sweet saba banana snack, naturally dried and lightly sweetened. Chewy texture with rich banana flavor. Good source of energy and fiber. Perfect for on-the-go snacking.",
    shortDescription: "Sweet dried saba banana snack",
    category: "food",
    price: 89.00,
    stock: 45,
    images: ["/food2.png", "/food2.2.png"],
    artistName: "KYLA",
    materials: ["Saba Banana", "Sugar"],
    tags: ["snack", "dried-fruit", "banana", "sweet", "healthy"],
  },
  {
    name: "Sweet & Spicy Dilis 60g",
    description: "Addictive sweet and spicy dried anchovies (dilis). Perfectly seasoned with just the right kick. High in protein and omega-3. Great with rice or as beer match.",
    shortDescription: "Sweet and spicy dried anchovies",
    category: "food",
    price: 99.00,
    stock: 40,
    images: ["/food3.png", "/food3.3.png"],
    artistName: "KYLA",
    materials: ["Dried Anchovies", "Sugar", "Chili", "Spices"],
    tags: ["snack", "seafood", "spicy", "protein", "savory"],
  },
  {
    name: "Camote Chips Kimchi Flavor 60g",
    description: "Innovative camote (sweet potato) chips with tangy kimchi seasoning. Crispy, flavorful, and unique. Made from locally grown sweet potatoes. Perfect fusion of Filipino and Korean flavors.",
    shortDescription: "Sweet potato chips with kimchi seasoning",
    category: "food",
    price: 99.00,
    stock: 35,
    images: ["/food4.png", "/food4.4.png"],
    artistName: "KYLA",
    materials: ["Sweet Potato", "Kimchi Seasoning", "Vegetable Oil"],
    tags: ["snack", "chips", "sweet-potato", "kimchi", "fusion"],
  },
  {
    name: "KangKong Chips Cheese 60gs",
    description: "Innovative and healthy kangkong (water spinach) chips with savory cheese flavor. Crispy vegetable snack that's guilt-free. Rich in vitamins and minerals.",
    shortDescription: "Crispy kangkong chips with cheese",
    category: "food",
    price: 149.00,
    stock: 30,
    images: ["/food5.png", "/food5.5.png"],
    artistName: "ALJHUN",
    materials: ["Kangkong", "Cheese Powder", "Vegetable Oil"],
    tags: ["snack", "chips", "vegetable", "cheese", "healthy"],
  },
  {
    name: "Pure Benguet Honey",
    description: "100% pure, raw honey harvested from the mountains of Benguet. Rich, golden color with natural floral notes. Unprocessed and unpasteurized to preserve natural enzymes and nutrients.",
    shortDescription: "Pure raw honey from Benguet mountains",
    category: "food",
    price: 369.00,
    stock: 25,
    images: ["/food6.png", "/food6.6.png"],
    artistName: "ALJHUN",
    materials: ["Pure Honey"],
    tags: ["honey", "natural", "organic", "benguet", "raw"],
    isFeatured: true,
  },
  {
    name: "Cebu Dried Mangoes 200g",
    description: "Premium quality dried mangoes from Cebu, world-renowned for its sweet mangoes. Soft, chewy texture bursting with tropical flavor. No added sugar or preservatives needed.",
    shortDescription: "Premium Cebu dried mangoes",
    category: "food",
    price: 319.00,
    stock: 60,
    images: ["/food7.png", "/food7.7.png"],
    artistName: "ALJHUN",
    materials: ["Philippine Mango"],
    tags: ["dried-fruit", "mango", "cebu", "snack", "premium"],
    isFeatured: true,
  },
  {
    name: "Native Chocolate with Cacao",
    description: "Traditional Filipino tablea (chocolate tablets) made from pure cacao. Perfect for making hot chocolate or champorado. Rich, authentic chocolate flavor with slight bitterness.",
    shortDescription: "Traditional cacao chocolate tablets",
    category: "food",
    price: 99.00,
    stock: 40,
    images: ["/food8.png", "/food8.8.png"],
    artistName: "ALJHUN",
    materials: ["Cacao", "Sugar"],
    tags: ["chocolate", "cacao", "tablea", "traditional", "hot-chocolate"],
  },

  // BEAUTY & WELLNESS
  {
    name: "Eucalyptus Massage Oil 230ml",
    description: "Natural eucalyptus massage oil with therapeutic properties. Helps relieve muscle tension and promotes relaxation. Made from organic oils with refreshing eucalyptus scent.",
    shortDescription: "Therapeutic eucalyptus massage oil",
    category: "beauty",
    price: 699.00,
    stock: 20,
    images: ["/beauty1.png", "/beauty1.1.png"],
    artistName: "ATIN",
    materials: ["Coconut Oil", "Eucalyptus Essential Oil"],
    tags: ["massage", "oil", "wellness", "natural", "therapeutic"],
  },
  {
    name: "Nourishing Hari Oil 60ml",
    description: "Premium hair oil blend with natural ingredients. Nourishes scalp, strengthens hair, and adds shine. Non-greasy formula suitable for all hair types. Made from locally sourced oils.",
    shortDescription: "Nourishing natural hair oil blend",
    category: "beauty",
    price: 379.75,
    stock: 25,
    images: ["/beauty2.png", "/beauty2.2.png"],
    artistName: "SIBOL",
    materials: ["Coconut Oil", "Argan Oil", "Essential Oils"],
    tags: ["hair-oil", "beauty", "natural", "haircare", "nourishing"],
  },
  {
    name: "Organic Deodorant",
    description: "All-natural organic deodorant free from harmful chemicals. Aluminum-free formula with natural odor control. Gentle on sensitive skin. Fresh, subtle scent from essential oils.",
    shortDescription: "All-natural aluminum-free deodorant",
    category: "beauty",
    price: 229.00,
    stock: 30,
    images: ["/beauty3.png", "/beauty3.3.png"],
    artistName: "JABON",
    materials: ["Coconut Oil", "Beeswax", "Essential Oils", "Baking Soda"],
    tags: ["deodorant", "organic", "natural", "aluminum-free", "wellness"],
  },
  {
    name: "Sanitizer",
    description: "Natural hand sanitizer with moisturizing properties. 70% alcohol content for effective germ protection. Infused with aloe vera and essential oils. Non-drying formula.",
    shortDescription: "Natural moisturizing hand sanitizer",
    category: "beauty",
    price: 249.00,
    stock: 50,
    images: ["/beauty4.png", "/beauty4.4.png"],
    artistName: "SHEPARD",
    materials: ["Ethyl Alcohol", "Aloe Vera", "Essential Oils"],
    tags: ["sanitizer", "hygiene", "natural", "moisturizing", "protection"],
  },
  {
    name: "Skin Care Soap",
    description: "Handmade natural soap bar for gentle skincare. Made with organic ingredients and essential oils. Suitable for face and body. Helps maintain skin's natural moisture balance.",
    shortDescription: "Handmade natural skincare soap",
    category: "beauty",
    price: 259.00,
    stock: 35,
    images: ["/beauty5.png", "/beauty5.5.png"],
    artistName: "AYO",
    materials: ["Coconut Oil", "Olive Oil", "Shea Butter", "Essential Oils"],
    tags: ["soap", "skincare", "natural", "handmade", "organic"],
  },
  {
    name: "Liquid Conditioner",
    description: "Natural liquid conditioner enriched with botanical extracts. Detangles, softens, and adds shine to hair. Paraben-free and silicone-free formula. Pleasant natural fragrance.",
    shortDescription: "Natural botanical liquid conditioner",
    category: "beauty",
    price: 429.00,
    stock: 22,
    images: ["/beauty6.png", "/beauty6.6.png"],
    artistName: "LEYLA",
    materials: ["Botanical Extracts", "Coconut Oil", "Essential Oils"],
    tags: ["conditioner", "haircare", "natural", "botanical", "paraben-free"],
  },
  {
    name: "Botanical Sanitizer",
    description: "Premium botanical hand sanitizer with plant-based ingredients. Effective antimicrobial protection with skin-nourishing botanicals. Luxurious texture and natural scent.",
    shortDescription: "Premium plant-based hand sanitizer",
    category: "beauty",
    price: 899.00,
    stock: 18,
    images: ["/beauty7.png", "/beauty7.7.png"],
    artistName: "NATURALE",
    materials: ["Ethyl Alcohol", "Botanical Extracts", "Aloe Vera"],
    tags: ["sanitizer", "botanical", "premium", "natural", "skincare"],
  },
  {
    name: "Anti-Dandruff Shampoo Bar 75g",
    description: "Solid shampoo bar specifically formulated to combat dandruff. Contains tea tree oil and other natural anti-fungal ingredients. Eco-friendly alternative to liquid shampoos. Long-lasting bar.",
    shortDescription: "Natural anti-dandruff solid shampoo bar",
    category: "beauty",
    price: 229.00,
    stock: 28,
    images: ["/beauty8.png", "/beauty8.8.png"],
    artistName: "SIBOL",
    materials: ["Coconut Oil", "Tea Tree Oil", "Neem Oil"],
    tags: ["shampoo", "bar", "anti-dandruff", "natural", "eco-friendly"],
  },
];

async function seedProducts() {
  try {
    console.log('🌱 Connecting to database...');
    await connectDB();
    
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});
    
    console.log('📦 Seeding products...');
    
    const productsWithIds = products.map((product, index) => ({
      ...product,
      artistId: DUMMY_ARTIST_ID,
      thumbnailUrl: product.images[0],
      currency: 'PHP',
      isActive: true,
      isAvailable: true,
      // Generate SKU manually since insertMany doesn't trigger pre-save middleware
      sku: `${product.category.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}${index.toString().padStart(3, '0')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
    }));
    
    // Use insertMany for bulk insert (faster but skips validation middleware)
    const createdProducts = await Product.insertMany(productsWithIds, { ordered: false });
    
    console.log(`✅ Successfully seeded ${createdProducts.length} products!`);
    console.log('\n📊 Summary by category:');
    
    const categories = ['handicrafts', 'fashion', 'home', 'food', 'beauty'];
    for (const category of categories) {
      const count = createdProducts.filter(p => p.category === category).length;
      console.log(`   ${category.toUpperCase()}: ${count} products`);
    }
    
    console.log('\n🎯 Featured products:', createdProducts.filter(p => p.isFeatured).length);
    console.log('\n💡 Note: All products use a dummy artist ID. Update with real user IDs from your database.');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seed function
seedProducts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
