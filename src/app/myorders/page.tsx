"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./myorders.css";

// Mock order data
const MOCK_ORDERS = [
  {
    orderId: "ORD-001",
    productName: "Handwoven Basket",
    productImage: "https://placehold.co/100x100?text=Basket",
    quantity: 2,
    totalPrice: 2400,
    buyerName: "Maria Santos",
    buyerAddress: "123 Rizal Street, Quezon City",
    status: "To Ship" as const,
    date: "2025-01-15",
    paymentMethod: "Card Payment",
    paymentStatus: "Paid",
  },
  {
    orderId: "ORD-002",
    productName: "Ceramic Mug Set",
    productImage: "https://placehold.co/100x100?text=Mug",
    quantity: 1,
    totalPrice: 850,
    buyerName: "Juan Dela Cruz",
    buyerAddress: "456 Mabini Avenue, Manila",
    status: "Preparing" as const,
    date: "2025-01-14",
    paymentMethod: "GCash",
    paymentStatus: "Paid",
  },
  {
    orderId: "ORD-003",
    productName: "Woven Placemats",
    productImage: "https://placehold.co/100x100?text=Placemat",
    quantity: 4,
    totalPrice: 1600,
    buyerName: "Rosa Garcia",
    buyerAddress: "789 Ayala Boulevard, Makati",
    status: "Shipped" as const,
    date: "2025-01-12",
    paymentMethod: "COD",
    paymentStatus: "Paid",
  },
  {
    orderId: "ORD-004",
    productName: "Wooden Spoon Set",
    productImage: "https://placehold.co/100x100?text=Spoon",
    quantity: 1,
    totalPrice: 600,
    buyerName: "Ana Torres",
    buyerAddress: "321 BGC, Taguig",
    status: "Completed" as const,
    date: "2025-01-08",
    paymentMethod: "Card Payment",
    paymentStatus: "Paid",
  },
  {
    orderId: "ORD-005",
    productName: "Clay Pottery Bowl",
    productImage: "https://placehold.co/100x100?text=Bowl",
    quantity: 3,
    totalPrice: 1950,
    buyerName: "Pedro Reyes",
    buyerAddress: "654 Arnaiz Street, Makati",
    status: "To Ship" as const,
    date: "2025-01-13",
    paymentMethod: "GCash",
    paymentStatus: "Paid",
  },
];

type OrderStatus =
  | "To Ship"
  | "Preparing"
  | "Shipped"
  | "Completed"
  | "Cancelled";

interface Order {
  orderId: string;
  productName: string;
  productImage: string;
  quantity: number;
  totalPrice: number;
  buyerName: string;
  buyerAddress: string;
  status: OrderStatus;
  date: string;
  paymentMethod: string;
  paymentStatus: string;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  "To Ship": "#FFC107",
  Preparing: "#2196F3",
  Shipped: "#673AB7",
  Completed: "#4CAF50",
  Cancelled: "#F44336",
};

const STATUS_BG: Record<OrderStatus, string> = {
  "To Ship": "#FFF8E1",
  Preparing: "#E3F2FD",
  Shipped: "#F3E5F5",
  Completed: "#E8F5E9",
  Cancelled: "#FFEBEE",
};

const STATUS_WORKFLOW: Record<OrderStatus, OrderStatus | null> = {
  "To Ship": "Preparing",
  Preparing: "Shipped",
  Shipped: "Completed",
  Completed: null,
  Cancelled: null,
};

interface ModalOrder extends Order {
  isBuyerConfirming?: boolean;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<OrderStatus | "All">("All");
  const [selectedOrder, setSelectedOrder] = useState<ModalOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter orders based on active tab and search term
  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === "All" || order.status === activeTab;
    const matchesSearch =
      order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle status progression
  const handleStatusChange = (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = STATUS_WORKFLOW[currentStatus];
    if (nextStatus) {
      setOrders(
        orders.map((order) =>
          order.orderId === orderId ? { ...order, status: nextStatus } : order
        )
      );
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
    }
  };

  // Handle buyer confirmation
  const handleBuyerConfirmation = (orderId: string) => {
    setOrders(
      orders.map((order) =>
        order.orderId === orderId ? { ...order, status: "Completed" } : order
      )
    );
    if (selectedOrder && selectedOrder.orderId === orderId) {
      setSelectedOrder({ ...selectedOrder, status: "Completed" });
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

  const tabs: (OrderStatus | "All")[] = [
    "All",
    "To Ship",
    "Preparing",
    "Shipped",
    "Completed",
  ];

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
                <span className="myorders-tab-count">
                  {tab === "All"
                    ? orders.length
                    : orders.filter((o) => o.status === tab).length}
                </span>
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
                      src={order.productImage}
                      alt={order.productName}
                      className="myorders-product-img"
                    />
                  </div>

                  {/* Product & Buyer Info */}
                  <div className="myorders-card-info">
                    <h3 className="myorders-product-name">
                      {order.productName}
                    </h3>
                    <p className="myorders-info-row">
                      <span className="myorders-label">Qty:</span>
                      <span>{order.quantity}</span>
                    </p>
                    <p className="myorders-info-row">
                      <span className="myorders-label">Buyer:</span>
                      <span>{order.buyerName}</span>
                    </p>
                    <p className="myorders-info-row">
                      <span className="myorders-label">Address:</span>
                      <span>{order.buyerAddress}</span>
                    </p>
                  </div>

                  {/* Status & Price */}
                  <div className="myorders-card-right">
                    <div className="myorders-status-section">
                      <span
                        className="myorders-status-badge"
                        style={{
                          backgroundColor: STATUS_BG[order.status],
                          color: STATUS_COLORS[order.status],
                        }}
                      >
                        {order.status}
                      </span>
                      <p className="myorders-order-date">{order.date}</p>
                    </div>
                    <div className="myorders-price-section">
                      <p className="myorders-price">
                        ₱{order.totalPrice.toLocaleString()}
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
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="myorders-modal-body">
              {/* Product Section */}
              <div className="myorders-modal-section">
                <h3>Product Information</h3>
                <div className="myorders-modal-product">
                  <img
                    src={selectedOrder.productImage}
                    alt={selectedOrder.productName}
                    className="myorders-modal-product-img"
                  />
                  <div className="myorders-modal-product-info">
                    <p className="myorders-modal-product-name">
                      {selectedOrder.productName}
                    </p>
                    <p className="myorders-modal-info-line">
                      <span className="myorders-modal-label">Quantity:</span>
                      {selectedOrder.quantity}
                    </p>
                    <p className="myorders-modal-info-line">
                      <span className="myorders-modal-label">Unit Price:</span>₱
                      {Math.round(
                        selectedOrder.totalPrice / selectedOrder.quantity
                      ).toLocaleString()}
                    </p>
                    <span
                      className="myorders-status-badge"
                      style={{
                        backgroundColor: STATUS_BG[selectedOrder.status],
                        color: STATUS_COLORS[selectedOrder.status],
                        marginTop: "0.5rem",
                      }}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buyer Section */}
              <div className="myorders-modal-section">
                <h3>Buyer Information</h3>
                <p className="myorders-modal-info-line">
                  <span className="myorders-modal-label">Name:</span>
                  {selectedOrder.buyerName}
                </p>
                <p className="myorders-modal-info-line">
                  <span className="myorders-modal-label">Address:</span>
                  {selectedOrder.buyerAddress}
                </p>
              </div>

              {/* Payment Section */}
              <div className="myorders-modal-section">
                <h3>Payment Summary</h3>
                <div className="myorders-payment-breakdown">
                  <div className="myorders-payment-row">
                    <span>Subtotal:</span>
                    <span>₱{selectedOrder.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="myorders-payment-row">
                    <span>Shipping:</span>
                    <span>₱0</span>
                  </div>
                  <div className="myorders-payment-row total">
                    <span>Total:</span>
                    <span>₱{selectedOrder.totalPrice.toLocaleString()}</span>
                  </div>
                  <p className="myorders-payment-method">
                    Payment Method: {selectedOrder.paymentMethod} |{" "}
                    <span style={{ color: "#4CAF50" }}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="myorders-modal-section">
                <h3>Order Timeline</h3>
                <p className="myorders-modal-info-line">
                  <span className="myorders-modal-label">Order Date:</span>
                  {selectedOrder.date}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="myorders-modal-footer">
              <div className="myorders-modal-buttons">
                {selectedOrder.status !== "Completed" &&
                  selectedOrder.status !== "Cancelled" && (
                    <button
                      onClick={() => {
                        handleStatusChange(
                          selectedOrder.orderId,
                          selectedOrder.status
                        );
                      }}
                      className="myorders-modal-btn primary full-width"
                    >
                      {selectedOrder.status === "To Ship" && "Confirm Order"}
                      {selectedOrder.status === "Preparing" &&
                        "Mark as Shipped"}
                      {selectedOrder.status === "Shipped" &&
                        "Mark as Delivered"}
                    </button>
                  )}

                {selectedOrder.status === "Shipped" && (
                  <button
                    onClick={() =>
                      handleBuyerConfirmation(selectedOrder.orderId)
                    }
                    className="myorders-modal-btn success"
                  >
                    <i className="fa-solid fa-check"></i>
                    Buyer Confirms Receipt
                  </button>
                )}

                {selectedOrder.status === "Completed" && (
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

                {selectedOrder.status !== "Completed" &&
                  selectedOrder.status !== "Cancelled" && (
                    <button className="myorders-modal-btn danger">
                      Cancel Order
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
