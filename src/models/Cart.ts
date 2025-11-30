import mongoose, { Schema, Document, Model } from 'mongoose';

// Cart Item Interface
export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  artistName: string;
  maxStock: number; // Available stock at time of adding
}

// Cart Document Interface (instance methods)
export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | string; // Can be user ID or session ID for guest carts
  items: ICartItem[];
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // Auto-delete old carts
  
  // Instance methods
  calculateSubtotal(): number;
  addItem(
    productId: string,
    name: string,
    price: number,
    image: string,
    artistName: string,
    maxStock: number,
    quantity?: number
  ): Promise<void>;
  updateItemQuantity(productId: string, quantity: number): Promise<void>;
  removeItem(productId: string): Promise<void>;
  clearCart(): Promise<void>;
  isEmpty(): boolean;
}

// Cart Model Interface (static methods)
export interface ICartModel extends Model<ICart> {
  findOrCreateCart(userId: string): Promise<ICart>;
  mergeGuestCart(guestUserId: string, loggedInUserId: string): Promise<ICart>;
}

// Cart Item Schema
const CartItemSchema = new Schema<ICartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    artistName: {
      type: String,
      required: [true, 'Artist name is required'],
    },
    maxStock: {
      type: Number,
      required: [true, 'Max stock is required'],
      min: [0, 'Max stock cannot be negative'],
    },
  },
  { _id: false } // Don't create _id for subdocuments
);

// Cart Schema
const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: String, // Can be ObjectId string or session ID
      required: [true, 'User ID or Session ID is required'],
    },
    items: {
      type: [CartItemSchema],
      default: [],
      validate: {
        validator: function(items: ICartItem[]) {
          // Validate no duplicate products
          const productIds = items.map(item => item.productId.toString());
          return productIds.length === new Set(productIds).size;
        },
        message: 'Duplicate products in cart are not allowed',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
CartSchema.index({ userId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Virtual for total item count
CartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate subtotal
CartSchema.methods.calculateSubtotal = function(): number {
  this.subtotal = this.items.reduce((total: number, item: ICartItem) => {
    return total + (item.price * item.quantity);
  }, 0);
  return this.subtotal;
};

// Method to add item to cart
CartSchema.methods.addItem = async function(
  productId: string,
  name: string,
  price: number,
  image: string,
  artistName: string,
  maxStock: number,
  quantity: number = 1
): Promise<void> {
  // Check if item already exists
  const existingItemIndex = this.items.findIndex(
    (item: ICartItem) => item.productId.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    const newQuantity = this.items[existingItemIndex].quantity + quantity;
    
    // Check stock limit
    if (newQuantity > maxStock) {
      throw new Error(`Cannot add more than ${maxStock} items (only ${maxStock} in stock)`);
    }
    
    this.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    if (quantity > maxStock) {
      throw new Error(`Cannot add more than ${maxStock} items (only ${maxStock} in stock)`);
    }
    
    this.items.push({
      productId: new mongoose.Types.ObjectId(productId),
      name,
      price,
      quantity,
      image,
      artistName,
      maxStock,
    });
  }

  this.calculateSubtotal();
  await this.save();
};

// Method to update item quantity
CartSchema.methods.updateItemQuantity = async function(
  productId: string,
  quantity: number
): Promise<void> {
  const itemIndex = this.items.findIndex(
    (item: ICartItem) => item.productId.toString() === productId
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    // Check stock limit
    const item = this.items[itemIndex];
    if (quantity > item.maxStock) {
      throw new Error(`Cannot add more than ${item.maxStock} items (only ${item.maxStock} in stock)`);
    }
    
    this.items[itemIndex].quantity = quantity;
  }

  this.calculateSubtotal();
  await this.save();
};

// Method to remove item from cart
CartSchema.methods.removeItem = async function(productId: string): Promise<void> {
  const itemIndex = this.items.findIndex(
    (item: ICartItem) => item.productId.toString() === productId
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  this.items.splice(itemIndex, 1);
  this.calculateSubtotal();
  await this.save();
};

// Method to clear cart
CartSchema.methods.clearCart = async function(): Promise<void> {
  this.items = [];
  this.subtotal = 0;
  await this.save();
};

// Method to check if cart is empty
CartSchema.methods.isEmpty = function(): boolean {
  return this.items.length === 0;
};

// Static method to find or create cart for user
CartSchema.statics.findOrCreateCart = async function(userId: string): Promise<ICart> {
  let cart = await this.findOne({ userId });
  
  if (!cart) {
    cart = await this.create({
      userId,
      items: [],
      subtotal: 0,
    });
  }
  
  return cart;
};

// Static method to merge guest cart with user cart
CartSchema.statics.mergeGuestCart = async function(
  guestUserId: string,
  loggedInUserId: string
): Promise<ICart> {
  const guestCart = await this.findOne({ userId: guestUserId });
  const userCart = await (this as any).findOrCreateCart(loggedInUserId);

  if (guestCart && guestCart.items.length > 0) {
    // Merge items from guest cart
    for (const item of guestCart.items) {
      try {
        await userCart.addItem(
          item.productId.toString(),
          item.name,
          item.price,
          item.image,
          item.artistName,
          item.maxStock,
          item.quantity
        );
      } catch (error) {
        // If adding fails (e.g., stock limit), skip this item
        console.error(`Failed to merge item ${item.name}:`, error);
      }
    }

    // Delete guest cart after merging
    await this.deleteOne({ userId: guestUserId });
  }

  return userCart;
};

// Pre-save middleware to calculate subtotal
CartSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.calculateSubtotal();
  }
  next();
});

// Prevent model recompilation in Next.js hot reload
const Cart = (mongoose.models.Cart as ICartModel) || mongoose.model<ICart, ICartModel>('Cart', CartSchema);

export default Cart;
