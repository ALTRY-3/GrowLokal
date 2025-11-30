import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IEventBooking extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: number;
  eventTitle: string;
  eventDate: Date;
  eventDateText: string;
  eventTime: string;
  eventLocation: string;
  eventType: string;
  organizer?: string;
  featuredArtisan?: string;
  contactName: string;
  contactEmail: string;
  participants: number;
  message?: string;
  bookedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EventBookingSchema = new Schema<IEventBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: Number,
      required: true,
    },
    eventTitle: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventDateText: {
      type: String,
      required: true,
      trim: true,
    },
    eventTime: {
      type: String,
      required: true,
      trim: true,
    },
    eventLocation: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    organizer: {
      type: String,
      trim: true,
    },
    featuredArtisan: {
      type: String,
      trim: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    participants: {
      type: Number,
      required: true,
      min: 1,
    },
    message: {
      type: String,
      trim: true,
    },
    bookedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

EventBookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });
EventBookingSchema.index({ eventDate: 1 });

const EventBooking: Model<IEventBooking> =
  mongoose.models.EventBooking ||
  mongoose.model<IEventBooking>("EventBooking", EventBookingSchema);

export default EventBooking;
