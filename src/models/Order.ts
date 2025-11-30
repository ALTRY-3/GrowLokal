import mongoose, { Schema, Document, Model } from 'mongoose';

// Order Item Interface
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  artistName: string;
}

// Shipping Address Interface
export interface IShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

// Payment Details Interface
export interface IPaymentDetails {
  method: 'card' | 'cod' | 'gcash';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: Date;
}

// Order Document Interface
export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string; // Unique readable order ID (e.g., "ORD-20250102-001")
  userId: mongoose.Types.ObjectId | string; // User ID or guest session ID
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentDetails: IPaymentDetails;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  updateStatus(newStatus: string): Promise<void>;
  markAsPaid(transactionId: string): Promise<void>;
  cancel(): Promise<void>;
}

// Order Model Interface (static methods)
export interface IOrderModel extends Model<IOrder> {
  generateOrderId(): Promise<string>;
  findByUserId(userId: string): Promise<IOrder[]>;
}

// Order Item Schema
const OrderItemSchema = new Schema<IOrderItem>(
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
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    artistName: {
      type: String,
      required: [true, 'Artist name is required'],
    },
  },
  { _id: false }
);

// Shipping Address Schema
const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Philippines',
    },
  },
  { _id: false }
);

// Payment Details Schema
const PaymentDetailsSchema = new Schema<IPaymentDetails>(
  {
    method: {
      type: String,
      enum: ['card', 'cod', 'gcash'],
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
  },
  { _id: false }
);

// Order Schema
const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.Mixed, // Can be ObjectId or string (for guest)
      required: [true, 'User ID is required'],
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: function(items: IOrderItem[]) {
          return items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    paymentDetails: {
      type: PaymentDetailsSchema,
      required: [true, 'Payment details are required'],
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    shippingFee: {
      type: Number,
      required: [true, 'Shipping fee is required'],
      min: [0, 'Shipping fee cannot be negative'],
      default: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes for performance
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'paymentDetails.status': 1 });

// Virtual for total item count
OrderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total: number, item: IOrderItem) => total + item.quantity, 0);
});

// Instance method: Update order status
OrderSchema.methods.updateStatus = async function(newStatus: string): Promise<void> {
  this.status = newStatus;
  await this.save();
};

// Instance method: Mark as paid
OrderSchema.methods.markAsPaid = async function(transactionId: string): Promise<void> {
  this.paymentDetails.status = 'paid';
  this.paymentDetails.transactionId = transactionId;
  this.paymentDetails.paidAt = new Date();
  
  // Auto-update order status to processing if it was pending
  if (this.status === 'pending') {
    this.status = 'processing';
  }
  
  await this.save();
};

// Instance method: Cancel order
OrderSchema.methods.cancel = async function(): Promise<void> {
  if (this.status === 'delivered') {
    throw new Error('Cannot cancel delivered order');
  }
  
  this.status = 'cancelled';
  
  // If payment was made, mark for refund
  if (this.paymentDetails.status === 'paid') {
    this.paymentDetails.status = 'refunded';
  }
  
  await this.save();
};

// Static method: Generate unique order ID
OrderSchema.statics.generateOrderId = async function(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Find the count of orders created today
  const startOfDay = new Date(year, date.getMonth(), date.getDate());
  const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
  
  const todayOrderCount = await this.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });
  
  const orderNumber = String(todayOrderCount + 1).padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${orderNumber}`;
};

// Static method: Find orders by user
OrderSchema.statics.findByUserId = async function(userId: string): Promise<IOrder[]> {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Prevent model recompilation in Next.js hot reload
const Order = (mongoose.models.Order as IOrderModel) || mongoose.model<IOrder, IOrderModel>('Order', OrderSchema);

export default Order;
