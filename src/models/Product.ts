import mongoose, { Schema, Document, Model } from 'mongoose';

// Product Interface
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  shortDescription?: string;
  category: 'handicrafts' | 'fashion' | 'home' | 'food' | 'beauty';
  subcategory?: string;
  
  // Pricing
  price: number;
  currency: string;
  originalPrice?: number; // For displaying discounts
  
  // Inventory
  stock: number;
  sku: string;
  isAvailable: boolean;
  
  // Media
  images: string[];
  thumbnailUrl: string;
  
  // Artist/Seller Info
  artistId: mongoose.Types.ObjectId;
  artistName: string;
  artistStory?: string;
  
  // Product Details
  materials?: string[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'cm' | 'in';
  };
  weight?: {
    value: number;
    unit: 'g' | 'kg' | 'oz' | 'lb';
  };
  
  // SEO & Search
  tags: string[];
  searchKeywords: string[];
  
  // Reviews & Ratings
  averageRating: number;
  totalReviews: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
}

// Product Schema
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['handicrafts', 'fashion', 'home', 'food', 'beauty'],
        message: '{VALUE} is not a valid category',
      },
      lowercase: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    
    // Pricing
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'PHP',
      uppercase: true,
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    
    // Inventory
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    
    // Media
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0;
        },
        message: 'Product must have at least one image',
      },
    },
    thumbnailUrl: {
      type: String,
      required: [true, 'Thumbnail URL is required'],
    },
    
    // Artist/Seller Info
    artistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Artist/Seller ID is required'],
    },
    artistName: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
    },
    artistStory: {
      type: String,
      maxlength: [2000, 'Artist story cannot exceed 2000 characters'],
    },
    
    // Product Details
    materials: {
      type: [String],
      default: [],
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: ['cm', 'in'],
        default: 'cm',
      },
    },
    weight: {
      value: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: ['g', 'kg', 'oz', 'lb'],
        default: 'g',
      },
    },
    
    // SEO & Search
    tags: {
      type: [String],
      default: [],
    },
    searchKeywords: {
      type: [String],
      default: [],
    },
    
    // Reviews & Ratings
    averageRating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0,
    },
    totalReviews: {
      type: Number,
      min: [0, 'Total reviews cannot be negative'],
      default: 0,
    },
    
    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      min: [0, 'View count cannot be negative'],
      default: 0,
    },
    
    // Additional fields for enhanced search
    craftType: {
      type: String,
      trim: true,
      index: true,
    },
    barangay: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes for better query performance
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ artistId: 1, isActive: 1 });
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text',
  artistName: 'text',
  searchKeywords: 'text',
}, {
  weights: {
    name: 10,          // Highest priority
    tags: 5,           // High priority
    artistName: 3,     // Medium priority
    searchKeywords: 2, // Lower priority
    description: 1,    // Lowest priority
  },
  name: 'product_text_search'
});
ProductSchema.index({ price: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ sku: 1 }, { unique: true });
// Additional indexes for enhanced search
ProductSchema.index({ craftType: 1, isActive: 1 });
ProductSchema.index({ barangay: 1, isActive: 1 });
ProductSchema.index({ isActive: 1, isFeatured: -1, averageRating: -1 });
ProductSchema.index({ 'tags': 1 });

// Virtual for display price (formatted)
ProductSchema.virtual('displayPrice').get(function() {
  return `₱${this.price.toFixed(2)}`;
});

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Method to check if product is in stock
ProductSchema.methods.isInStock = function(): boolean {
  return this.isAvailable && this.stock > 0;
};

// Method to decrement stock
ProductSchema.methods.decrementStock = async function(quantity: number): Promise<boolean> {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    if (this.stock === 0) {
      this.isAvailable = false;
    }
    await this.save();
    return true;
  }
  return false;
};

// Method to increment stock
ProductSchema.methods.incrementStock = async function(quantity: number): Promise<void> {
  this.stock += quantity;
  this.isAvailable = true;
  await this.save();
};

// Method to update rating
ProductSchema.methods.updateRating = async function(newRating: number): Promise<void> {
  const totalRating = this.averageRating * this.totalReviews + newRating;
  this.totalReviews += 1;
  this.averageRating = totalRating / this.totalReviews;
  await this.save();
};

// Static method to find products by category
ProductSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true, isAvailable: true }).sort({ createdAt: -1 });
};

// Static method to search products
ProductSchema.statics.searchProducts = function(query: string) {
  return this.find(
    { 
      $text: { $search: query },
      isActive: true 
    },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

// Pre-save middleware to generate SKU if not provided
ProductSchema.pre('save', async function(next) {
  if (!this.sku) {
    // Generate SKU: CATEGORY-TIMESTAMP-RANDOM
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.sku = `${categoryCode}-${timestamp}-${random}`;
  }
  
  // Set thumbnailUrl to first image if not provided
  if (!this.thumbnailUrl && this.images.length > 0) {
    this.thumbnailUrl = this.images[0];
  }
  
  // Generate search keywords from name, category, and tags
  const keywords = [
    ...this.name.toLowerCase().split(' '),
    this.category,
    this.artistName.toLowerCase(),
    ...this.tags.map(tag => tag.toLowerCase()),
  ];
  this.searchKeywords = [...new Set(keywords)]; // Remove duplicates
  
  next();
});

// Prevent model recompilation in Next.js hot reload
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
