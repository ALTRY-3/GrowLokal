import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import EventBooking from "@/models/EventBooking";
import { events } from "@/data/events";
import { sendEventBookingEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const bookings = await EventBooking.find({ userId: session.user.id })
      .sort({ eventDate: 1 })
      .lean();

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, userName, userEmail, participants, message } = body;

    if (!eventId || !userName || !userEmail || !participants) {
      return NextResponse.json(
        { success: false, message: "Missing required booking details" },
        { status: 400 }
      );
    }

    if (participants < 1) {
      return NextResponse.json(
        { success: false, message: "Participants must be at least 1" },
        { status: 400 }
      );
    }

    const eventDetails = events.find((evt) => evt.id === eventId);

    if (!eventDetails) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    await connectDB();

    const existingBooking = await EventBooking.findOne({
      userId: session.user.id,
      eventId,
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, message: "You already booked this event" },
        { status: 409 }
      );
    }

    const booking = await EventBooking.create({
      userId: session.user.id,
      eventId,
      eventTitle: eventDetails.title,
      eventDate: new Date(eventDetails.date),
      eventDateText: eventDetails.dateText,
      eventTime: eventDetails.time,
      eventLocation: eventDetails.location,
      eventType: eventDetails.type,
      organizer: eventDetails.organizer,
      featuredArtisan: eventDetails.featuredArtisan,
      contactName: userName,
      contactEmail: userEmail,
      participants,
      message,
      bookedAt: new Date(),
    });

    try {
      const recipientId = (session.user.id as string) || session.user.email;
      if (recipientId) {
        await createNotification({
          userId: recipientId,
          type: "event",
          title: "Event booking confirmed",
          description: `You are booked for ${booking.eventTitle} on ${booking.eventDateText}.`,
          metadata: {
            bookingId: booking._id?.toString(),
            eventId: booking.eventId,
            eventDate: booking.eventDateText,
          },
        });
      }
    } catch (notificationError) {
      console.error("Event booking notification error:", notificationError);
    }

    try {
      await sendEventBookingEmail({
        email: userEmail,
        eventTitle: eventDetails.title,
        eventDateText: eventDetails.dateText,
        eventTime: eventDetails.time,
        eventLocation: eventDetails.location,
        eventType: eventDetails.type,
        organizer: eventDetails.organizer,
        participants,
        message,
      });
    } catch (emailError) {
      console.error("Event booking email failed:", emailError);
    }

    return NextResponse.json(
      { success: true, data: booking },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create booking" },
      { status: 500 }
    );
  }
}
