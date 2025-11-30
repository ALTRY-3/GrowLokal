import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import type {
  NotificationDTO,
  NotificationMetadata,
  NotificationType,
} from "@/types/notifications";

export type CreateNotificationPayload = {
  userId: string;
  type?: NotificationType;
  title: string;
  description: string;
  metadata?: NotificationMetadata;
};

export const createNotification = async (
  payload: CreateNotificationPayload
): Promise<NotificationDTO> => {
  await connectDB();

  const safePayload = {
    ...payload,
    type: payload.type ?? "activity",
  };

  const notification = await Notification.create(safePayload);
  const plain = notification.toObject();

  return {
    _id: String(plain._id),
    userId: plain.userId,
    type: plain.type,
    title: plain.title,
    description: plain.description,
    metadata: plain.metadata ?? undefined,
    read: plain.read,
    createdAt: plain.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: plain.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
};
