"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/cartStore";
import { 
  FaBoxOpen, 
  FaChevronUp, 
  FaChevronDown, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaShoppingCart,
  FaSpinner,
  FaCheck,
  FaTimes
} from "react-icons/fa";
import "./product.css";

// Product interface matching the database model
interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
  thumbnailUrl: string;
  artistName: string;
  artistId: string;
  isAvailable: boolean;
  isActive: boolean;
  status?: 'draft' | 'published' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

const sectionLabels = [
  { key: "live", label: "Live" },
  { key: "soldout", label: "Sold Out" },
  { key: "draft", label: "Draft" },
  { key: "inactive", label: "Inactive" },
];

export default function ProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCartStore();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApprovedSeller, setIsApprovedSeller] = useState(false);
  const [sortStockAsc, setSortStockAsc] = useState(true);
  const [activeSection, setActiveSection] = useState("live");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Removed customer/seller view toggle
  
  // Add to cart states
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addCartSuccess, setAddCartSuccess] = useState<string | null>(null);
  const [addCartError, setAddCartError] = useState<string | null>(null);
  
  // UI state
  const footerRef = useRef<HTMLDivElement>(null);
  const [hideProductFooter, setHideProductFooter] = useState(false);

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      router.push("/login");
      return;
    }
    
    // Check if user is a seller
    checkSellerStatus();
  }, [session, status, router]);

  // Check seller status
  const checkSellerStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/seller/status");
      const data = await response.json();
      
      if (data.success && data.data?.isSeller && data.status === "approved") {
        setIsApprovedSeller(true);
        fetchProducts();
      } else {
        setIsApprovedSeller(false);
        setLoading(false);
        if (data.status === "pending") {
          setError("Your seller application is pending approval. Please wait for admin review.");
        } else if (data.status === "rejected") {
          setError("Your seller application was rejected. Please contact support for more information.");
        } else {
          setError("You need to be an approved seller to manage products. Please apply to become a seller first.");
        }
      }
    } catch (error) {
      console.error("Error checking seller status:", error);
      setIsApprovedSeller(false);
      setError("Unable to verify seller status. Please try again later.");
      setLoading(false);
    }
  };

  // Check user info for debugging
  const checkUserInfo = async () => {
    try {
      const response = await fetch("/api/debug/user-info");
      const data = await response.json();
      console.log("User info:", data);
      if (data.success) {
        alert(`User: ${data.userInfo.email}\nSeller Status: ${data.userInfo.sellerProfile?.applicationStatus || 'Not a seller'}\nShop: ${data.userInfo.sellerProfile?.shopName || 'No shop'}`);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("User info error:", error);
      alert("Failed to get user info");
    }
  };

  // Fetch seller's products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/seller/products");
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      } else {
        // Handle specific error cases
        if (response.status === 403) {
          setError("You need to be an approved seller to view products. Please apply to become a seller first.");
        } else if (response.status === 401) {
          setError("Please log in to view your products.");
        } else {
          setError(data.error || "Failed to fetch products");
        }
        setProducts([]);
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError("Unable to load products. Please check your internet connection and try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by section
  const filteredProducts = products.filter((p) => {
    if (activeSection === "live") return p.isActive && p.isAvailable && p.stock > 0;
    if (activeSection === "soldout") return p.isActive && p.isAvailable && p.stock === 0;
    if (activeSection === "draft") return !p.isActive;
    if (activeSection === "inactive") return p.isActive && !p.isAvailable;
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) =>
    sortStockAsc ? a.stock - b.stock : b.stock - a.stock
  );

  // Calculate section counts
  const sectionCounts = {
    live: products.filter((p) => p.isActive && p.isAvailable && p.stock > 0).length,
    soldout: products.filter((p) => p.isActive && p.isAvailable && p.stock === 0).length,
    draft: products.filter((p) => !p.isActive).length,
    inactive: products.filter((p) => p.isActive && !p.isAvailable).length,
  };

  // Delete product
  const deleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh products
        fetchProducts();
        alert("Product deleted successfully");
      } else {
        throw new Error(data.message || "Failed to delete product");
      }
    } catch (error: any) {
      console.error("Error deleting product:", error);
      alert(error.message || "Failed to delete product");
    }
  };

  // Add to cart (for customer view simulation)
  const handleAddToCart = async (product: Product) => {
    if (!product.isAvailable || product.stock === 0) return;
    if (addingToCart === product._id) return;
    
    try {
      setAddingToCart(product._id);
      setAddCartError(null);
      
      await addItem(product._id, 1);
      
      setAddingToCart(null);
      setAddCartSuccess(product._id);
      
      setTimeout(() => {
        setAddCartSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      setAddingToCart(null);
      setAddCartError(product._id);
      
      setTimeout(() => {
        setAddCartError(null);
      }, 3000);
    }
  };

  // Footer visibility observer
  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHideProductFooter(entry.isIntersecting),
      { root: null, threshold: 0.05 }
    );
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="product-page-wrapper">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <FaSpinner className="fa-spin" style={{ fontSize: '3rem', color: '#AF7928' }} />
            <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading your products...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <div className="product-page-wrapper">
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <FaTimes style={{ fontSize: '4rem', color: '#e74c3c', marginBottom: '1rem' }} />
            <h2 style={{ color: '#333', marginBottom: '1rem' }}>Unable to Load Products</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>{error}</p>
            
            {error.includes("approved seller") && (
              <button
                onClick={() => router.push("/profile?section=selling")}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#AF7928',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  marginRight: '1rem',
                  marginBottom: '1rem'
                }}
              >
                Apply to Become a Seller
              </button>
            )}
            
            <button 
              onClick={fetchProducts}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Try Again
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
      <div className="product-page-wrapper">
        {/* Title Card */}
        <div className="product-title-bar">
          <FaBoxOpen className="product-title-icon" />
          <span className="product-title-text">My Products</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              Total: {products.length} products
            </span>
          </div>
        </div>
        <hr className="product-title-divider" />

        {/* Section Navigation */}
        <div className="product-section-nav">
          {sectionLabels.map((section) => (
            <button
              key={section.key}
              className={`section-nav-btn${
                activeSection === section.key ? " active" : ""
              }`}
              onClick={() => setActiveSection(section.key)}
              type="button"
            >
              {section.label}
              <span className="section-count">
                {sectionCounts[section.key as keyof typeof sectionCounts]}
              </span>
            </button>
          ))}
        </div>
        <hr className="product-section-divider" />

        {/* Filter Bar */}
        <div className="product-filter-bar">
          <span className="filter-label recent-label">Recent</span>
          <span className="filter-label stock-label">
            Stock
            <button
              className="stock-sort-btn"
              onClick={() => setSortStockAsc((asc) => !asc)}
              aria-label="Sort by stock"
            >
              {sortStockAsc ? (
                <FaChevronUp style={{ marginLeft: 4 }} />
              ) : (
                <FaChevronDown style={{ marginLeft: 4 }} />
              )}
            </button>
          </span>
        </div>

        {/* Product Cards */}
        <div className="product-list">
          {sortedProducts.length === 0 ? (
            <div
              style={{
                color: "#888",
                padding: "32px 0",
                width: "100%",
                textAlign: "center",
              }}
            >
              {products.length === 0 ? (
                <div>
                  <p>No products yet. Start by adding your first product!</p>
                  <button
                    onClick={() => router.push("/add-product")}
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 2rem',
                      backgroundColor: '#AF7928',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (
                "No products in this section."
              )}
            </div>
          ) : (
            sortedProducts.map((product) => (
              <div className="product-card" key={product._id}>
                <img
                  src={product.images[0] || product.thumbnailUrl || "/default-product.png"}
                  alt={product.name}
                  className="product-card-img"
                />
                <div className="product-card-info">
                  <div className="product-card-name">{product.name}</div>
                  <div className="product-card-desc">{product.description}</div>
                  <div className="product-card-meta">
                    <span className="product-card-category">
                      {product.category}
                    </span>
                    <span className="product-card-price">
                      ₱{product.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="product-card-stock">
                      Stock: {product.stock}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginTop: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Seller View: Management Buttons only */}
                    <>
                      <button
                        onClick={() => router.push(`/add-product?edit=${product._id}`)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product._id, product.name)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <FaTrash /> Delete
                      </button>
                    </>
                  </div>
                  
                  {/* Status Indicators */}
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!product.isActive && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        Draft
                      </span>
                    )}
                    {!product.isAvailable && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        backgroundColor: '#ffc107', 
                        color: 'black', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        Hidden
                      </span>
                    )}
                    {product.stock === 0 && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        backgroundColor: '#e74c3c', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Add Product Button */}
      <div
        className={`product-page-footer-green ${
          hideProductFooter ? "hide" : ""
        }`}
      >
        <button
          className="footer-add-product-btn-gold"
          onClick={() => router.push("/add-product")}
        >
          Add New Product
        </button>
      </div>

      {/* Actual Footer (observer target) */}
      <div ref={footerRef}>
        <Footer />
      </div>
    </>
  );
}


