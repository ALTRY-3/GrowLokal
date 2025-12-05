"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./myorders.css";

type OrderStatus =
  | "To Ship"
  | "Preparing"
  | "Shipped"
  | "Completed"
  | "Cancelled"
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
  sellerId: string;
  sellerName: string;
  itemStatus?: string;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface PaymentDetails {
  method: string;
  status: string;
  transactionId?: string;
  paidAt?: string;
}

interface Order {
  orderId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentDetails: PaymentDetails;
  status: OrderStatus;
  totalAmount: number;
  shippingFee: number;
  createdAt: string;
  trackingNumber?: string;
  buyerName: string;
  buyerEmail: string;
}

const STATUS_COLORS: Record<string, string> = {
  "To Ship": "#FFC107",
  Preparing: "#2196F3",
  Shipped: "#673AB7",
  Completed: "#4CAF50",
  Cancelled: "#F44336",
  pending: "#FFC107",
  confirmed: "#2196F3",
  processing: "#2196F3",
  shipped: "#673AB7",
  delivered: "#4CAF50",
  cancelled: "#F44336",
};

const STATUS_BG: Record<string, string> = {
  "To Ship": "#FFF8E1",
  Preparing: "#E3F2FD",
  Shipped: "#F3E5F5",
  Completed: "#E8F5E9",
  Cancelled: "#FFEBEE",
  pending: "#FFF8E1",
  confirmed: "#E3F2FD",
  processing: "#E3F2FD",
  shipped: "#F3E5F5",
  delivered: "#E8F5E9",
  cancelled: "#FFEBEE",
};

const STATUS_DISPLAY: Record<string, string> = {
  "To Ship": "To Ship",
  Preparing: "Preparing",
  Shipped: "Shipped",
  Completed: "Completed",
  Cancelled: "Cancelled",
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Simplified flow: pending -> shipped (seller confirms) -> delivered (buyer confirms)
const STATUS_WORKFLOW: Record<string, string | null> = {
  pending: "shipped",      // Seller confirms -> moves to shipped (To Receive on buyer side)
  confirmed: "shipped",    // Legacy support
  processing: "shipped",   // Legacy support
  shipped: null,           // Buyer must confirm receipt (via their profile)
  delivered: null,
  cancelled: null,
  "To Ship": "Shipped",   // Same as pending -> shipped
  Preparing: "Shipped",    // Legacy support
  Shipped: null,           // Buyer confirms
  Completed: null,
  Cancelled: null,
};

export default function MyOrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get initial tab from URL query parameter
  const initialTab = searchParams.get("tab") || "All";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/seller/orders");
      const data = await response.json();
      
      console.log("Seller orders response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders");
      }
      
      // API returns 'data' array, not 'orders'
      if (data.success && data.data) {
        // Transform the data to match our Order interface
        const transformedOrders = data.data.map((order: any) => ({
          orderId: order.orderId,
          items: order.items?.map((item: any) => ({
            productId: item.productId?.toString() || item.productId,
            productName: item.name || item.productName,
            productImage: item.image || item.productImage,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
            sellerId: item.artistId || item.sellerId,
            sellerName: item.artistName || item.sellerName,
          })) || [],
          shippingAddress: order.shippingAddress || {},
          paymentDetails: {
            method: order.paymentMethod,
            status: order.paymentStatus,
          },
          status: order.status,
          totalAmount: order.sellerTotal || order.orderTotal,
          shippingFee: 0,
          createdAt: order.createdAt,
          trackingNumber: order.trackingNumber,
          buyerName: order.customer?.name || order.shippingAddress?.fullName || "N/A",
          buyerEmail: order.customer?.email || order.shippingAddress?.email || "",
        }));
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }
    
    fetchOrders();
  }, [session, sessionStatus, router, fetchOrders]);

  // Filter orders based on active tab and search term
  // Flow: pending (To Ship) -> shipped (Shipped/To Receive) -> delivered (Completed)
  const filteredOrders = orders.filter((order) => {
    const orderStatus = order.status?.toLowerCase() || "";
    const tabLower = activeTab.toLowerCase();
    
    const matchesTab = activeTab === "All" || 
      orderStatus === tabLower ||
      (tabLower === "to ship" && (orderStatus === "pending" || orderStatus === "confirmed" || orderStatus === "processing")) ||
      (tabLower === "preparing" && (orderStatus === "confirmed" || orderStatus === "processing")) ||
      (tabLower === "shipped" && orderStatus === "shipped") ||
      (tabLower === "completed" && orderStatus === "delivered");
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" ||
      order.orderId?.toLowerCase().includes(searchLower) ||
      order.buyerName?.toLowerCase().includes(searchLower) ||
      order.items?.some(item => item.productName?.toLowerCase().includes(searchLower));
    
    return matchesTab && matchesSearch;
  });

  // Handle status progression
  const handleStatusChange = async (orderId: string, currentStatus: string) => {
    const nextStatus = STATUS_WORKFLOW[currentStatus];
    if (!nextStatus) return;
    
    try {
      setUpdatingStatus(true);
      
      const response = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: nextStatus, // API expects 'status' not 'newStatus'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }
      
      // Refresh orders
      await fetchOrders();
      
      // Update selected order if modal is open
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: nextStatus as OrderStatus } : null);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  // Simplified tabs: To Ship (pending) -> Shipped (awaiting buyer) -> Completed
  const tabs = ["All", "To Ship", "Shipped", "Completed"];

  const getTabCount = (tab: string) => {
    if (tab === "All") return orders.length;
    const tabLower = tab.toLowerCase();
    return orders.filter(o => {
      const status = o.status?.toLowerCase() || "";
      // To Ship: orders waiting for seller confirmation
      if (tabLower === "to ship") return status === "pending" || status === "confirmed" || status === "processing";
      // Shipped: orders waiting for buyer confirmation
      if (tabLower === "shipped") return status === "shipped";
      // Completed: delivered orders
      if (tabLower === "completed") return status === "delivered";
      return false;
    }).length;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || "#666";
  const getStatusBg = (status: string) => STATUS_BG[status] || "#f5f5f5";
  const getStatusDisplay = (status: string) => STATUS_DISPLAY[status] || status;

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="myorders-page">
        <Navbar />
        <main className="myorders-main">
          <div className="myorders-loading">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    const isNotSeller = error.toLowerCase().includes("seller access");
    return (
      <div className="myorders-page">
        <Navbar />
        <main className="myorders-main">
          <div className="myorders-error">
            <i className={`fa-solid ${isNotSeller ? 'fa-store-slash' : 'fa-exclamation-circle'}`}></i>
            <h3>{isNotSeller ? 'Seller Account Required' : 'Error Loading Orders'}</h3>
            <p>{isNotSeller ? 'You need to register as a seller to access the orders dashboard.' : error}</p>
            {isNotSeller ? (
              <button onClick={() => router.push('/profile')} className="myorders-retry-btn">
                Go to Profile
              </button>
            ) : (
              <button onClick={fetchOrders} className="myorders-retry-btn">
                Try Again
              </button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="myorders-page">
      <Navbar />

      <main className="myorders-main">
        {/* Header */}
        <div className="myorders-header">
          <h1 className="myorders-title">Orders Dashboard</h1>
          <p className="myorders-subtitle">
            Manage all orders involving your products
          </p>
          <button onClick={fetchOrders} className="myorders-refresh-btn">
            <i className="fa-solid fa-refresh"></i> Refresh
          </button>
        </div>

        {/* Search Bar */}
        <div className="myorders-search-container">
          <div className="myorders-search-wrapper">
            <input
              type="text"
              placeholder="Search by product name, buyer name, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="myorders-search-input"
            />
            <i className="fa-solid fa-search myorders-search-icon"></i>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="myorders-tabs-container">
          <div className="myorders-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`myorders-tab ${activeTab === tab ? "active" : ""}`}
              >
                {tab}
                <span className="myorders-tab-count">{getTabCount(tab)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="myorders-list">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.orderId} className="myorders-card">
                <div className="myorders-card-content">
                  {/* Product Image */}
                  <div className="myorders-card-image">
                    <img
                      src={order.items[0]?.productImage || "https://placehold.co/100x100?text=Product"}
                      alt={order.items[0]?.productName || "Product"}
                      className="myorders-product-img"
                    />
                    {order.items.length > 1 && (
                      <span className="myorders-more-items">+{order.items.length - 1} more</span>
                    )}
                  </div>

                  {/* Product & Buyer Info */}
                  <div className="myorders-card-info">
                    <h3 className="myorders-product-name">
                      {order.items[0]?.productName || "Unknown Product"}
                      {order.items.length > 1 && ` (+${order.items.length - 1} items)`}
                    </h3>
                    <p className="myorders-info-row">
                      <span className="myorders-label">Qty:</span>
                      <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </p>
                    <p className="myorders-info-row">
                      <span className="myorders-label">Buyer:</span>
                      <span>{order.buyerName || order.shippingAddress?.fullName || "N/A"}</span>
                    </p>
                    <p className="myorders-info-row">
                      <span className="myorders-label">Address:</span>
                      <span>
                        {order.shippingAddress ? 
                          `${order.shippingAddress.address}, ${order.shippingAddress.city}` : 
                          "N/A"}
                      </span>
                    </p>
                  </div>

                  {/* Status & Price */}
                  <div className="myorders-card-right">
                    <div className="myorders-status-section">
                      <span
                        className="myorders-status-badge"
                        style={{
                          backgroundColor: getStatusBg(order.status),
                          color: getStatusColor(order.status),
                        }}
                      >
                        {getStatusDisplay(order.status)}
                      </span>
                      <p className="myorders-order-date">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="myorders-price-section">
                      <p className="myorders-price">
                        {order.totalAmount?.toLocaleString() || "0"}
                      </p>
                      <p className="myorders-order-id">{order.orderId}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="myorders-card-action">
                  <button
                    onClick={() => openModal(order)}
                    className="myorders-view-details-btn"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="myorders-empty">
              <i className="fa-solid fa-inbox"></i>
              <h3>No orders found</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "There are no orders in this category"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="orders-modal-overlay" onClick={closeModal}>
          <div
            className="orders-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="myorders-modal-header">
              <h2>Order {selectedOrder.orderId}</h2>
              <button onClick={closeModal} className="myorders-modal-close">
                
              </button>
            </div>

            {/* Modal Body */}
            <div className="myorders-modal-body">
              {/* Products Section */}
              <div className="myorders-modal-section">
                <h3>Products ({selectedOrder.items.length})</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="myorders-modal-product">
                    <img
                      src={item.productImage || "https://placehold.co/100x100?text=Product"}
                      alt={item.productName}
                      className="myorders-modal-product-img"
                    />
                    <div className="myorders-modal-product-info">
                      <p className="myorders-modal-product-name">{item.productName}</p>
                      <p className="myorders-modal-info-line">
                        <span className="myorders-modal-label">Quantity:</span>
                        {item.quantity}
                      </p>
                      <p className="myorders-modal-info-line">
                        <span className="myorders-modal-label">Unit Price:</span>
                        {item.price?.toLocaleString() || "0"}
                      </p>
                      <p className="myorders-modal-info-line">
                        <span className="myorders-modal-label">Subtotal:</span>
                        {item.subtotal?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                ))}
                <span
                  className="myorders-status-badge"
                  style={{
                    backgroundColor: getStatusBg(selectedOrder.status),
                    color: getStatusColor(selectedOrder.status),
                    marginTop: "0.5rem",
                  }}
                >
                  {getStatusDisplay(selectedOrder.status)}
                </span>
              </div>

              {/* Buyer Section */}
              <div className="myorders-modal-section">
                <h3>Buyer Information</h3>
                <p className="myorders-modal-info-line">
                  <span className="myorders-modal-label">Name:</span>
                  {selectedOrder.buyerName || selectedOrder.shippingAddress?.fullName || "N/A"}
                </p>
                <p className="myorders-modal-info-line">
                  <span className="myorders-modal-label">Email:</span>
                  {selectedOrder.buyerEmail || selectedOrder.shippingAddress?.email || "N/A"}
                </p>
                <p className="myorders-modal-info-line">
                  <span className="myorders-modal-label">Phone:</span>
                  {selectedOrder.shippingAddress?.phone || "N/A"}
                </p>
                <p className="myorders-modal-info-line">
                  <span className="myorders-modal-label">Address:</span>
                  {selectedOrder.shippingAddress ? 
                    `${selectedOrder.shippingAddress.address}, ${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.province} ${selectedOrder.shippingAddress.postalCode}` :
                    "N/A"}
                </p>
              </div>

              {/* Payment Section */}
              <div className="myorders-modal-section">
                <h3>Payment Summary</h3>
                <div className="myorders-payment-breakdown">
                  <div className="myorders-payment-row">
                    <span>Subtotal:</span>
                    <span>{(selectedOrder.totalAmount - (selectedOrder.shippingFee || 0)).toLocaleString()}</span>
                  </div>
                  <div className="myorders-payment-row">
                    <span>Shipping:</span>
                    <span>{selectedOrder.shippingFee?.toLocaleString() || "0"}</span>
                  </div>
                  <div className="myorders-payment-row total">
                    <span>Total:</span>
                    <span>{selectedOrder.totalAmount?.toLocaleString() || "0"}</span>
                  </div>
                  <p className="myorders-payment-method">
                    Payment Method: {selectedOrder.paymentDetails?.method || "N/A"} |{" "}
                    <span style={{ color: selectedOrder.paymentDetails?.status === "paid" ? "#4CAF50" : "#FFC107" }}>
                      {selectedOrder.paymentDetails?.status || "Pending"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="myorders-modal-section">
                <h3>Order Details</h3>
                <p className="myorders-modal-info-line">
                  <span className="myorders-modal-label">Order Date:</span>
                  {formatDate(selectedOrder.createdAt)}
                </p>
                {selectedOrder.trackingNumber && (
                  <p className="myorders-modal-info-line">
                    <span className="myorders-modal-label">Tracking #:</span>
                    {selectedOrder.trackingNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="myorders-modal-footer">
              <div className="myorders-modal-buttons">
                {STATUS_WORKFLOW[selectedOrder.status] && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.orderId, selectedOrder.status)}
                    disabled={updatingStatus}
                    className="myorders-modal-btn primary full-width"
                  >
                    {updatingStatus ? "Updating..." : (
                      <>
                        {(selectedOrder.status === "pending" || selectedOrder.status === "To Ship") && "Confirm & Ship Order"}
                        {(selectedOrder.status === "confirmed" || selectedOrder.status === "processing" || selectedOrder.status === "Preparing") && "Mark as Shipped"}
                      </>
                    )}
                  </button>
                )}

                {(selectedOrder.status === "shipped" || selectedOrder.status === "Shipped") && (
                  <div className="myorders-modal-info-message">
                    <i className="fa-solid fa-info-circle"></i>
                    Waiting for buyer to confirm receipt
                  </div>
                )}

                {(selectedOrder.status === "delivered" || selectedOrder.status === "Completed") && (
                  <button
                    disabled
                    className="myorders-modal-btn disabled full-width"
                  >
                    <i className="fa-solid fa-check-circle"></i>
                    Order Completed
                  </button>
                )}

                <button
                  onClick={closeModal}
                  className="myorders-modal-btn secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
