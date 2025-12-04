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
  FaTimes,
  FaFilter,
  FaSort,
  FaSearch,
  FaCalendarAlt,
  FaTag,
  FaCubes,
  FaStar
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
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);
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

  // Get unique categories from products
  const categories = [...new Set(products.map(p => p.category))];

  // Filter products by section, search, and category
  const filteredProducts = products.filter((p) => {
    // Section filter
    let matchesSection = false;
    if (activeSection === "live") matchesSection = p.isActive && p.isAvailable && p.stock > 0;
    else if (activeSection === "soldout") matchesSection = p.isActive && p.isAvailable && p.stock === 0;
    else if (activeSection === "draft") matchesSection = !p.isActive;
    else if (activeSection === "inactive") matchesSection = p.isActive && !p.isAvailable;
    else matchesSection = true;
    
    if (!matchesSection) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (categoryFilter !== "all" && p.category !== categoryFilter) {
      return false;
    }
    
    return true;
  });

  // Sort products based on selected sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "price-high":
        return b.price - a.price;
      case "price-low":
        return a.price - b.price;
      case "stock-high":
        return b.stock - a.stock;
      case "stock-low":
        return a.stock - b.stock;
      case "name-az":
        return a.name.localeCompare(b.name);
      case "name-za":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

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
          {/* Search Input */}
          <div className="filter-search-container">
            <FaSearch className="filter-search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-search-input"
            />
          </div>
          
          {/* Category Filter */}
          <div className="filter-select-container">
            <FaTag className="filter-select-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort Options */}
          <div className="filter-select-container">
            <FaSort className="filter-select-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="stock-high">Stock: High to Low</option>
              <option value="stock-low">Stock: Low to High</option>
              <option value="name-az">Name: A-Z</option>
              <option value="name-za">Name: Z-A</option>
            </select>
          </div>
          
          {/* Results count */}
          <span className="filter-results-count">
            {sortedProducts.length} of {products.length} products
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
              <div className="product-card-enhanced" key={product._id}>
                {/* Product Image with Status Badge */}
                <div className="product-card-image-container">
                  <img
                    src={product.images[0] || product.thumbnailUrl || "/default-product.png"}
                    alt={product.name}
                    className="product-card-img-enhanced"
                  />
                  {/* Status Badge on Image */}
                  <div className="product-status-badge-container">
                    {!product.isActive && (
                      <span className="product-status-badge draft">Draft</span>
                    )}
                    {product.isActive && !product.isAvailable && (
                      <span className="product-status-badge inactive">Inactive</span>
                    )}
                    {product.isActive && product.isAvailable && product.stock === 0 && (
                      <span className="product-status-badge soldout">Sold Out</span>
                    )}
                    {product.isActive && product.isAvailable && product.stock > 0 && (
                      <span className="product-status-badge live">Live</span>
                    )}
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="product-card-info-enhanced">
                  {/* Header: Name and Category */}
                  <div className="product-card-header">
                    <h3 className="product-card-name-enhanced">{product.name}</h3>
                    <span className="product-card-category-badge">
                      {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className="product-card-desc-enhanced">
                    {product.description.length > 80 
                      ? product.description.substring(0, 80) + '...' 
                      : product.description}
                  </p>
                  
                  {/* Price and Stock Row */}
                  <div className="product-card-price-stock-row">
                    <div className="product-card-price-container">
                      <span className="product-card-price-label">Price</span>
                      <span className="product-card-price-value">
                        ₱{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="product-card-stock-container">
                      <span className="product-card-stock-label">Stock</span>
                      <span className={`product-card-stock-value ${product.stock === 0 ? 'out-of-stock' : product.stock <= 5 ? 'low-stock' : ''}`}>
                        <FaCubes style={{ marginRight: '4px', fontSize: '12px' }} />
                        {product.stock} units
                      </span>
                    </div>
                  </div>
                  
                  {/* Stats Row: Views, Rating */}
                  <div className="product-card-stats-row">
                    <div className="product-stat-item">
                      <FaEye className="stat-icon" />
                      <span>{product.viewCount || 0} views</span>
                    </div>
                    <div className="product-stat-item">
                      <FaStar className="stat-icon star" />
                      <span>{product.averageRating?.toFixed(1) || '0.0'} ({product.totalReviews || 0})</span>
                    </div>
                  </div>
                  
                  {/* Dates Row */}
                  <div className="product-card-dates-row">
                    <div className="product-date-item">
                      <FaCalendarAlt className="date-icon" />
                      <span>Added: {new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {product.updatedAt !== product.createdAt && (
                      <div className="product-date-item">
                        <span>Updated: {new Date(product.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="product-card-actions">
                    <button
                      onClick={() => router.push(`/add-product?edit=${product._id}`)}
                      className="product-action-btn edit-btn"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product._id, product.name)}
                      className="product-action-btn delete-btn"
                    >
                      <FaTrash /> Delete
                    </button>
                    <button
                      onClick={() => window.open(`/marketplace?product=${product._id}`, '_blank')}
                      className="product-action-btn view-btn"
                    >
                      <FaEye /> Preview
                    </button>
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


