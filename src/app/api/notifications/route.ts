import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { createNotification } from "@/lib/notifications";
import type {
  NotificationDTO,
  NotificationMetadata,
  NotificationType,
} from "@/types/notifications";

type NotificationDocumentLike = {
  _id: string | { toString(): string };
  userId: string;
  type: NotificationDTO["type"];
  title: string;
  description: string;
  metadata?: NotificationDTO["metadata"];
  read: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const buildUserIdentifiers = (session: Session | null | undefined) => {
  const identifiers = new Set<string>();
  const email = session?.user?.email;
  const userId = session?.user?.id as string | undefined;

  if (userId) {
    identifiers.add(userId);
  }

  if (email) {
    identifiers.add(email);
    identifiers.add(email.toLowerCase());
  }

  return Array.from(identifiers).filter(Boolean);
};

const mapNotification = (doc: NotificationDocumentLike): NotificationDTO => ({
  _id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
  userId: doc.userId,
  type: doc.type,
  title: doc.title,
  description: doc.description,
  metadata: doc.metadata ?? undefined,
  read: doc.read,
  createdAt: new Date(doc.createdAt).toISOString(),
  updatedAt: new Date(doc.updatedAt).toISOString(),
});

const sanitizeMetadata = (
  input?: Record<string, unknown>
): NotificationMetadata | undefined => {
  if (!input) {
    return undefined;
  }

  return Object.entries(input).reduce<NotificationMetadata>((acc, [key, value]) => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      typeof value === "undefined"
    ) {
      acc[key] = value;
      return acc;
    }

    acc[key] = JSON.stringify(value);
    return acc;
  }, {});
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const identifiers = buildUserIdentifiers(session);
    if (!identifiers.length) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab");
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") || "20", 10), 1),
      100
    );

    const query: Record<string, unknown> = {
      userId: { $in: identifiers },
    };

    if (tab === "orders") {
      query.type = "order" satisfies NotificationType;
    } else if (tab === "activities") {
      query.type = { $ne: "order" };
    }

    const docs = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: docs.map(mapNotification),
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const identifier = (session.user.id as string | undefined) || session.user.email;
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, title, description, metadata } = body as {
      type?: NotificationType;
      title?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    };

    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: "Title and description are required" },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      userId: identifier,
      type,
      title,
      description,
      metadata: sanitizeMetadata(metadata),
    });

    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    );
  } catch (error) {
    console.error("Notification create error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create notification" },
      { status: 500 }
    );
  }
}
