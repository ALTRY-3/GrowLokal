import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import EventBooking from "@/models/EventBooking";

export async function PATCH(
  request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId } = params;

    const body = await request.json();
    const { participants, message } = body ?? {};

    if (participants !== undefined && participants < 1) {
      return NextResponse.json(
        { success: false, message: "Participants must be at least 1" },
        { status: 400 }
      );
    }

    await connectDB();

    const booking = await EventBooking.findOne({
      _id: bookingId,
      userId: session.user.id,
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (participants !== undefined) {
      booking.participants = participants;
    }

    if (message !== undefined) {
      booking.message = message;
    }

    await booking.save();

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId } = params;

    await connectDB();

    const booking = await EventBooking.findOneAndDelete({
      _id: bookingId,
      userId: session.user.id,
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking deletion error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to cancel booking" },
      { status: 500 }
    );
  }
}
