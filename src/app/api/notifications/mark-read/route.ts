import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

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

// Mark a single notification as read
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { notificationId } = body as { notificationId?: string };

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: { $in: identifiers },
      },
      { read: true },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

// Mark all notifications as read
export async function POST() {
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

    await Notification.updateMany(
      {
        userId: { $in: identifiers },
        read: false,
      },
      { read: true }
    );

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
