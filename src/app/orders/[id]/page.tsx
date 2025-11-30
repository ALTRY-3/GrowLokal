"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./order-details.css";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  artistName: string;
}

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentDetails: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
  };
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder(data.data);
      } else {
        throw new Error(data.message || 'Failed to load order');
      }
    } catch (err: any) {
      console.error('Fetch order error:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#ffc107',
      processing: '#007bff',
      shipped: '#17a2b8',
      delivered: '#28a745',
      cancelled: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#ffc107',
      paid: '#28a745',
      failed: '#dc3545',
      refunded: '#6c757d',
    };
    return colors[status] || '#6c757d';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="order-details-page">
          <div className="order-container">
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading order...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <main className="order-details-page">
          <div className="order-container">
            <div className="error-state">
              <i className="fas fa-exclamation-circle"></i>
              <h2>Order Not Found</h2>
              <p>{error || 'The order you are looking for does not exist.'}</p>
              <button onClick={() => router.push('/marketplace')}>
                Back to Marketplace
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="order-details-page">
        <div className="order-container">
          <div className="order-header">
            <div>
              <h1>Order Details</h1>
              <p className="order-id">Order ID: {order.orderId}</p>
              <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="order-status-badges">
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {order.status.toUpperCase()}
              </span>
              <span 
                className="status-badge"
                style={{ backgroundColor: getPaymentStatusColor(order.paymentDetails.status) }}
              >
                {order.paymentDetails.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="order-content">
            {/* Order Items */}
            <section className="order-section">
              <h2>Order Items</h2>
              <div className="order-items-list">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <img src={item.image} alt={item.name} />
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      <p className="item-artist">by {item.artistName}</p>
                      <p className="item-quantity">Quantity: {item.quantity}</p>
                    </div>
                    <p className="item-price">₱{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Order Summary */}
            <section className="order-section">
              <h2>Order Summary</h2>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₱{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping Fee</span>
                  <span>{order.shippingFee === 0 ? 'FREE' : `₱${order.shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₱{order.total.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="order-section">
              <h2>Shipping Address</h2>
              <div className="address-details">
                <p><strong>{order.shippingAddress.fullName}</strong></p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                <p>Email: {order.shippingAddress.email}</p>
                <p>Phone: {order.shippingAddress.phone}</p>
              </div>
            </section>

            {/* Payment Details */}
            <section className="order-section">
              <h2>Payment Information</h2>
              <div className="payment-details">
                <div className="detail-row">
                  <span>Payment Method</span>
                  <span className="method-badge">{order.paymentDetails.method.toUpperCase()}</span>
                </div>
                <div className="detail-row">
                  <span>Payment Status</span>
                  <span 
                    className="status-badge small"
                    style={{ backgroundColor: getPaymentStatusColor(order.paymentDetails.status) }}
                  >
                    {order.paymentDetails.status.toUpperCase()}
                  </span>
                </div>
                {order.paymentDetails.transactionId && (
                  <div className="detail-row">
                    <span>Transaction ID</span>
                    <span className="transaction-id">{order.paymentDetails.transactionId}</span>
                  </div>
                )}
                {order.paymentDetails.paidAt && (
                  <div className="detail-row">
                    <span>Paid At</span>
                    <span>{formatDate(order.paymentDetails.paidAt)}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Tracking */}
            {order.trackingNumber && (
              <section className="order-section">
                <h2>Tracking Information</h2>
                <div className="tracking-details">
                  <p><strong>Tracking Number:</strong> {order.trackingNumber}</p>
                </div>
              </section>
            )}
          </div>

          <div className="order-actions">
            <button onClick={() => router.push('/marketplace')} className="btn-secondary">
              Continue Shopping
            </button>
            {order.status === 'pending' && (
              <button className="btn-danger">
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
