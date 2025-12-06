"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "../status.css";

type StatusState = "verifying" | "success" | "error";

export default function PayMongoSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const sourceId =
    searchParams.get("id") ||
    searchParams.get("sourceId") ||
    searchParams.get("checkout_reference");
  const isMock = searchParams.get("mock") === "1";

  const [status, setStatus] = useState<StatusState>("verifying");
  const [message, setMessage] = useState("Confirming your payment with PayMongo...");
  const [shouldPoll, setShouldPoll] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setMessage("Missing order reference.");
      return;
    }

    if (isMock && orderId) {
      setStatus("success");
      setMessage("Payment confirmed! Redirecting to your order...");
      setTimeout(() => router.push(`/orders/${orderId}`), 1200);
      return;
    }

    if (!sourceId) {
      setStatus("error");
      setMessage("Missing payment reference. Please retry the payment.");
      return;
    }

    const finalizePayment = async () => {
      try {
        const response = await fetch("/api/payment/ewallet/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, sourceId }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Payment confirmation failed");
        }

        const paymentStatus: string | undefined = data.data?.paymentStatus;

        if (paymentStatus === "paid") {
          setStatus("success");
          setMessage("Payment confirmed! Redirecting to your order...");
          setTimeout(() => router.push(`/orders/${orderId}`), 2500);
          return;
        }

        if (paymentStatus === "pending" || data.data?.requiresWebhookConfirmation) {
          setStatus("verifying");
          setMessage(
            "Payment authorized. Waiting for PayMongo to finalize the charge..."
          );
          setShouldPoll(true);
          return;
        }

        throw new Error(data.message || "Unable to confirm payment status");
      } catch (err: any) {
        console.error("PayMongo confirmation error:", err);
        setStatus("error");
        setMessage(err.message || "Unable to confirm payment. Please contact support.");
      }
    };

    finalizePayment();
  }, [orderId, router, sourceId]);

  useEffect(() => {
    if (!shouldPoll || !orderId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const paymentStatus: string | undefined = data.data?.paymentDetails?.status;
        if (paymentStatus === "paid") {
          setShouldPoll(false);
          setStatus("success");
          setMessage("Payment confirmed! Redirecting to your order...");
          setTimeout(() => router.push(`/orders/${orderId}`), 2000);
        }
      } catch (error) {
        console.error("Order polling failed:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, router, shouldPoll]);

  const renderIcon = () => {
    if (status === "success") return "✅";
    if (status === "error") return "⚠️";
    return <FaSpinner className="loading-spinner" aria-hidden="true" />;
  };

  return (
    <>
      <Navbar />
      <main className="payment-status-wrapper">
        <div className={`payment-status-card ${status}`}>
          <div className="payment-status-icon">{renderIcon()}</div>
          <h1>
            {status === "success"
              ? "Payment Successful"
              : status === "error"
              ? "Payment Issue"
              : "Finalizing Payment"}
          </h1>
          <p>{message}</p>
          <div className="payment-status-actions">
            <button
              className="primary-btn"
              onClick={() => router.push(`/orders/${orderId || ""}`)}
              disabled={!orderId}
            >
              View Order
            </button>
            <button className="secondary-btn" onClick={() => router.push("/marketplace")}>
              Back to Marketplace
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
