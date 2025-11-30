export type NotificationType = "order" | "event" | "activity";

export interface NotificationMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface NotificationDTO {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  metadata?: NotificationMetadata;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
