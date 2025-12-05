"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaShoppingCart, FaMapMarkerAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { broadcastNotificationsUpdate } from "@/lib/clientNotifications";
import "./checkout.css";

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  artistName: string;
}

interface UserAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  region?: string;
}

interface OrderShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface UserProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: Partial<UserAddress>;
  };
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

type CartCheckoutItem = CheckoutItem & { maxStock?: number };

type CartApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    items?: CartCheckoutItem[];
  };
};

const shippingOptions: ShippingOption[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    price: 58,
    estimatedDays: "3-5 business days",
  },
  {
    id: "express",
    name: "Express Shipping",
    price: 75,
    estimatedDays: "2-3 business days",
  },
  {
    id: "priority",
    name: "Priority Shipping",
    price: 120,
    estimatedDays: "1-2 business days",
  },
];

const EMPTY_ADDRESS: UserAddress = {
  fullName: "",
  email: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  postalCode: "",
  phone: "",
  region: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { clearCart } = useCartStore();

  const [checkoutItems, setCheckoutItems] = React.useState<CheckoutItem[]>([]);
  const [userAddress, setUserAddress] = React.useState<UserAddress | null>(
    null
  );
  const [savedAddresses, setSavedAddresses] = React.useState<UserAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [selectedPayment, setSelectedPayment] = React.useState("");
  const [selectedShipping, setSelectedShipping] = React.useState(
    shippingOptions[0]
  );
  const [showShippingOptions, setShowShippingOptions] = React.useState(false);

  const [voucherCode, setVoucherCode] = React.useState("");
  const [appliedVoucher, setAppliedVoucher] = React.useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [messageToSeller, setMessageToSeller] = React.useState("");

  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const broadcastOrderUpdate = React.useCallback((newOrderId: string) => {
    if (!newOrderId || typeof window === "undefined") {
      return;
    }

    try {
      sessionStorage.setItem(
        "ordersPendingRefresh",
        JSON.stringify({ orderId: newOrderId, timestamp: Date.now() })
      );
    } catch {
      // Non-critical: ignore storage errors (e.g., quota exceeded)
    }

    window.dispatchEvent(
      new CustomEvent("orders:created", {
        detail: { orderId: newOrderId },
      })
    );
  }, []);

  const fetchCartItems = React.useCallback(async (): Promise<
    CheckoutItem[]
  > => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data: CartApiResponse = await response.json();

      if (!response.ok || !data.success || !data.data?.items) {
        throw new Error(data.message || "Unable to load cart items");
      }

      return data.data.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        artistName: item.artistName,
      }));
    } catch (cartError) {
      console.error("Checkout cart fetch failed:", cartError);
      return [];
    }
  }, []);

  const enrichCheckoutItems = React.useCallback(
    async (items: Partial<CheckoutItem>[]): Promise<CheckoutItem[]> => {
      if (!items.length) {
        return [];
      }

      const needsEnrichment = items.some(
        (item) => !item.name || !item.image || !item.artistName
      );

      if (!needsEnrichment) {
        return items as CheckoutItem[];
      }

      const cartItems = await fetchCartItems();
      const cartMap = new Map(cartItems.map((item) => [item.productId, item]));

      return items.map((item) => {
        const fallback = item.productId
          ? cartMap.get(item.productId)
          : undefined;
        return {
          productId: item.productId || fallback?.productId || "",
          name: item.name || fallback?.name || "Unavailable product",
          price: item.price ?? fallback?.price ?? 0,
          quantity: item.quantity ?? fallback?.quantity ?? 1,
          image:
            item.image ||
            fallback?.image ||
            "https://placehold.co/80x80?text=No+Image",
          artistName:
            item.artistName || fallback?.artistName || "Unknown artisan",
        };
      });
    },
    [fetchCartItems]
  );

  const loadCheckoutData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      let normalizedItems: CheckoutItem[] = [];

      const storedCart = sessionStorage.getItem("checkoutItems");
      console.log("📦 Raw sessionStorage data:", storedCart);

      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart) as Partial<CheckoutItem>[];
          console.log("📋 Parsed cart items:", parsedCart);
          normalizedItems = await enrichCheckoutItems(parsedCart);
        } catch (parseError) {
          console.warn("Invalid checkout cache, refetching cart:", parseError);
        }
      }

      if (!normalizedItems.length) {
        console.log("🔄 No items in session, fetching from cart API...");
        normalizedItems = await fetchCartItems();
      }

      if (normalizedItems.length) {
        console.log("✅ Checkout items loaded:", normalizedItems);
        setCheckoutItems(normalizedItems);
        sessionStorage.setItem(
          "checkoutItems",
          JSON.stringify(normalizedItems)
        );
      } else {
        console.warn("⚠️ No checkout items found, redirecting to cart...");
        setCheckoutItems([]);
        setTimeout(() => router.push("/cart"), 2000);
      }

      // TODO: Uncomment when /api/user/profile endpoint is created
      // Try to fetch real user data if session exists
      // if (session?.user) {
      //   try {
      //     const response = await fetch("/api/user/profile");
      //     const contentType = response.headers.get("content-type");
      //
      //     if (response.ok && contentType?.includes("application/json")) {
      //       const data = await response.json();
      //       if (data.address) {
      //         setUserAddress(data.address);
      //         setSavedAddresses([data.address]);
      //       }
      //     }
      //   } catch (err) {
      //     console.log("Using test address as fallback");
      //   }
      // }
    } catch (err) {
      console.error("Error loading checkout data:", err);
      setError("Failed to load checkout data");
    } finally {
      setIsLoading(false);
    }
  }, [enrichCheckoutItems, fetchCartItems, router]);

  const loadUserProfile = React.useCallback(async () => {
    if (!session?.user?.id) {
      setUserAddress(null);
      setSavedAddresses([]);
      return;
    }

    try {
      const response = await fetch("/api/user/profile", { cache: "no-store" });
      const profile: UserProfileResponse = await response.json();

      if (!response.ok || !profile.success || !profile.data) {
        throw new Error(profile.message || "Unable to load profile");
      }

      const normalizedAddress: UserAddress = {
        fullName: profile.data.fullName || session?.user?.name || "",
        email: profile.data.email || session?.user?.email || "",
        phone: profile.data.phone || "",
        street: profile.data.address?.street || "",
        barangay: profile.data.address?.barangay || "",
        city: profile.data.address?.city || "",
        province: profile.data.address?.province || "",
        postalCode: profile.data.address?.postalCode || "",
        region: profile.data.address?.region,
      };

      setUserAddress(normalizedAddress);
      setSavedAddresses([normalizedAddress]);
    } catch (profileError) {
      console.warn(
        "Using empty address due to profile fetch issue:",
        profileError
      );
      setUserAddress(null);
      setSavedAddresses([]);
    }
  }, [session?.user?.email, session?.user?.id, session?.user?.name]);

  // Load checkout data on mount
  React.useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);

  React.useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const buildShippingAddress = React.useCallback((): OrderShippingAddress => {
    const baseAddress = userAddress || EMPTY_ADDRESS;
    const fallbackName = session?.user?.name || "";
    const fallbackEmail = session?.user?.email || "";

    return {
      fullName: baseAddress.fullName || fallbackName,
      email: baseAddress.email || fallbackEmail,
      phone: baseAddress.phone || "",
      address: [baseAddress.street, baseAddress.barangay]
        .filter(Boolean)
        .join(", "),
      city: baseAddress.city || "",
      province: baseAddress.province || "",
      postalCode: baseAddress.postalCode || "",
      country: "Philippines",
    };
  }, [session?.user?.email, session?.user?.name, userAddress]);

  const handleSelectAddress = (address: UserAddress) => {
    setUserAddress(address);
    setShowAddressModal(false);
  };

  const handleApplyVoucher = () => {
    if (voucherCode.trim() === "GROWLOKAL10") {
      setAppliedVoucher({ code: voucherCode, discount: 50 });
      setVoucherCode("");
    } else {
      alert("Invalid voucher code");
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      alert("Please select a payment method");
      return;
    }

    // Basic address validation to avoid sending placeholder data
    const address = userAddress || EMPTY_ADDRESS;
    const requiredAddressFields = [
      address.fullName || session?.user?.name,
      address.email || session?.user?.email,
      address.phone,
      address.street,
      address.barangay,
      address.city,
      address.province,
      address.postalCode,
    ];

    if (requiredAddressFields.some((field) => !field)) {
      setError("Please complete your delivery address before placing the order.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      const subtotal = checkoutItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const shippingFee = selectedShipping.price;
      const discount = appliedVoucher?.discount || 0;
      const total = subtotal + shippingFee - discount;
      const normalizedPaymentMethod =
        selectedPayment === "ewallet" ? "gcash" : selectedPayment;
      const shippingPayload = buildShippingAddress();

      const orderData = {
        items: checkoutItems,
        shippingAddress: shippingPayload,
        shippingOption: selectedShipping,
        paymentMethod: normalizedPaymentMethod,
        voucher: appliedVoucher,
        messageToSeller: messageToSeller,
        subtotal,
        shippingFee,
        discount,
        total,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => ({ message: "Failed to create order" }));
        throw new Error(body.message || "Failed to create order");
      }

      const result = await response.json();
      const newOrderId = result.data.orderId || result.data._id;

      if (!result.success || !newOrderId) {
        throw new Error(result.message || "Failed to create order");
      }

      // Clear cart after successful order
      await clearCart();
      sessionStorage.removeItem("checkoutItems");

      broadcastOrderUpdate(newOrderId);
      broadcastNotificationsUpdate();

      if (normalizedPaymentMethod === "gcash") {
        const paymongoResponse = await fetch("/api/payment/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: newOrderId,
            paymentMethod: "gcash",
          }),
        });

        const paymongoData = await paymongoResponse.json();

        if (
          !paymongoResponse.ok ||
          !paymongoData.success ||
          !paymongoData.data?.checkoutUrl
        ) {
          throw new Error(
            paymongoData.message || "Failed to initialize e-wallet payment"
          );
        }

        window.location.href = paymongoData.data.checkoutUrl;
        return;
      }

      if (normalizedPaymentMethod === "card") {
        router.push(`/payment/${newOrderId}`);
        return;
      }

      // Show success modal for non-card methods
      setShowSuccessModal(true);

      setTimeout(() => {
        router.push("/profile?section=orders");
      }, 1500);
    } catch (err) {
      console.error("Error placing order:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculations
  const totalItems = checkoutItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = selectedShipping.price;
  const discount = appliedVoucher?.discount || 0;
  const total = subtotal + shippingFee - discount;

  // Get estimated delivery date
  const getEstimatedDelivery = () => {
    const days = parseInt(selectedShipping.estimatedDays.split("-")[1]);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="checkout-wrapper">
          <div className="checkout-loading" role="status" aria-live="polite">
            <span className="checkout-loading-spinner" aria-hidden="true" />
            <p>Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <>
        <Navbar />
        <div className="checkout-wrapper">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>No items in checkout</p>
            <button
              onClick={() => router.push("/cart")}
              className="place-order-btn"
            >
              Go to Cart
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="checkout-wrapper">
        {/* Page Title */}
        <div className="checkout-title-bar">
          <FaShoppingCart className="checkout-title-icon" />
          <span className="checkout-title-text">Checkout</span>
        </div>

        {/* Delivery Address Card */}
        <div className="checkout-address-card">
          <div className="address-header">
            <FaMapMarkerAlt className="address-icon" />
            <span className="address-title">Delivery Address</span>
            <button
              className="change-address-btn"
              onClick={() => setShowAddressModal(true)}
            >
              Change
            </button>
          </div>

          {userAddress && (
            <div className="address-details">
              <div className="address-left">
                <div className="address-name">
                  {userAddress.fullName || session?.user?.name || ""}
                </div>
                <div className="address-phone">{userAddress.phone}</div>
              </div>
              <div className="address-right">
                {[userAddress.street, userAddress.barangay, userAddress.city, userAddress.province, userAddress.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </div>
          )}
        </div>

        {/* Product Summary Card */}
        <div className="checkout-summary-card products">
          <div className="checkout-header-row">
            <span>Product Ordered</span>
            <span>Unit Price</span>
            <span>Quantity</span>
            <span>Item Subtotal</span>
          </div>

          <div className="checkout-items-scroll">
            {checkoutItems.length === 0 ? (
              <div
                style={{ padding: "20px", textAlign: "center", color: "#666" }}
              >
                No items found. Redirecting to cart...
              </div>
            ) : (
              checkoutItems.map((item) => (
                <div className="checkout-item-row" key={item.productId}>
                  <div className="checkout-product-info">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="checkout-product-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/80x80?text=No+Image";
                      }}
                    />
                    <div className="product-details">
                      <div className="seller-name">{item.artistName}</div>
                      <div className="product-name">{item.name}</div>
                    </div>
                  </div>

                  <div className="product-price">₱{item.price.toFixed(2)}</div>
                  <div className="product-quantity">{item.quantity}</div>
                  <div className="product-subtotal">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <hr className="checkout-divider" />

          {/* Shipping Section */}
          <div className="checkout-shipping-section">
            <div className="shipping-header">
              <span className="shipping-label">Shipping Option</span>
              <button
                className="change-shipping-btn"
                onClick={() => setShowShippingOptions(true)}
              >
                Change
              </button>
            </div>
            <div className="shipping-details">
              <div className="shipping-info-left">
                <div className="shipping-name">{selectedShipping.name}</div>
                <div className="shipping-estimate">
                  Receive by {getEstimatedDelivery()}
                </div>
                <div className="shipping-guarantee">
                  Guaranteed delivery by {selectedShipping.estimatedDays}
                </div>
              </div>
              <div className="shipping-fee">₱{shippingFee.toFixed(2)}</div>
            </div>
          </div>

          <hr className="checkout-divider" />

          {/* Voucher Section */}
          <div className="checkout-voucher-section">
            <span className="voucher-label">Grow-Lokal Voucher</span>
            {appliedVoucher ? (
              <div className="voucher-applied">
                <span className="voucher-code">{appliedVoucher.code}</span>
                <span className="voucher-discount">
                  -₱{appliedVoucher.discount}
                </span>
                <button
                  className="remove-voucher-btn"
                  onClick={handleRemoveVoucher}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="select-voucher-btn"
                onClick={() => {
                  const code = prompt("Enter voucher code:");
                  if (code) {
                    setVoucherCode(code);
                    setTimeout(() => handleApplyVoucher(), 100);
                  }
                }}
              >
                Select Voucher
              </button>
            )}
          </div>

          <hr className="checkout-divider" />

          {/* Message to Seller */}
          <div className="checkout-message-section">
            <label className="message-label">
              Message to Seller (Optional)
            </label>
            <input
              type="text"
              className="message-input"
              placeholder="Leave a message for the seller..."
              value={messageToSeller}
              onChange={(e) => setMessageToSeller(e.target.value.slice(0, 200))}
              maxLength={200}
            />
            <div className="message-counter">{messageToSeller.length}/200</div>
          </div>

          <hr className="checkout-divider" />

          <div className="checkout-total">
            <span className="total-label">
              Order Total ({totalItems} {totalItems > 1 ? "items" : "item"}):
            </span>
            <span className="total-amount">₱{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="checkout-payment-card">
          <div className="payment-header">
            <div className="payment-title-group">
              <span className="payment-title">Payment Method</span>
              <div className="payment-buttons">
                <button
                  type="button"
                  className={`payment-btn ${
                    selectedPayment === "cod" ? "active" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelectedPayment("cod")}
                >
                  Cash on Delivery
                </button>
                <button
                  type="button"
                  className={`payment-btn ${
                    selectedPayment === "card" ? "active" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelectedPayment("card")}
                >
                  Credit/Debit Card
                </button>
                <button
                  type="button"
                  className={`payment-btn ${
                    selectedPayment === "ewallet" ? "active" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelectedPayment("ewallet")}
                >
                  GCash
                </button>
              </div>
            </div>
          </div>

          <hr className="checkout-divider" />

          <div className="payment-section">
            {/* LEFT: Payment Info */}
            <div className="payment-left">
              {selectedPayment === "card" && (
                <div className="payment-info-box">
                  <p className="payment-info-text">
                    You will be redirected to our secure payment page to enter
                    your card details.
                  </p>
                  <p className="payment-info-note">
                    We accept Visa, Mastercard, and other major credit/debit
                    cards.
                  </p>
                </div>
              )}
              {selectedPayment === "ewallet" && (
                <label className="paymongo-radio-row">
                  <input
                    type="radio"
                    className="paymongo-radio"
                    checked={true}
                    readOnly
                  />
                  <div className="paymongo-info">
                    <span className="paymongo-title">GCash</span>
                    <span className="paymongo-note">
                      Pay securely with GCash. You will be redirected to complete your payment.
                    </span>
                  </div>
                </label>
              )}
              {selectedPayment === "cod" && (
                <div className="payment-info-box">
                  <p className="payment-info-text">
                    Pay with cash when your order is delivered to your doorstep.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: Payment Summary */}
            <div className="payment-right">
              <div className="checkout-summary-card payment-summary">
                <div className="summary-row">
                  <span className="summary-label">Merchandise Subtotal</span>
                  <span className="summary-value">₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Shipping Subtotal</span>
                  <span className="summary-value">
                    ₱{shippingFee.toFixed(2)}
                  </span>
                </div>
                {appliedVoucher && (
                  <div className="summary-row discount">
                    <span className="summary-label">Voucher Discount</span>
                    <span className="summary-value discount">
                      -₱{discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="summary-row total">
                  <span className="summary-label">Total Payment</span>
                  <span className="summary-total">₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="checkout-divider" />

          <div className="place-order-container">
            {error && <div className="error-message">{error}</div>}
            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={!selectedPayment || isProcessing}
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>

      {/* Shipping Options Modal */}
      {showShippingOptions && (
        <div
          className="modal-overlay"
          onClick={() => setShowShippingOptions(false)}
        >
          <div
            className="modal-box shipping-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">Select Shipping Option</h3>
            <div className="shipping-options-list">
              {shippingOptions.map((option) => (
                <div
                  key={option.id}
                  className={`shipping-option-item ${
                    selectedShipping.id === option.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedShipping(option);
                    setShowShippingOptions(false);
                  }}
                >
                  <div className="shipping-option-info">
                    <div className="shipping-option-name">{option.name}</div>
                    <div className="shipping-option-days">
                      {option.estimatedDays}
                    </div>
                  </div>
                  <div className="shipping-option-price">₱{option.price}</div>
                </div>
              ))}
            </div>
            <button
              className="modal-close-btn"
              onClick={() => setShowShippingOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="modal-box address-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">Select Delivery Address</h3>
            <div className="address-list">
              {savedAddresses.map((address, index) => (
                <div
                  key={index}
                  className={`address-item ${
                    userAddress === address ? "selected" : ""
                  }`}
                  onClick={() => handleSelectAddress(address)}
                >
                  <div className="address-item-info">
                    <div className="address-item-phone">{address.phone}</div>
                    <div className="address-item-text">
                      {address.street}, {address.barangay}, {address.city},{" "}
                      {address.province} {address.postalCode}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="modal-close-btn"
              onClick={() => setShowAddressModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">🎉 Order Delivered Successfully!</h3>
            <p className="modal-text">
              {selectedPayment === "card"
                ? "Redirecting to payment page..."
                : selectedPayment === "ewallet"
                ? "Redirecting to payment verification..."
                : "Thank you for your order! Your order has been marked as delivered."}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
