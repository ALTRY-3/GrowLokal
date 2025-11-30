import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductReview extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductReviewSchema = new Schema<IProductReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per product
ProductReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const ProductReview: Model<IProductReview> =
  mongoose.models.ProductReview ||
  mongoose.model<IProductReview>("ProductReview", ProductReviewSchema);

export default ProductReview;
