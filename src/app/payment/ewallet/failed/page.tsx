"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "../status.css";

export default function PayMongoFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) return;
    const timer = setTimeout(() => router.push(`/orders/${orderId}`), 6000);
    return () => clearTimeout(timer);
  }, [orderId, router]);

  return (
    <>
      <Navbar />
      <main className="payment-status-wrapper">
        <div className="payment-status-card error">
          <div className="payment-status-icon">⚠️</div>
          <h1>Payment Was Not Completed</h1>
          <p>
            It looks like the e-wallet payment was cancelled or failed. You can try again
            from your order details page or choose a different payment method.
          </p>
          <div className="payment-status-actions">
            <button
              className="primary-btn"
              onClick={() => router.push(orderId ? `/orders/${orderId}` : "/profile?section=orders")}
            >
              Review Order
            </button>
            <button className="secondary-btn" onClick={() => router.push("/checkout")}>
              Return to Checkout
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
