"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import "./artisan.css";

export default function ArtisanProfilePage() {
  // Example static data, replace with real fetch logic
  const artisan = {
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aba",
    shopName: "Aba's Weaving Shop",
    name: "Aba Dela Cruz",
    craftType: "Weaving",
    category: "Handicrafts",
    rating: 4.8,
    location: "Asinan",
    joined: "2025-11-07",
    storyImage: "/artist1.jpg",
    storyTitle: "Threads of Heritage",
    storyExcerpt:
      "I've been weaving traditional Filipino textiles for over 15 years, learning the craft from my grandmother. Each piece tells a story of our heritage and community. I specialize in indigenous patterns that have been passed down through generations.",
  };

  // Example products for this artisan (replace with real fetch)
  const products = [
    {
      _id: "1",
      name: "Handwoven Buri Bag",
      artistName: artisan.name,
      price: 799,
      images: ["/box7.png", "/box7-hover.png"],
      averageRating: 4.7,
      totalReviews: 12,
      isAvailable: true,
      stock: 5,
      isFeatured: true,
      craftType: artisan.craftType,
      category: artisan.category,
      thumbnailUrl: "/box7.png",
    },
    {
      _id: "2",
      name: "Traditional Table Runner",
      artistName: artisan.name,
      price: 499,
      images: ["/box8.png"],
      averageRating: 4.9,
      totalReviews: 8,
      isAvailable: true,
      stock: 3,
      isFeatured: false,
      craftType: artisan.craftType,
      category: artisan.category,
      thumbnailUrl: "/box8.png",
    },
    // ...add more products as needed
  ];

  // Format joined date
  const joinedDate = new Date(artisan.joined);
  const joinedText = joinedDate.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <Navbar />
      <main className="artisan-profile-main">
        <section className="artisan-card">
          <div className="artisan-card-top">
            {/* Profile on the top left */}
            <img
              src={artisan.avatar}
              alt={artisan.name}
              className="artisan-avatar"
            />
            {/* Shop name and artisan name */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "baseline", gap: "18px" }}
              >
                <span
                  className="shop-name"
                  style={{
                    fontSize: "2rem",
                    fontWeight: 600,
                    color: "#2E3F36",
                  }}
                >
                  {artisan.shopName}
                </span>
                <span
                  className="artisan-name"
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 500,
                    color: "#888",
                  }}
                >
                  {artisan.name}
                </span>
              </div>
              {/* Category, craft type, rating */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "14px 0 0 0",
                  gap: "5px",
                }}
              >
                <span className="artisan-category-type">
                  {artisan.category}
                </span>
                <span className="artisan-craft-type">{artisan.craftType}</span>
                {/* Move shop rating right beside tags, not pushed to edge */}
                <span
                  style={{
                    color: "#AF7928",
                    fontWeight: 600,
                    fontSize: "1.08rem",
                    marginLeft: "10px",
                  }}
                >
                  ★ {artisan.rating}
                </span>
              </div>
              {/* Barangay location with icon */}
              <div
                style={{
                  margin: "12px 0 0 0",
                  color: "#888",
                  fontWeight: 400,
                  fontSize: "0.90rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  className="artisan-location-icon"
                />
                {artisan.location}
              </div>
              {/* Joined date */}
              <div
                style={{
                  margin: "10px 0 0 0",
                  color: "#888",
                  fontSize: "0.80rem",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faCalendar}
                  style={{ marginRight: "7px", color: "#AF7928" }}
                />
                Joined {joinedText}
              </div>
            </div>
          </div>
          {/* Line break */}
          <hr
            style={{
              margin: "22px 0 0 0",
              border: "none",
              borderTop: "2px solid #e0e0e0",
            }}
          />
          {/* About section */}
          <div
            className="artisan-about-section"
            style={{
              margin: "28px 0 0 0",
              display: "flex",
              alignItems: "flex-start",
              gap: "32px",
            }}
          >
            <img
              src={artisan.storyImage}
              alt={artisan.storyTitle}
              className="artisan-story-image"
              style={{
                width: "180px",
                height: "180px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "0",
                boxShadow: "0 2px 12px rgba(46,63,54,0.08)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  marginBottom: "8px",
                  color: "#AF7928",
                }}
              >
                {artisan.storyTitle}
              </div>
              <div style={{ color: "#2e3f36c4", fontSize: "0.95rem" }}>
                {artisan.storyExcerpt}
              </div>
            </div>
          </div>
        </section>

        {/* Products by [Artist Name] */}
        <div style={{ margin: "2.5rem 0 0 0", width: "100%" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#2E3F36",
              margin: "0 0 1.5rem 2rem",
            }}
          >
            Products by {artisan.name}
          </h2>
          <div className="artisan-product-grid">
            {products.map((product) => (
              <div className="artisan-product-card" key={product._id}>
                <div className="artisan-image-container">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="artisan-product-image"
                  />
                </div>
                <div className="artisan-product-info">
                  <div className="artisan-product-info-top">
                    <h3 className="artisan-product-name">{product.name}</h3>
                    <p className="artisan-product-artist">
                      {product.artistName}
                    </p>
                    <div className="artisan-product-tags">
                      <span className="artisan-product-tag craft-type">
                        {product.craftType}
                      </span>
                      <span className="artisan-product-tag category">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  {/* Remove the line break (border-top) above the price by moving price/rating up */}
                  <div
                    className="artisan-product-info-bottom"
                    style={{
                      borderTop: "none",
                      paddingTop: 0,
                      marginTop: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "2px",
                      }}
                    >
                      <span className="artisan-product-price">
                        ₱{product.price}
                      </span>
                      <span
                        className="artisan-product-rating"
                        style={{ marginLeft: 0, marginTop: "2px" }}
                      >
                        ★ {product.averageRating} ({product.totalReviews})
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.95rem",
                        color: "#2e3f36",
                        marginLeft: "18px",
                      }}
                    >
                      Qty: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
