"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaSearch,
  FaShoppingCart,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaFilter,
  FaStar,
  FaMagic,
} from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductModal from "@/components/ProductModal";
import SearchBar from "@/components/SearchBar";
import { SearchSuggestion, SearchResult } from "@/lib/useSearch";
import { useCartStore } from "@/store/cartStore";
import {
  usePersonalization,
  PersonalizedProduct,
} from "@/lib/usePersonalization";
import "./marketplace.css";

const craftTypes = [
  "Weaving",
  "Woodwork",
  "Pottery",
  "Embroidery",
  "Basketry",
  "Cooking",
  "Textile",
  "Jewelry Making",
  "Leatherwork",
  "Cosmetics",
];

// API Product interface
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
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  isFeatured: boolean;
  craftType: string;
  barangay?: string;
}

// Legacy interface for ProductModal compatibility
interface LegacyProduct {
  img: string;
  hoverImg: string;
  name: string;
  artist: string;
  price: string;
  productId?: string;
  maxStock?: number;
  // Add these new properties
  craftType?: string;
  category?: string;
  barangay?: string;
  soldCount?: number;
}

// Update the FilterState interface
interface FilterState {
  [key: string]: string[] | string; // Add index signature
  craftType: string[];
  category: string[];
  priceRange: string;
  barangay: string[];
}

export default function Marketplace() {
  const [selectedProduct, setSelectedProduct] = useState<LegacyProduct | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("craftType");
  const [filters, setFilters] = useState<FilterState>({
    craftType: [],
    category: [],
    priceRange: "",
    barangay: [],
  });
  const searchRef = useRef<HTMLFormElement>(null);
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedCraftType, setSelectedCraftType] = useState("");

  // Wishlist state
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Product state by category
  const [handicrafts, setHandicrafts] = useState<Product[]>([]);
  const [fashion, setFashion] = useState<Product[]>([]);
  const [home, setHome] = useState<Product[]>([]);
  const [food, setFood] = useState<Product[]>([]);
  const [beauty, setBeauty] = useState<Product[]>([]);

  // Filter modal state
  const [filterModalState, setFilterModalState] = useState<
    "closed" | "entering" | "entered" | "exiting"
  >("closed");

  // Personalization hook for "For You" section
  const {
    products: personalizedProducts,
    loading: personalizedLoading,
    trackProductView,
    trackSearch,
    behavior,
    refresh: refreshPersonalized,
  } = usePersonalization({ limit: 12 });

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    if (savedWishlist) {
      setWishlist(new Set(JSON.parse(savedWishlist)));
    }
  }, []);

  // Fetch products on mount
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Fetch suggestions and auto-search with debouncing
  useEffect(() => {
    const fetchSuggestionsAndSearch = async () => {
      const query = searchQuery.trim();

      // If empty, clear and reload all products
      if (query.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        if (searchActive) {
          setSearchActive(false);
          fetchAllProducts();
        }
        return;
      }

      // Show suggestions for short queries
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        // Fetch suggestions (first 5 for dropdown)
        const suggestionsResponse = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&limit=5`
        );
        const suggestionsData = await suggestionsResponse.json();

        if (suggestionsData.success && suggestionsData.data.length > 0) {
          setSuggestions(suggestionsData.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }

        // Auto-search for all matching products
        setIsSearching(true);
        setSearchActive(true);
        const searchResponse = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&limit=50`
        );
        const searchData = await searchResponse.json();

        if (searchData.success) {
          // Group results by category
          const grouped = searchData.data.reduce(
            (acc: any, product: Product) => {
              if (!acc[product.category]) acc[product.category] = [];
              acc[product.category].push(product);
              return acc;
            },
            {}
          );

          setHandicrafts(grouped.handicrafts || []);
          setFashion(grouped.fashion || []);
          setHome(grouped.home || []);
          setFood(grouped.food || []);
          setBeauty(grouped.beauty || []);
        } else {
          // No results
          setHandicrafts([]);
          setFashion([]);
          setHome([]);
          setFood([]);
          setBeauty([]);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestionsAndSearch, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper function to assign craft types and barangays to products
  const enrichProductsWithMetadata = (products: Product[]): Product[] => {
    const barangays = [
      "Asinan",
      "Banicain",
      "Barretto",
      "East Bajac-Bajac",
      "East Tapinac",
      "Gordon Heights",
      "Kalaklan",
      "Mabayuan",
      "New Cabalan",
      "New Ilalim",
      "New Kababae",
      "New Kalalake",
      "Old Cabalan",
      "Pag-asa",
      "Santa Rita",
      "West Bajac-Bajac",
      "West Tapinac",
    ];

    return products.map((product, index) => {
      // If product doesn't have craftType, assign one from the list
      if (!product.craftType || product.craftType === "Unspecified") {
        product.craftType = craftTypes[index % craftTypes.length];
      }

      // If product doesn't have barangay, assign one from the list
      if (!product.barangay) {
        product.barangay = barangays[index % barangays.length];
      }

      return product;
    });
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch products for all categories
      const categories = ["handicrafts", "fashion", "home", "food", "beauty"];
      const promises = categories.map((category) =>
        fetch(`/api/products?category=${category}&limit=8`).then((res) =>
          res.json()
        )
      );

      const results = await Promise.all(promises);

      // Check for errors
      results.forEach((result, index) => {
        if (!result.success) {
          throw new Error(`Failed to fetch ${categories[index]} products`);
        }
      });

      // Enrich products with craft types and barangays, then set by category
      setHandicrafts(enrichProductsWithMetadata(results[0].data || []));
      setFashion(enrichProductsWithMetadata(results[1].data || []));
      setHome(enrichProductsWithMetadata(results[2].data || []));
      setFood(enrichProductsWithMetadata(results[3].data || []));
      setBeauty(enrichProductsWithMetadata(results[4].data || []));
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Toggle wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(productId)) {
        newWishlist.delete(productId);
      } else {
        newWishlist.add(productId);
      }
      // Save to localStorage
      localStorage.setItem("wishlist", JSON.stringify(Array.from(newWishlist)));
      return newWishlist;
    });
  };

  // Handle search (now mainly for Enter key to close suggestions)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Close suggestions when user presses Enter
    setShowSuggestions(false);

    // The actual search is handled by the useEffect above
    // This just provides immediate feedback for Enter key
  };

  // Clear search and reload all products
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchActive(false);
    setSuggestions([]);
    setShowSuggestions(false);
    fetchAllProducts();
    // Note: Personalized products will refresh automatically when user browses again
  }, []);

  // Handle enhanced search bar results
  const handleEnhancedSearch = useCallback(
    (query: string, results: SearchResult[]) => {
      setSearchActive(true);

      // Track search for personalization
      if (query.trim()) {
        trackSearch(query);
      }

      // Group results by category
      const grouped = results.reduce(
        (acc: Record<string, Product[]>, result: SearchResult) => {
          const product: Product = {
            _id: result._id,
            name: result.name,
            description: result.description,
            category: result.category,
            price: result.price,
            stock: result.stock,
            images: result.images,
            thumbnailUrl: result.thumbnailUrl,
            artistName: result.artistName,
            artistId: "",
            averageRating: result.averageRating,
            totalReviews: result.totalReviews,
            isAvailable: result.isAvailable,
            isFeatured: false,
            craftType: result.craftType || "Unspecified",
            barangay: result.barangay,
          };

          if (!acc[result.category]) acc[result.category] = [];
          acc[result.category].push(product);
          return acc;
        },
        {}
      );

      setHandicrafts(grouped.handicrafts || []);
      setFashion(grouped.fashion || []);
      setHome(grouped.home || []);
      setFood(grouped.food || []);
      setBeauty(grouped.beauty || []);
    },
    [trackSearch]
  );

  // Handle enhanced search suggestion selection
  const handleEnhancedSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.type === "product" && suggestion.productId) {
        // Track product view when selecting from suggestions
        trackProductView(suggestion.productId);

        // Fetch the product and open modal
        fetch(`/api/products/${suggestion.productId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              const product = data.data;
              const categoryMap: { [key: string]: string } = {
                handicrafts: "Handicrafts",
                fashion: "Fashion",
                home: "Home",
                food: "Food",
                beauty: "Beauty & Wellness",
              };
              setSelectedProduct({
                img: product.images?.[0] || product.thumbnailUrl,
                hoverImg:
                  product.images?.[1] ||
                  product.images?.[0] ||
                  product.thumbnailUrl,
                name: product.name,
                artist: product.artistName,
                price: `₱${product.price.toFixed(2)}`,
                productId: product._id,
                maxStock: product.stock,
                craftType: product.craftType || "Unspecified",
                category:
                  categoryMap[product.category?.toLowerCase()] || "General",
                barangay: product.barangay || "Unspecified",
                soldCount: 0,
              });
            }
          })
          .catch((err) => console.error("Error fetching product:", err));
      }
    },
    [trackProductView]
  );

  // Handle suggestion click - Open product modal
  const handleSuggestionClick = (product: Product) => {
    setShowSuggestions(false);
    setSuggestions([]);
    // Open the product modal directly
    handleProductClick(product);
  };

  // Convert API product to legacy format for ProductModal
  const formatCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      handicrafts: "Handicrafts",
      fashion: "Fashion",
      home: "Home",
      food: "Food",
      beauty: "Beauty & Wellness",
    };
    return categoryMap[category.toLowerCase()] || "General";
  };

  const convertToLegacyProduct = (product: Product): LegacyProduct => ({
    img: product.images[0] || product.thumbnailUrl,
    hoverImg: product.images[1] || product.images[0] || product.thumbnailUrl,
    name: product.name,
    artist: product.artistName,
    price: `₱${product.price.toFixed(2)}`,
    productId: product._id,
    maxStock: product.stock,
    // Add these new properties with proper formatting
    craftType: product.craftType || "Unspecified",
    category: formatCategory(product.category),
    barangay: product.barangay || "Unspecified",
    soldCount: 0, // Default to 0 since the API doesn't provide sold count yet
  });

  const handleProductClick = (product: Product) => {
    // Track product view for personalization
    trackProductView(product._id, product.category, product.craftType);
    setSelectedProduct(convertToLegacyProduct(product));
  };

  // Handle personalized product click
  const handlePersonalizedProductClick = (product: PersonalizedProduct) => {
    trackProductView(product._id, product.category, product.craftType);
    setSelectedProduct({
      img: product.images[0] || product.thumbnailUrl,
      hoverImg: product.images[1] || product.images[0] || product.thumbnailUrl,
      name: product.name,
      artist: product.artistName,
      price: `₱${product.price.toFixed(2)}`,
      productId: product._id,
      maxStock: product.stock,
      craftType: product.craftType || "Unspecified",
      category: formatCategory(product.category),
      barangay: product.barangay || "Unspecified",
      soldCount: 0,
    });
  };

  // Helper function to match price range
  const matchesPriceRange = (price: number, range: string): boolean => {
    if (!range) return true; // If no range selected, include all

    switch (range) {
      case "Under ₱500":
        return price < 500;
      case "₱500 - ₱1,000":
        return price >= 500 && price <= 1000;
      case "₱1,000 - ₱2,000":
        return price > 1000 && price <= 2000;
      case "₱2,000 - ₱5,000":
        return price > 2000 && price <= 5000;
      case "Over ₱5,000":
        return price > 5000;
      default:
        return true;
    }
  };

  // Apply all filters to products
  const applyFilters = () => {
    const filterProducts = (products: Product[]): Product[] => {
      return products.filter((product) => {
        // Check craft type filter
        if (
          filters.craftType.length > 0 &&
          !filters.craftType.includes(product.craftType)
        ) {
          return false;
        }

        // Check category filter - normalize category name to match database values
        if (filters.category.length > 0) {
          const categoryLower = product.category.toLowerCase();
          const categoryMatches = filters.category.some((cat) => {
            const catLower = cat.toLowerCase();
            // Handle special case for "Beauty & Wellness"
            if (catLower === "beauty & wellness") {
              return categoryLower === "beauty";
            }
            return catLower === categoryLower;
          });
          if (!categoryMatches) {
            return false;
          }
        }

        // Check price range filter
        if (
          filters.priceRange &&
          !matchesPriceRange(product.price, filters.priceRange)
        ) {
          return false;
        }

        // Check barangay filter
        if (
          filters.barangay.length > 0 &&
          (!product.barangay || !filters.barangay.includes(product.barangay))
        ) {
          return false;
        }

        return true;
      });
    };

    // Apply filters to all category arrays
    setHandicrafts(filterProducts(handicrafts));
    setFashion(filterProducts(fashion));
    setHome(filterProducts(home));
    setFood(filterProducts(food));
    setBeauty(filterProducts(beauty));
  };

  // Loading state with brown spinner
  if (
    loading &&
    handicrafts.length === 0 &&
    fashion.length === 0 &&
    home.length === 0 &&
    food.length === 0 &&
    beauty.length === 0
  ) {
    return (
      <div className="marketplace-page">
        <Navbar />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "70vh",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <i
              className="fas fa-spinner fa-spin"
              style={{ fontSize: "48px", color: "#AF7928" }}
            ></i>
            <p
              style={{
                marginTop: "20px",
                color: "#2e3f36",
                fontSize: "18px",
                fontWeight: "500",
              }}
            >
              Loading marketplace...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="marketplace-page">
        <Navbar />
        <div className="search-bar-container">
          <div className="search-wrapper">
            <SearchBar
              placeholder="Search for products, artisans, or categories..."
              onSearch={handleEnhancedSearch}
              onSuggestionSelect={handleEnhancedSuggestionSelect}
              onClear={handleClearSearch}
              className="marketplace-search"
            />
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div style={{ color: "#e74c3c", fontSize: "1.2rem" }}>
            <i
              className="fas fa-exclamation-circle"
              style={{ fontSize: "3rem", marginBottom: "1rem" }}
            ></i>
            <p>{error}</p>
            <button
              onClick={fetchAllProducts}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 2rem",
                backgroundColor: "#AF7928",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const FilterModal = () => {
    const categories = [
      "Handicrafts",
      "Fashion",
      "Home",
      "Beauty & Wellness",
      "Food",
    ];
    const priceRanges = [
      "Under ₱500",
      "₱500 - ₱1,000",
      "₱1,000 - ₱2,000",
      "₱2,000 - ₱5,000",
      "Over ₱5,000",
    ];

    const handleFilter = (type: keyof FilterState, value: string) => {
      setFilters((prev) => {
        const currentValue = prev[type];

        // Handle array types (craftType, category, barangay)
        if (Array.isArray(currentValue)) {
          return {
            ...prev,
            [type]: currentValue.includes(value)
              ? currentValue.filter((item) => item !== value)
              : [...currentValue, value],
          };
        }

        // Handle string type (priceRange)
        return {
          ...prev,
          [type]: value,
        };
      });
    };

    return (
      <div className={`filter-modal ${filterModalState}`}>
        <div className="filter-nav">
          <div
            className={`filter-nav-item ${
              activeFilterTab === "craftType" ? "active" : ""
            }`}
            onClick={() => setActiveFilterTab("craftType")}
          >
            Craft Type
          </div>
          <div
            className={`filter-nav-item ${
              activeFilterTab === "category" ? "active" : ""
            }`}
            onClick={() => setActiveFilterTab("category")}
          >
            By Category
          </div>
          <div
            className={`filter-nav-item ${
              activeFilterTab === "priceRange" ? "active" : ""
            }`}
            onClick={() => setActiveFilterTab("priceRange")}
          >
            Price Range
          </div>
          <div
            className={`filter-nav-item ${
              activeFilterTab === "barangay" ? "active" : ""
            }`}
            onClick={() => setActiveFilterTab("barangay")}
          >
            By Barangay
          </div>
        </div>
        <div className="filter-content">
          {activeFilterTab === "craftType" && (
            <div className="filter-section">
              <h3 className="filter-header">Select Craft Types</h3>
              <div className="filter-options">
                {craftTypes.map((type) => (
                  <div
                    key={type}
                    className={`filter-option ${
                      filters.craftType.includes(type) ? "selected" : ""
                    }`}
                    onClick={() => handleFilter("craftType", type)}
                  >
                    {type}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeFilterTab === "category" && (
            <div className="filter-section">
              <h3 className="filter-header">Select Categories</h3>
              <div className="filter-options">
                {categories.map((category) => (
                  <div
                    key={category}
                    className={`filter-option ${
                      filters.category.includes(category) ? "selected" : ""
                    }`}
                    onClick={() => handleFilter("category", category)}
                  >
                    {category}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeFilterTab === "priceRange" && (
            <div className="filter-section">
              <h3 className="filter-header">Select Price Range</h3>
              <div className="filter-options">
                {priceRanges.map((range) => (
                  <div
                    key={range}
                    className={`filter-option ${
                      filters.priceRange === range ? "selected" : ""
                    }`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, priceRange: range }))
                    }
                  >
                    {range}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeFilterTab === "barangay" && (
            <div className="filter-section">
              <h3 className="filter-header">Olongapo Barangays</h3>
              <div className="filter-options">
                {[
                  "Asinan",
                  "Banicain",
                  "Barretto",
                  "East Bajac-Bajac",
                  "East Tapinac",
                  "Gordon Heights",
                  "Kalaklan",
                  "Mabayuan",
                  "New Cabalan",
                  "New Ilalim",
                  "New Kababae",
                  "New Kalalake",
                  "Old Cabalan",
                  "Pag-asa",
                  "Santa Rita",
                  "West Bajac-Bajac",
                  "West Tapinac",
                ].map((barangay) => (
                  <div
                    key={barangay}
                    className={`filter-option ${
                      filters.barangay.includes(barangay) ? "selected" : ""
                    }`}
                    onClick={() => handleFilter("barangay", barangay)}
                  >
                    {barangay}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="filter-actions">
            <button
              className="filter-button-reset"
              onClick={() => {
                setFilters({
                  craftType: [],
                  category: [],
                  priceRange: "",
                  barangay: [],
                });
                // Reload all products when reset
                fetchAllProducts();
              }}
            >
              Reset
            </button>
            <button
              className="filter-button-apply"
              onClick={() => {
                // Apply filters before closing modal
                applyFilters();
                setFilterModalState("exiting");
                setTimeout(() => {
                  setShowFilters(false);
                  setFilterModalState("closed");
                }, 300); // Match this with CSS transition duration
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Update the filter button click handler
  const handleFilterClick = () => {
    if (showFilters) {
      // Closing
      setFilterModalState("exiting");
      setTimeout(() => {
        setShowFilters(false);
        setFilterModalState("closed");
      }, 300); // Match this with CSS transition duration
    } else {
      // Opening
      setShowFilters(true);
      requestAnimationFrame(() => {
        setFilterModalState("entering");
        requestAnimationFrame(() => {
          setFilterModalState("entered");
        });
      });
    }
  };

  // Add this function near your other helper functions
  const hasActiveFilters = () => {
    return (
      filters.craftType.length > 0 ||
      filters.category.length > 0 ||
      filters.priceRange !== "" ||
      filters.barangay.length > 0
    );
  };

  return (
    <div className="marketplace-page">
      <Navbar />
      <div className="search-bar-container">
        <div className="search-wrapper">
          <SearchBar
            placeholder="Search for products, artisans, or categories..."
            onSearch={handleEnhancedSearch}
            onSuggestionSelect={handleEnhancedSuggestionSelect}
            onClear={handleClearSearch}
            className="marketplace-search"
          />
          <button
            className={`filter-button ${
              hasActiveFilters() ? "has-active-filters" : ""
            }`}
            onClick={handleFilterClick}
          >
            <FaFilter />
          </button>
          {showFilters && <FilterModal />}
        </div>
      </div>

      {/* Personalized "For You" Section - Only show when not searching */}
      {!searchActive && (
        <div className="category-section personalized-section">
          <PersonalizedSection
            products={personalizedProducts}
            onProductClick={handlePersonalizedProductClick}
            isLoading={personalizedLoading}
            hasUserHistory={
              behavior.recentViews.length > 0 || behavior.interests.length > 0
            }
          />
        </div>
      )}

      {handicrafts.length > 0 && (
        <div className="category-section">
          <Section
            title="HANDICRAFTS"
            products={handicrafts}
            onProductClick={handleProductClick}
          />
        </div>
      )}

      {fashion.length > 0 && (
        <div className="category-section">
          <Section
            title="FASHION"
            products={fashion}
            onProductClick={handleProductClick}
          />
        </div>
      )}

      {home.length > 0 && (
        <div className="category-section">
          <Section
            title="HOME"
            products={home}
            onProductClick={handleProductClick}
          />
        </div>
      )}

      {food.length > 0 && (
        <div className="category-section">
          <Section
            title="FOOD"
            products={food}
            onProductClick={handleProductClick}
          />
        </div>
      )}

      {beauty.length > 0 && (
        <div className="category-section">
          <Section
            title="BEAUTY & WELLNESS"
            products={beauty}
            onProductClick={handleProductClick}
          />
        </div>
      )}

      {/* Search results indicator */}
      {searchActive && !isSearching && (
        <div
          style={{
            textAlign: "center",
            padding: "1rem 0",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            margin: "0 2rem 1rem",
          }}
        >
          <p style={{ color: "#666", fontSize: "0.95rem", margin: 0 }}>
            {handicrafts.length +
              fashion.length +
              home.length +
              food.length +
              beauty.length >
            0 ? (
              <>
                Showing{" "}
                {handicrafts.length +
                  fashion.length +
                  home.length +
                  food.length +
                  beauty.length}{" "}
                result(s) for "<b>{searchQuery}</b>"
              </>
            ) : null}
          </p>
        </div>
      )}

      {/* No results message */}
      {!loading &&
        !isSearching &&
        handicrafts.length === 0 &&
        fashion.length === 0 &&
        home.length === 0 &&
        food.length === 0 &&
        beauty.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <i
              className="fas fa-search"
              style={{
                fontSize: "3rem",
                color: "#999",
                marginBottom: "1rem",
                display: "block",
              }}
            ></i>
            <p
              style={{
                fontSize: "1.2rem",
                color: "#666",
                marginBottom: "0.5rem",
              }}
            >
              {searchActive
                ? `No products found for "${searchQuery}"`
                : "No products available"}
            </p>
            {searchActive && (
              <>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#999",
                    marginBottom: "1.5rem",
                  }}
                >
                  Try searching with different keywords or browse all products
                </p>
                <button
                  onClick={handleClearSearch}
                  style={{
                    padding: "0.75rem 2rem",
                    backgroundColor: "#AF7928",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    transition: "background-color 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#8D6020")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#AF7928")
                  }
                >
                  <i
                    className="fas fa-redo"
                    style={{ marginRight: "0.5rem" }}
                  ></i>
                  Clear Search & Browse All
                </button>
              </>
            )}
          </div>
        )}

      <Footer />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onProductChange={(newProduct) => {
            setSelectedProduct(newProduct);
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  products,
  onProductClick,
}: {
  title: string;
  products: Product[];
  onProductClick: (product: Product) => void;
}) {
  const { addItem } = useCartStore();
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const [successProduct, setSuccessProduct] = useState<string | null>(null);
  const [errorProduct, setErrorProduct] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (!product.isAvailable || product.stock === 0) return;
    if (addingProduct === product._id) return; // Prevent double-click

    try {
      setAddingProduct(product._id);

      await addItem(product._id, 1);

      setAddingProduct(null);
      setSuccessProduct(product._id);

      setTimeout(() => {
        setSuccessProduct(null);
      }, 1000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setAddingProduct(null);
      setErrorProduct(product._id);

      setTimeout(() => {
        setErrorProduct(null);
      }, 2000);
    }
  };

  return (
    <>
      <div className="section-header">
        <div className="section-title">{title}</div>
        <div className="section-subtitle">
          Discover unique {title.toLowerCase()} from local artisans
        </div>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <div
            className={`product-card ${
              activeCardId === product._id ? "active" : ""
            }`}
            key={product._id}
            onClick={() => setActiveCardId(product._id)}
            onMouseLeave={() => setActiveCardId(null)}
          >
            <div className="image-container">
              <img
                src={product.images[0] || product.thumbnailUrl}
                alt={product.name}
                className="product-image default"
              />
              <img
                src={
                  product.images[1] || product.images[0] || product.thumbnailUrl
                }
                alt={product.name}
                className="product-image hover"
              />

              {/* Product Labels Container - Right side */}
              <div className="product-labels">
                {product.isFeatured && (
                  <span className="product-label featured">Featured</span>
                )}
              </div>

              {/* Add to cart icon */}
              <button
                className={`add-to-cart-icon ${
                  addingProduct === product._id ? "loading" : ""
                } ${successProduct === product._id ? "success" : ""} ${
                  errorProduct === product._id ? "error" : ""
                }`}
                onClick={(e) => handleAddToCart(product, e)}
                disabled={
                  !product.isAvailable ||
                  product.stock === 0 ||
                  addingProduct === product._id
                }
                aria-label="Add to cart"
              >
                {addingProduct === product._id ? (
                  <FaSpinner className="loading-spinner" />
                ) : successProduct === product._id ? (
                  <FaCheck />
                ) : errorProduct === product._id ? (
                  <FaTimes />
                ) : (
                  <FaShoppingCart />
                )}
              </button>

              {/* Out of stock overlay */}
              {!product.isAvailable || product.stock === 0 ? (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                  }}
                >
                  OUT OF STOCK
                </div>
              ) : (
                <button
                  className="view-button"
                  onClick={() => onProductClick(product)}
                >
                  View
                </button>
              )}
            </div>
            <div className="market-product-info">
              <div className="market-product-info-top">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-artist">{product.artistName}</p>
              </div>
              <div className="product-info-bottom">
                <div className="product-price-wrapper">
                  <span className="product-price">
                    ₱{product.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Personalized "For You" Section Component
function PersonalizedSection({
  products,
  onProductClick,
  isLoading,
  hasUserHistory,
}: {
  products: PersonalizedProduct[];
  onProductClick: (product: PersonalizedProduct) => void;
  isLoading: boolean;
  hasUserHistory: boolean;
}) {
  const { addItem } = useCartStore();
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const [successProduct, setSuccessProduct] = useState<string | null>(null);
  const [errorProduct, setErrorProduct] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const handleAddToCart = async (
    product: PersonalizedProduct,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!product.isAvailable || product.stock === 0) return;
    if (addingProduct === product._id) return;

    try {
      setAddingProduct(product._id);
      await addItem(product._id, 1);
      setAddingProduct(null);
      setSuccessProduct(product._id);
      setTimeout(() => setSuccessProduct(null), 1000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setAddingProduct(null);
      setErrorProduct(product._id);
      setTimeout(() => setErrorProduct(null), 2000);
    }
  };

  // Don't render section if no products and not loading
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <>
      <div className="section-header personalized-header">
        <div className="section-title">
          <FaMagic className="personalized-icon" />
          {hasUserHistory ? "RECOMMENDED FOR YOU" : "DISCOVER PRODUCTS"}
        </div>
        <div className="section-subtitle">
          {hasUserHistory
            ? "Based on your browsing history and interests"
            : "Explore our curated selection of local artisan products"}
        </div>
      </div>

      {isLoading && products.length === 0 ? (
        <div className="product-grid personalized-grid">
          {/* Skeleton loading cards */}
          {[1, 2, 3, 4].map((i) => (
            <div
              className="product-card personalized-card skeleton-card"
              key={`skeleton-${i}`}
            >
              <div className="image-container skeleton-image"></div>
              <div className="product-info">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-artist"></div>
                <div className="skeleton-line skeleton-price"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="product-grid personalized-grid">
          {products.map((product) => (
            <div
              className={`product-card personalized-card ${
                activeCardId === product._id ? "active" : ""
              }`}
              key={product._id}
              onClick={() => setActiveCardId(product._id)}
              onMouseLeave={() => setActiveCardId(null)}
            >
              <div className="image-container">
                <img
                  src={product.images[0] || product.thumbnailUrl}
                  alt={product.name}
                  className="product-image default"
                />
                <img
                  src={
                    product.images[1] ||
                    product.images[0] ||
                    product.thumbnailUrl
                  }
                  alt={product.name}
                  className="product-image hover"
                />

                {/* Product Labels Container - Right side */}
                <div className="product-labels">
                  {product.recommendationReason && (
                    <span className="recommendation-badge">
                      {product.recommendationReason}
                    </span>
                  )}
                  {product.averageRating >= 4.0 &&
                    product.totalReviews >= 3 && (
                      <span className="product-label trending">
                        <FaStar
                          style={{ marginRight: "3px", fontSize: "0.55rem" }}
                        />
                        {product.averageRating.toFixed(1)}
                      </span>
                    )}
                </div>

                {/* Add to cart icon */}
                <button
                  className={`add-to-cart-icon ${
                    addingProduct === product._id ? "loading" : ""
                  } ${successProduct === product._id ? "success" : ""} ${
                    errorProduct === product._id ? "error" : ""
                  }`}
                  onClick={(e) => handleAddToCart(product, e)}
                  disabled={
                    !product.isAvailable ||
                    product.stock === 0 ||
                    addingProduct === product._id
                  }
                  aria-label="Add to cart"
                >
                  {addingProduct === product._id ? (
                    <FaSpinner className="loading-spinner" />
                  ) : successProduct === product._id ? (
                    <FaCheck />
                  ) : errorProduct === product._id ? (
                    <FaTimes />
                  ) : (
                    <FaShoppingCart />
                  )}
                </button>

                {/* Out of stock overlay */}
                {!product.isAvailable || product.stock === 0 ? (
                  <div className="out-of-stock-overlay">OUT OF STOCK</div>
                ) : (
                  <button
                    className="view-button"
                    onClick={() => onProductClick(product)}
                  >
                    View
                  </button>
                )}
              </div>
              <div className="market-product-info">
                <div className="market-product-info-top">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-artist">{product.artistName}</p>
                </div>
                <div className="product-info-bottom">
                  <div className="product-price-wrapper">
                    <span className="product-price">
                      ₱{product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
