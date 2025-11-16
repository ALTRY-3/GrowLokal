"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaShoppingCart, FaMapMarkerAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
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
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

const shippingOptions: ShippingOption[] = [
  { id: "standard", name: "Standard Shipping", price: 58, estimatedDays: "3-5 business days" },
  { id: "express", name: "Express Shipping", price: 75, estimatedDays: "2-3 business days" },
  { id: "priority", name: "Priority Shipping", price: 120, estimatedDays: "1-2 business days" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { clearCart } = useCartStore();

  const [checkoutItems, setCheckoutItems] = React.useState<CheckoutItem[]>([]);
  const [userAddress, setUserAddress] = React.useState<UserAddress | null>(null);
  const [savedAddresses, setSavedAddresses] = React.useState<UserAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = React.useState(false);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState("");
  
  const [selectedPayment, setSelectedPayment] = React.useState("");
  const [selectedShipping, setSelectedShipping] = React.useState(shippingOptions[0]);
  const [showShippingOptions, setShowShippingOptions] = React.useState(false);
  
  const [voucherCode, setVoucherCode] = React.useState("");
  const [appliedVoucher, setAppliedVoucher] = React.useState<{ code: string; discount: number } | null>(null);
  const [messageToSeller, setMessageToSeller] = React.useState("");
  
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  // Load checkout data on mount
  React.useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Load cart items from sessionStorage (key set by cart page)
      const storedCart = sessionStorage.getItem("checkoutItems");
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        setCheckoutItems(parsedCart);
      }

      // Load user address - use test address for now
      const testAddress: UserAddress = {
        street: "123 Test Street",
        barangay: "Barangay Sample",
        city: "Manila",
        province: "Metro Manila",
        postalCode: "1000",
        phone: "+63 912 345 6789",
      };
      
      setUserAddress(testAddress);
      setSavedAddresses([testAddress]);

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
  };

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

    if (!userAddress) {
      alert("Please provide a delivery address");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = selectedShipping.price;
      const discount = appliedVoucher?.discount || 0;
      const total = subtotal + shippingFee - discount;

      const orderData = {
        items: checkoutItems,
        shippingAddress: userAddress,
        shippingOption: selectedShipping,
        paymentMethod: selectedPayment,
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
        throw new Error("Failed to create order");
      }

      const result = await response.json();

      // Clear cart after successful order
      await clearCart();
      sessionStorage.removeItem("checkoutItems");

      // Show success modal
      setShowSuccessModal(true);

      // Redirect based on payment method
      setTimeout(() => {
        if (selectedPayment === "card") {
          router.push(`/payment/${result.data.orderId || result.data._id}`);
        } else if (selectedPayment === "ewallet") {
          router.push("/verification-payment");
        } else {
          router.push("/profile?section=orders");
        }
      }, 1500);
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculations
  const totalItems = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
          <div style={{ textAlign: "center", padding: "2rem" }}>Loading checkout...</div>
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
            <button onClick={() => router.push("/cart")} className="place-order-btn">
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
                <div className="address-name">{session?.user?.name || "Guest User"}</div>
                <div className="address-phone">{userAddress.phone}</div>
              </div>
              <div className="address-right">
                {userAddress.street}, {userAddress.barangay}, {userAddress.city}, {userAddress.province} {userAddress.postalCode}
              </div>
            </div>
          )}
        </div>

        {/* Product Summary Card */}
        <div className="checkout-summary-card">
          <div className="checkout-header-row">
            <span>Product Ordered</span>
            <span>Unit Price</span>
            <span>Quantity</span>
            <span>Item Subtotal</span>
          </div>

          <div className="checkout-items-scroll">
            {checkoutItems.map((item) => (
              <div className="checkout-item-row" key={item.productId}>
                <div className="product-info">
                  <img src={item.image} alt={item.name} />
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
            ))}
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

          <hr className="checkout-divider" />

          {/* Voucher Section */}
          <div className="checkout-voucher-section">
            <span className="voucher-label">Grow-Lokal Voucher</span>
            {appliedVoucher ? (
              <div className="voucher-applied">
                <span className="voucher-code">{appliedVoucher.code}</span>
                <span className="voucher-discount">-₱{appliedVoucher.discount}</span>
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
            <label className="message-label">Message to Seller (Optional)</label>
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
                  E-Wallet
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
                    You will be redirected to our secure payment page to enter your card details.
                  </p>
                  <p className="payment-info-note">
                    We accept Visa, Mastercard, and other major credit/debit cards.
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
                  <img
                    src="/paymongo-logo.png"
                    alt="PayMongo"
                    className="paymongo-logo"
                  />
                  <div className="paymongo-info">
                    <span className="paymongo-title">PayMongo</span>
                    <span className="paymongo-note">
                      Complete your PayMongo e-wallet payment within 30 mins.{" "}
                      <br />
                      Min. ₱50, available 24/7, with a 2% processing fee.
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
                    <span className="summary-value discount">-₱{discount.toFixed(2)}</span>
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
        <div className="modal-overlay" onClick={() => setShowShippingOptions(false)}>
          <div className="modal-box shipping-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Select Shipping Option</h3>
            <div className="shipping-options-list">
              {shippingOptions.map((option) => (
                <div
                  key={option.id}
                  className={`shipping-option-item ${selectedShipping.id === option.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedShipping(option);
                    setShowShippingOptions(false);
                  }}
                >
                  <div className="shipping-option-info">
                    <div className="shipping-option-name">{option.name}</div>
                    <div className="shipping-option-days">{option.estimatedDays}</div>
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
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-box address-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Select Delivery Address</h3>
            <div className="address-list">
              {savedAddresses.map((address, index) => (
                <div
                  key={index}
                  className={`address-item ${userAddress === address ? "selected" : ""}`}
                  onClick={() => handleSelectAddress(address)}
                >
                  <div className="address-item-info">
                    <div className="address-item-phone">{address.phone}</div>
                    <div className="address-item-text">
                      {address.street}, {address.barangay}, {address.city}, {address.province} {address.postalCode}
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
            <h3 className="modal-title">🎉 Order Placed Successfully!</h3>
            <p className="modal-text">
              {selectedPayment === "card" 
                ? "Redirecting to payment page..." 
                : selectedPayment === "ewallet"
                ? "Redirecting to payment verification..."
                : "Thank you for your order! You'll receive updates on your order status."}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
