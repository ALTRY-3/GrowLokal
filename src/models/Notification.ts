import mongoose, { Schema, Model, Document } from "mongoose";
import type { NotificationType, NotificationMetadata } from "@/types/notifications";

export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  metadata?: NotificationMetadata;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["order", "event", "activity"],
      default: "activity",
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
