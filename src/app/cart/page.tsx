"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaShoppingCart, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import "./cart.css";

interface CartItemWithSelection {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  artistName: string;
  maxStock: number;
  selected: boolean;
}

export default function CartPage() {
  // Zustand store
  const { 
    items, 
    isLoading, 
    error, 
    fetchCart, 
    updateQuantity, 
    removeItem 
  } = useCartStore();

  // Local UI state for item selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  
  const footerRef = useRef<HTMLDivElement>(null);
  const [hideCartFooter, setHideCartFooter] = useState(false);
  const router = useRouter();

  // Load cart on component mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Map API items to UI format with selection state
  const cartItemsWithSelection: CartItemWithSelection[] = items.map(item => ({
    ...item,
    selected: selectedItems.has(item.productId)
  }));

  // Computed values based on selection
  const selectedCartItems = cartItemsWithSelection.filter(item => item.selected);
  const totalPrice = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const selectedCount = selectedCartItems.length;

  const incrementQty = async (productId: string, currentQuantity: number) => {
    if (operationLoading === productId) return;
    
    setOperationLoading(productId);
    try {
      await updateQuantity(productId, currentQuantity + 1);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const decrementQty = async (productId: string, currentQuantity: number) => {
    if (operationLoading === productId || currentQuantity <= 1) return;
    
    setOperationLoading(productId);
    try {
      await updateQuantity(productId, currentQuantity - 1);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const toggleSelectItem = (productId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllItems = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(cartItemsWithSelection.map(item => item.productId)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const deleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    const itemsToDelete = Array.from(selectedItems);
    setOperationLoading('bulk-delete');
    
    try {
      // Delete selected items one by one
      await Promise.all(itemsToDelete.map(productId => removeItem(productId)));
      setSelectedItems(new Set()); // Clear selection after successful deletion
    } catch (error) {
      console.error('Failed to delete selected items:', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDeleteSingle = async (productId: string) => {
    if (operationLoading === productId) return;
    
    setOperationLoading(productId);
    try {
      await removeItem(productId);
      // Remove from selection if it was selected
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleCheckout = () => {
    if (selectedCount === 0) return;
    
    // Pass selected items to checkout page
    const selectedItemsData = selectedCartItems.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      artistName: item.artistName,
    }));
    
    // Store in sessionStorage for checkout page
    sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItemsData));
    router.push('/checkout');
  };

  // IntersectionObserver for sticky footer
  useEffect(() => {
    if (!footerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide cart footer when website footer is visible (intersecting)
        // Show cart footer when website footer is not visible (not intersecting)
        setHideCartFooter(entry.isIntersecting);
      },
      { 
        root: null, 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before footer is fully visible
      }
    );

    observer.observe(footerRef.current);

    return () => observer.disconnect();
  }, []);

  // Loading state
  if (isLoading && cartItemsWithSelection.length === 0) {
    return (
      <>
        <Navbar />
        <div className="cart-page-wrapper">
          <div className="cart-title-bar">
            <FaShoppingCart className="cart-title-icon" />
            <span className="cart-title-text">Shopping Cart</span>
          </div>
          <div className="cart-loading">Loading your cart...</div>
        </div>
        <div ref={footerRef}>
          <Footer />
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <div className="cart-page-wrapper">
          <div className="cart-title-bar">
            <FaShoppingCart className="cart-title-icon" />
            <span className="cart-title-text">Shopping Cart</span>
          </div>
          <div className="cart-error">
            <p>Failed to load cart: {error}</p>
            <button onClick={() => fetchCart()}>Try Again</button>
          </div>
        </div>
        <div ref={footerRef}>
          <Footer />
        </div>
      </>
    );
  }

  // Empty cart state
  if (cartItemsWithSelection.length === 0) {
    return (
      <>
        <Navbar />
        <div className="cart-page-wrapper">
          <div className="cart-title-bar">
            <FaShoppingCart className="cart-title-icon" />
            <span className="cart-title-text">Shopping Cart</span>
          </div>
          <div className="cart-empty">
            <FaShoppingCart className="empty-cart-icon" />
            <h3>Your cart is empty</h3>
            <p>Add some products to get started!</p>
            <button onClick={() => router.push('/products')}>Shop Now</button>
          </div>
        </div>
        <div ref={footerRef}>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="cart-page-wrapper">
        <div className="cart-title-bar">
          <FaShoppingCart className="cart-title-icon" />
          <span className="cart-title-text">Shopping Cart</span>
        </div>

        <div className="cart-items-container">
          {cartItemsWithSelection.map((item) => (
            <div key={item.productId} className="cart-item-card">
              <input
                type="checkbox"
                className="cart-item-checkbox"
                checked={item.selected}
                onChange={() => toggleSelectItem(item.productId)}
              />
              <img
                src={item.image}
                alt={item.name}
                className="cart-item-image"
              />
              <div className="cart-item-divider" />
              <div className="cart-item-info">
                <span className="cart-item-artist">{item.artistName}</span>
                <span className="cart-item-product">{item.name}</span>
                <span className="cart-item-price">₱{item.price.toLocaleString()}</span>
                <div className="cart-item-quantity">
                  <button 
                    onClick={() => decrementQty(item.productId, item.quantity)}
                    disabled={item.quantity <= 1 || operationLoading === item.productId}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => incrementQty(item.productId, item.quantity)}
                    disabled={item.quantity >= item.maxStock || operationLoading === item.productId}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="cart-item-trash"
                onClick={() => handleDeleteSingle(item.productId)}
                disabled={operationLoading === item.productId}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`cart-page-footer ${hideCartFooter ? "hide" : ""}`}>
        <div className="footer-left">
          <input
            type="checkbox"
            className="footer-checkbox"
            checked={selectedCount === cartItemsWithSelection.length && cartItemsWithSelection.length > 0}
            onChange={(e) => selectAllItems(e.target.checked)}
          />
          <span className="footer-select-text">
            Select All ({selectedCount})
          </span>
          <div className="footer-divider" />
          <button 
            className="footer-delete-btn" 
            onClick={deleteSelected}
            disabled={selectedCount === 0 || operationLoading === 'bulk-delete'}
          >
            {operationLoading === 'bulk-delete' ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        <div className="footer-right">
          <span className="footer-total-label">
            Total ({selectedCount} items):
          </span>
          <span className="footer-total-price">
            ₱{totalPrice.toLocaleString()}
          </span>
          <button
            className="footer-checkout-btn"
            onClick={handleCheckout}
            disabled={selectedCount === 0}
          >
            Check Out
          </button>
        </div>
      </div>

      <div ref={footerRef}>
        <Footer />
      </div>
    </>
  );
}

