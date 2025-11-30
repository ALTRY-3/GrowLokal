import { NextResponse } from "next/server";
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

export async function GET() {
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

    const unreadCount = await Notification.countDocuments({
      userId: { $in: identifiers },
      read: false,
    });

    return NextResponse.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Unread count fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get unread count" },
      { status: 500 }
    );
  }
}
