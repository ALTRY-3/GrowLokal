import mongoose from 'mongoose';

export interface IRateLimit extends mongoose.Document {
  key: string; // IP address or email or IP+email combo
  endpoint: string; // login, signup, forgot-password
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const RateLimitSchema = new mongoose.Schema<IRateLimit>(
  {
    key: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      enum: ['login', 'signup', 'forgot-password', 'register'],
      index: true,
    },
    attempts: {
      type: Number,
      required: true,
      default: 1,
    },
    firstAttempt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastAttempt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
RateLimitSchema.index({ key: 1, endpoint: 1 });

// TTL index to auto-delete old records after 24 hours
RateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const RateLimit = mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);

export default RateLimit;
