import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { events } from "@/data/events";

// Type for event subscription
interface EventSubscription {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  subscribedAt: string;
}

// GET - Fetch user's event subscriptions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get subscriptions from user document or return empty array
    const subscriptions = (user as Record<string, unknown>).eventSubscriptions || [];

    return NextResponse.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("Event subscriptions fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// POST - Subscribe to an event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, eventTitle, eventDate } = body as {
      eventId?: number;
      eventTitle?: string;
      eventDate?: string;
    };

    if (!eventId || !eventTitle || !eventDate) {
      return NextResponse.json(
        { success: false, message: "Event ID, title, and date are required" },
        { status: 400 }
      );
    }

    // Validate event exists
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event is in the past
    const eventDateTime = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDateTime < today) {
      return NextResponse.json(
        { success: false, message: "Cannot subscribe to past events" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = session.user.id || session.user.email;

    // Add subscription to user (using $addToSet to prevent duplicates)
    const subscription: EventSubscription = {
      eventId,
      eventTitle,
      eventDate,
      subscribedAt: new Date().toISOString(),
    };

    await User.updateOne(
      { email: session.user.email },
      {
        $addToSet: {
          eventSubscriptions: subscription,
        },
      }
    );

    // Create a notification for the subscription
    await createNotification({
      userId,
      type: "event",
      title: "Event Subscription Confirmed",
      description: `You've subscribed to "${eventTitle}". We'll notify you before the event!`,
      metadata: {
        eventId,
        eventTitle,
        eventDate,
        action: "subscribed",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Subscribed to ${eventTitle}`,
      data: subscription,
    });
  } catch (error) {
    console.error("Event subscription error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to subscribe to event" },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from an event
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = session.user.id || session.user.email;
    const eventIdNum = parseInt(eventId, 10);

    // Find the event to get its title for the notification
    const event = events.find((e) => e.id === eventIdNum);

    // Remove subscription from user
    await User.updateOne(
      { email: session.user.email },
      {
        $pull: {
          eventSubscriptions: { eventId: eventIdNum },
        },
      }
    );

    // Create a notification for the unsubscription
    await createNotification({
      userId,
      type: "event",
      title: "Event Subscription Cancelled",
      description: `You've unsubscribed from "${event?.title || "the event"}". You won't receive updates about this event.`,
      metadata: {
        eventId: eventIdNum,
        eventTitle: event?.title || "Unknown Event",
        action: "unsubscribed",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Unsubscribed from event",
    });
  } catch (error) {
    console.error("Event unsubscription error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to unsubscribe from event" },
      { status: 500 }
    );
  }
}
