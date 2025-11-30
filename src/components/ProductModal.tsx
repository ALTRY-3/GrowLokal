"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  FaTimes,
  FaStar,
  FaHeart,
  FaRegHeart,
  FaChevronDown,
} from "react-icons/fa";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useWishlist } from "@/lib/useWishlist";

interface Product {
  img: string;
  hoverImg: string;
  name: string;
  artist: string;
  price: string;
  productId?: string;
  maxStock?: number;
  craftType?: string;
  category?: string;
  barangay?: string;
  soldCount?: number;
}

// Interface for fetched reviews
interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Add new interface for recommended products
interface RecommendedProduct {
  _id: string;
  name: string;
  price: number;
  images: string[];
  thumbnailUrl: string;
  category: string;
  craftType: string;
  barangay?: string;
}

const dummyRecommendations = [
  {
    _id: "1",
    name: "Handwoven Buri Bag",
    price: 799,
    images: ["/box7.png"],
    thumbnailUrl: "/box7.png",
    category: "Handicrafts",
    craftType: "Weaving",
    barangay: "Asinan",
  },
  {
    _id: "2",
    name: "Embroidered Shawl",
    price: 699,
    images: ["/fashion5.png"],
    thumbnailUrl: "/fashion5.png",
    category: "Fashion",
    craftType: "Embroidery",
    barangay: "Banicain",
  },
  {
    _id: "3",
    name: "Wooden Kuksa Mug",
    price: 449,
    images: ["/home6.png"],
    thumbnailUrl: "/home6.png",
    category: "Home",
    craftType: "Woodwork",
    barangay: "Barretto",
  },
  {
    _id: "4",
    name: "Pure Honey",
    price: 369,
    images: ["/food6.png"],
    thumbnailUrl: "/food6.png",
    category: "Food",
    craftType: "Cooking",
    barangay: "East Bajac-Bajac",
  },
];

export default function ProductModal({
  product,
  onClose,
  onProductChange,
}: {
  product: Product;
  onClose: () => void;
  onProductChange: (product: Product) => void;
}) {
  const [mainImage, setMainImage] = useState(product.img);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState("");
  
  // Review state
  const [reviewList, setReviewList] = useState<ProductReview[]>([]);
  const [reviewAverage, setReviewAverage] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);

  // Description should be closed when modal opens
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  const [showAllReviews, setShowAllReviews] = useState(false);

  const modalBoxRef = useRef<HTMLDivElement>(null);

  // Use the wishlist hook
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  // Local state to track wishlist status for this modal instance
  const [localWishlistState, setLocalWishlistState] = useState<boolean | null>(null);
  
  // Initialize local wishlist state when modal opens
  useEffect(() => {
    if (product.productId) {
      setLocalWishlistState(isInWishlist(product.productId));
    }
  }, [product.productId, isInWishlist]);
  
  // Prevent rapid clicking
  const [isWishlistUpdating, setIsWishlistUpdating] = useState(false);
  
  const handleWishlistToggle = async (productId: string) => {
    if (isWishlistUpdating) return; // Prevent double clicks
    
    setIsWishlistUpdating(true);
    
    // Optimistically update local state immediately
    setLocalWishlistState(!localWishlistState);
    
    try {
      await toggleWishlist(productId);
      // Update local state with the actual result after toggle
      setLocalWishlistState(isInWishlist(productId));
    } catch (error) {
      // Revert optimistic update on error
      setLocalWishlistState(!localWishlistState);
    } finally {
      // Small delay to prevent rapid clicking
      setTimeout(() => setIsWishlistUpdating(false), 300);
    }
  };

  // Use local state if available, otherwise fall back to hook state
  const currentWishlistState = localWishlistState !== null ? localWishlistState : (product.productId ? isInWishlist(product.productId) : false);

  // Check if product has a valid MongoDB ObjectId
  const hasPersistedProductId = useMemo(() => {
    if (!product?.productId) return false;
    return /^[a-fA-F0-9]{24}$/.test(product.productId);
  }, [product?.productId]);

  // Review summary text
  const reviewSummaryText = useMemo(() => {
    if (!hasPersistedProductId) {
      return "Reviews available for marketplace products";
    }
    if (reviewsLoading) return "Loading reviews...";
    if (reviewCount === 0) return "Be the first to review this product";
    if (reviewCount === 1) return "1 review";
    return `${reviewCount} reviews`;
  }, [hasPersistedProductId, reviewCount, reviewsLoading]);

  // Fetch reviews when product changes
  useEffect(() => {
    if (!hasPersistedProductId || !product.productId) {
      setReviewList([]);
      setReviewAverage(null);
      setReviewCount(0);
      setReviewsError(null);
      setCanReview(false);
      return;
    }

    let isCancelled = false;

    const fetchReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const response = await fetch(`/api/products/${product.productId}/reviews`);
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to load reviews");
        }

        if (!isCancelled) {
          const reviews: ProductReview[] = Array.isArray(payload?.data?.reviews)
            ? payload.data.reviews
            : [];
          setReviewList(reviews);
          setReviewAverage(
            typeof payload?.data?.averageRating === "number"
              ? payload.data.averageRating
              : null
          );
          setReviewCount(
            typeof payload?.data?.totalReviews === "number"
              ? payload.data.totalReviews
              : reviews.length
          );
          setCanReview(payload?.data?.canReview === true);
        }
      } catch (error) {
        if (!isCancelled) {
          setReviewsError(
            error instanceof Error ? error.message : "Failed to load reviews"
          );
          setCanReview(false);
        }
      } finally {
        if (!isCancelled) {
          setReviewsLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      isCancelled = true;
    };
  }, [hasPersistedProductId, product.productId]);

  // Reset review form when product changes
  useEffect(() => {
    setShowAllReviews(false);
    setRating(0);
    setHover(0);
    setReviewText("");
  }, [product.productId]);

  // Helper to get reviewer avatar
  const getReviewerAvatar = (name: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "Reviewer")}`;

  // Close description on modal open
  useEffect(() => {
    setIsDescriptionOpen(false);
  }, [product]);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalBoxRef.current &&
        !modalBoxRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const { addItem } = useCartStore();

  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>(
    []
  );

  const handleRating = (rate: number) => {
    setRating(rate);
  };

  const handleAddToCart = async () => {
    if (!product.productId) {
      alert("Cannot add this product to cart");
      return;
    }

    setAdding(true);
    try {
      await addItem(product.productId, quantity);
      setAddSuccess(true);

      // Show success for 2 seconds then reset
      setTimeout(() => {
        setAddSuccess(false);
        setQuantity(1); // Reset quantity after success
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add to cart";
      alert(message);
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!hasPersistedProductId || !product.productId) {
      alert("Please open a marketplace product to submit a review.");
      return;
    }

    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 10) {
      alert("Please write a review (at least 10 characters)");
      return;
    }

    setIsReviewSubmitting(true);

    try {
      const response = await fetch(`/api/products/${product.productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: reviewText.trim() }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to submit review");
      }

      // Add new review to list
      if (payload?.data) {
        const newReview: ProductReview = {
          id: payload.data.id,
          userName: payload.data.userName,
          rating: payload.data.rating,
          comment: payload.data.comment,
          createdAt: payload.data.createdAt,
        };
        setReviewList((prev) => {
          const filtered = prev.filter((r) => r.id !== newReview.id);
          return [newReview, ...filtered];
        });
      }

      if (typeof payload?.averageRating === "number") {
        setReviewAverage(payload.averageRating);
      }
      if (typeof payload?.totalReviews === "number") {
        setReviewCount(payload.totalReviews);
      }

      setRating(0);
      setHover(0);
      setReviewText("");
      alert(payload?.message || "Review submitted successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const maxStock = product.maxStock || 99;

  // Add effect to fetch recommendations
  useEffect(() => {
    // Using dummy data instead of API call
    setRecommendations(dummyRecommendations);
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-box" ref={modalBoxRef}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="marketplace-modal-content">
          <div className="modal-left">
            <div className="modal-thumbs">
              <img
                src={product.img}
                alt={product.name}
                className={mainImage === product.img ? "active" : ""}
                onClick={() => setMainImage(product.img)}
              />
              <img
                src={product.hoverImg}
                alt={product.name}
                className={mainImage === product.hoverImg ? "active" : ""}
                onClick={() => setMainImage(product.hoverImg)}
              />
            </div>
            <div className="modal-main">
              <img src={mainImage} alt={product.name} />
            </div>
          </div>

          <div className="modal-right">
            <h3 className="modal-product-name">{product.name}</h3>

            <div className="modal-tags">
              {product.craftType && (
                <span className="modal-tag craft-type">
                  {product.craftType}
                </span>
              )}
              {product.category && (
                <span className="modal-tag category">{product.category}</span>
              )}
            </div>

            <div className="modal-price-row">
              <span className="modal-price">{product.price}</span>
              <div className="modal-meta">
                {product.soldCount !== undefined && (
                  <span className="sold-count">{product.soldCount} sold</span>
                )}
                {product.productId && (
                  <button
                    className="modal-wishlist-btn"
                    onClick={() => handleWishlistToggle(product.productId!)}
                    disabled={isWishlistUpdating}
                    aria-label={
                      currentWishlistState ? "Remove from wishlist" : "Add to wishlist"
                    }
                    style={{
                      opacity: isWishlistUpdating ? 0.6 : 1,
                      cursor: isWishlistUpdating ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {currentWishlistState ? (
                      <FaHeart className="heart-icon active" />
                    ) : (
                      <FaRegHeart className="heart-icon" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="modal-divider"></div>

            <div className="modal-quantity-container">
              <p className="modal-quantity-label">Quantity:</p>
              <div className="modal-quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={quantity >= maxStock}
                >
                  +
                </button>
              </div>
            </div>

            <div className="modal-action-buttons">
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={adding || !product.productId || addSuccess}
                style={{
                  backgroundColor: addSuccess ? "#10b981" : undefined,
                  cursor:
                    adding || !product.productId ? "not-allowed" : "pointer",
                  opacity: adding || !product.productId ? 0.6 : 1,
                }}
              >
                {adding ? "Adding..." : addSuccess ? "✓ Added!" : "Add to Cart"}
              </button>
            </div>

            {canReview && (
              <div className="modal-review-section">
                <h3 className="modal-review-title">REVIEW THIS PRODUCT:</h3>
                <div className="reviews-section">
                  <div className="stars">
                    {[...Array(5)].map((_, index) => {
                      const ratingValue = index + 1;
                      return (
                        <FaStar
                          key={index}
                          size={20}
                          color={
                            ratingValue <= (hover || rating)
                              ? "#ffc107"
                              : "#e4e5e9"
                          }
                          style={{ cursor: "pointer" }}
                          onClick={() => handleRating(ratingValue)}
                          onMouseEnter={() => setHover(ratingValue)}
                          onMouseLeave={() => setHover(rating)}
                        />
                      );
                    })}
                  </div>
                  <textarea
                    className="review-text-input"
                    placeholder="Write your review here..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                  />
                  <div className="reviews-footer">
                    <p className="reviews-count">{reviewSummaryText}</p>
                    {reviewsError && (
                      <p className="reviews-error" style={{ color: "#dc2626", fontSize: "0.85rem" }}>
                        {reviewsError}
                      </p>
                    )}
                    <button
                      className="submit-review-btn"
                      onClick={handleSubmitReview}
                      disabled={
                        isReviewSubmitting ||
                        rating === 0 ||
                        !reviewText.trim() ||
                        reviewText.trim().length < 10 ||
                        !hasPersistedProductId
                      }
                    >
                      {isReviewSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-bottom-section">
          <div className="modal-section-gap"></div>

          {/* BOTTOM: PRODUCT DESCRIPTION */}
          <div className="modal-about">
            <div className="product-description-section">
              <div
                className="description-header"
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              >
                <h3 className="description-title">Product Description</h3>
                <span
                  className={`arrow-icon ${isDescriptionOpen ? "open" : ""}`}
                >
                  <FaChevronDown />
                </span>
              </div>
              {isDescriptionOpen && (
                <div className="description-content">
                  <div className="description-item">
                    <span className="label">Category:</span>
                    <span className="value">{product.category || "N/A"}</span>
                  </div>
                  <div className="description-item">
                    <span className="label">Craft Type:</span>
                    <span className="value">{product.craftType || "N/A"}</span>
                  </div>
                  <div className="description-item">
                    <span className="label">Made In Barangay:</span>
                    <span className="value">{product.barangay || "N/A"}</span>
                  </div>
                  <br />
                  <div className="description-text">
                    <p>Product description goes here...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {canReview && (
            <>
              <div className="modal-section-gap"></div>

              {/* Product Ratings Section - Only visible to users who purchased */}
              <div className="ratings-section">
                <div className="ratings-header">
                  <div className="ratings-title">
                    <span className="ratings-count">
                      {reviewAverage !== null ? reviewAverage.toFixed(1) : "0.0"}
                    </span>
                    <FaStar className="rating-star" />
                    <span className="ratings-label">
                      {reviewCount === 0
                        ? "No reviews yet"
                        : reviewCount === 1
                        ? "Average from 1 review"
                        : `Average from ${reviewCount} reviews`}
                    </span>
                  </div>
                  <button
                    className="view-all-btn"
                    onClick={() => reviewList.length > 1 && setShowAllReviews(true)}
                    disabled={reviewList.length <= 1}
                  >
                    View all
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>

                <div className="modal-divider-ratings"></div>

                <div className="ratings-list">
                  {reviewsLoading ? (
                    <div className="review-card">
                      <div className="reviewer-info">
                        <div className="reviewer-details">
                          <p className="review-text">Loading reviews...</p>
                        </div>
                      </div>
                    </div>
                  ) : reviewList.length === 0 ? (
                    <div className="review-card">
                      <div className="reviewer-info">
                        <div className="reviewer-details">
                          <p className="review-text">
                            No reviews yet. Be the first to share your thoughts!
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : !showAllReviews ? (
                    <div className="review-card">
                      <div className="reviewer-info">
                        <img
                          src={getReviewerAvatar(reviewList[0].userName)}
                          alt={reviewList[0].userName}
                          className="reviewer-avatar"
                        />
                        <div className="reviewer-details">
                          <h4 className="reviewer-name">{reviewList[0].userName}</h4>
                          <div className="review-rating">
                            {[...Array(5)].map((_, index) => (
                              <FaStar
                                key={index}
                                className={
                                  index < reviewList[0].rating
                                    ? "star-filled"
                                    : "star-empty"
                                }
                              />
                            ))}
                          </div>
                          <p className="review-text">{reviewList[0].comment}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="all-reviews-modal">
                      <div className="all-reviews-header">
                        <h3>All Product Reviews</h3>
                        <button
                          className="modal-close"
                          style={{ position: "static", marginLeft: "auto" }}
                          onClick={() => setShowAllReviews(false)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="all-reviews-list">
                        {reviewList.map((review) => (
                          <div className="review-card" key={review.id}>
                            <div className="reviewer-info">
                              <img
                                src={getReviewerAvatar(review.userName)}
                                alt={review.userName}
                                className="reviewer-avatar"
                              />
                              <div className="reviewer-details">
                                <h4 className="reviewer-name">{review.userName}</h4>
                                <div className="review-rating">
                                  {[...Array(5)].map((_, index) => (
                                    <FaStar
                                      key={index}
                                      className={
                                        index < review.rating
                                          ? "star-filled"
                                          : "star-empty"
                                      }
                                    />
                                  ))}
                                </div>
                                <p className="review-text">{review.comment}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-section-gap"></div>
            </>
          )}

          {/* Seller/Artist Section */}
          <div className="seller-section">
            <div className="seller-info">
              <div className="seller-main">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${product.artist}`}
                  alt="Seller Avatar"
                  className="seller-avatar"
                />
                <div className="seller-details">
                  <h4 className="shop-name">{product.artist}&rsquo;s Shop</h4>
                  <div className="shop-location">
                    <i className="fa-solid fa-location-dot"></i>
                    <span>Barangay Name</span>
                  </div>
                </div>
                {/* Redirect to artisan/[id] */}
                <Link
                  href={`/artisan/${product.productId}`}
                  className="visit-shop-btn"
                >
                  <i className="fa-solid fa-shop"></i>
                  Visit Shop
                </Link>
              </div>
              <div className="seller-stats">
                <div className="stat-item">
                  <span className="stat-value">4.8</span>
                  <span className="stat-label">Rating</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-value">42</span>
                  <span className="stat-label">Products</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-section-gap"></div>

          {/* You May Also Like Section */}
          <div className="recommendations-section">
            <h3 className="recommendations-title">You May Also Like</h3>
            <div className="recommendations-grid">
              {dummyRecommendations.map((rec) => (
                <div
                  key={rec._id}
                  className="recommendation-card"
                  onClick={() => {
                    const legacyProduct = {
                      img: rec.images[0],
                      hoverImg: rec.images[0],
                      name: rec.name,
                      artist: "Local Artisan",
                      price: `₱${rec.price.toFixed(2)}`,
                      productId: rec._id,
                      maxStock: 10,
                      craftType: rec.craftType,
                      category: rec.category,
                      soldCount: 0,
                    };
                    setMainImage(legacyProduct.img);
                    onProductChange(legacyProduct);
                  }}
                >
                  <div className="recommendation-image">
                    <img src={rec.images[0]} alt={rec.name} />
                  </div>
                  <div className="recommendation-info">
                    <h4>{rec.name}</h4>
                    <span className="recommendation-price">
                      ₱{rec.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
