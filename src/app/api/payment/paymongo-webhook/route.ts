import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || "";

function verifySignature(rawBody: string, signatureHeader: string | null) {
  if (!PAYMONGO_WEBHOOK_SECRET || !signatureHeader) {
    return true; // Skip verification when secret is not configured
  }

  try {
    const segments = signatureHeader.split(",");
    const signatureMap = Object.fromEntries(
      segments.map((segment) => {
        const [key, value] = segment.split("=");
        return [key, value];
      })
    );
    const expectedHash = crypto
      .createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return signatureMap["v1"] === expectedHash;
  } catch (error) {
    console.error("PayMongo webhook signature verification failed:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("paymongo-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { success: false, message: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    console.error("Invalid PayMongo webhook payload:", error);
    return NextResponse.json(
      { success: false, message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const eventType = event?.data?.attributes?.type;
  const resource = event?.data?.attributes?.data;
  const paymentId = resource?.id;

  if (!eventType || !paymentId) {
    return NextResponse.json(
      { success: false, message: "Missing event details" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const order = await Order.findOne({
      "paymentDetails.transactionId": paymentId,
    });

    if (!order) {
      console.warn("No order found for PayMongo payment", paymentId);
      return NextResponse.json({ success: true, message: "No matching order" });
    }

    if (eventType === "payment.paid") {
      await order.markAsPaid(paymentId);
      return NextResponse.json({ success: true });
    }

    if (eventType === "payment.failed") {
      order.paymentDetails.status = "failed";
      await order.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error) {
    console.error("PayMongo webhook processing error:", error);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 }
    );
  }
}
