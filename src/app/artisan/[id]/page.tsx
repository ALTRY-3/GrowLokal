"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import {
  FaEnvelope,
  FaPhone,
  FaFacebook,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import "./artisan.css";

interface ArtisanProduct {
  id: string;
  name: string;
  price: number;
  priceLabel?: string | null;
  images: string[];
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  stock: number;
  category?: string;
  craftType?: string | null;
}

interface ArtisanProfile {
  id: string;
  shopName: string;
  artistName: string;
  category?: string;
  craftType?: string | null;
  location?: string;
  joined?: string;
  storyTitle: string;
  storyExcerpt: string;
  storyImage?: string | null;
  avatar?: string;
  products: ArtisanProduct[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialMedia?: {
    facebook?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
  };
}

const getProfileAvatar = (artist: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    artist
  )}`;

export default function ArtisanProfilePage() {
  const params = useParams<{ id: string }>();
  const artisanId = params?.id;
  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtisan = async () => {
      if (!artisanId) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/artisans/${artisanId}`);
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to load artisan");
        }

        setArtisan(payload.data);
      } catch (err) {
        console.error("Failed to fetch artisan", err);
        setError(err instanceof Error ? err.message : "Failed to load artisan");
      } finally {
        setLoading(false);
      }
    };

    fetchArtisan();
  }, [artisanId]);

  const joinedText = useMemo(() => {
    if (!artisan?.joined) return null;
    const date = new Date(artisan.joined);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [artisan?.joined]);

  const computedShopRating = useMemo(() => {
    if (!artisan?.products?.length) return null;
    const rated = artisan.products.filter((product) => product.totalReviews > 0);
    if (!rated.length) return null;
    const total = rated.reduce((sum, product) => sum + product.averageRating, 0);
    return (total / rated.length).toFixed(2);
  }, [artisan?.products]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="artisan-profile-main">
          <div className="artisan-state">Loading artisan profile…</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !artisan) {
    return (
      <div>
        <Navbar />
        <main className="artisan-profile-main">
          <div className="artisan-state artisan-state-error">
            {error || "Artisan not found."}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const heroImage =
    artisan.storyImage || artisan.avatar || getProfileAvatar(artisan.artistName);
  const avatarImage = artisan.avatar || getProfileAvatar(artisan.artistName);
  const hasContactEmail = Boolean(artisan.contactEmail);
  const hasContactPhone = Boolean(artisan.contactPhone);
  const hasSocialLinks = Boolean(
    artisan.socialMedia &&
      (artisan.socialMedia.facebook ||
        artisan.socialMedia.instagram ||
        artisan.socialMedia.tiktok)
  );

  return (
    <div>
      <Navbar />
      <main className="artisan-profile-main">
        <section className="artisan-card">
          <div className="artisan-card-top">
            <Image
              src={avatarImage}
              alt={artisan.artistName}
              className="artisan-avatar"
              width={120}
              height={120}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "18px" }}>
                <span
                  className="shop-name"
                  style={{ fontSize: "2rem", fontWeight: 600, color: "#2E3F36" }}
                >
                  {artisan.shopName}
                </span>
                <span
                  className="artisan-name"
                  style={{ fontSize: "1.15rem", fontWeight: 500, color: "#888" }}
                >
                  {artisan.artistName}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "14px 0 0 0",
                  gap: "5px",
                  flexWrap: "wrap",
                }}
              >
                {artisan.category && (
                  <span className="artisan-category-type">{artisan.category}</span>
                )}
                {artisan.craftType && (
                  <span className="artisan-craft-type">{artisan.craftType}</span>
                )}
                {computedShopRating && (
                  <span
                    style={{
                      color: "#AF7928",
                      fontWeight: 600,
                      fontSize: "1.08rem",
                      marginLeft: "10px",
                    }}
                  >
                    ★ {computedShopRating}
                  </span>
                )}
              </div>
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
                <FontAwesomeIcon icon={faMapMarkerAlt} className="artisan-location-icon" />
                {artisan.location || "Olongapo"}
              </div>
              {joinedText && (
                <div
                  style={{
                    margin: "10px 0 0 0",
                    color: "#888",
                    fontSize: "0.80rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FontAwesomeIcon icon={faCalendar} style={{ marginRight: "7px", color: "#AF7928" }} />
                  Joined {joinedText}
                </div>
              )}
            </div>
          </div>
          <hr
            style={{
              margin: "22px 0 0 0",
              border: "none",
              borderTop: "2px solid #e0e0e0",
            }}
          />
          <div
            className="artisan-about-section"
            style={{
              margin: "28px 0 0 0",
              display: "flex",
              alignItems: "flex-start",
              gap: "32px",
            }}
          >
            <Image
              src={heroImage}
              alt={artisan.storyTitle}
              className="artisan-story-image"
              width={180}
              height={180}
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

        {(hasContactEmail || hasContactPhone || hasSocialLinks) && (
          <section className="artisan-contact-card">
            <div className="artisan-contact-header">
              <h3>Connect with {artisan.artistName}</h3>
              <p>Reach out to learn more about custom work, workshops, or collaborations.</p>
            </div>
            <div className="artisan-contact-grid">
              {hasContactEmail && (
                <a className="artisan-contact-item" href={`mailto:${artisan.contactEmail}`}>
                  <FaEnvelope />
                  <span>{artisan.contactEmail}</span>
                </a>
              )}
              {hasContactPhone && (
                <a className="artisan-contact-item" href={`tel:${artisan.contactPhone}`}>
                  <FaPhone />
                  <span>{artisan.contactPhone}</span>
                </a>
              )}
            </div>
            {hasSocialLinks && artisan.socialMedia && (
              <div className="artisan-social-links">
                {artisan.socialMedia.facebook && (
                  <a href={artisan.socialMedia.facebook} target="_blank" rel="noreferrer">
                    <FaFacebook />
                  </a>
                )}
                {artisan.socialMedia.instagram && (
                  <a href={artisan.socialMedia.instagram} target="_blank" rel="noreferrer">
                    <FaInstagram />
                  </a>
                )}
                {artisan.socialMedia.tiktok && (
                  <a href={artisan.socialMedia.tiktok} target="_blank" rel="noreferrer">
                    <FaTiktok />
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        <div style={{ margin: "2.5rem 0 0 0", width: "100%" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#2E3F36",
              margin: "0 0 1.5rem 2rem",
            }}
          >
            Products by {artisan.artistName}
          </h2>
          <div className="artisan-product-grid">
            {artisan.products.length === 0 && (
              <div className="artisan-state" style={{ width: "100%" }}>
                No products yet. Check back soon!
              </div>
            )}
            {artisan.products.map((product) => {
              const productImage = product.images.length > 0 ? product.images[0] : heroImage;
              const priceLabel = product.priceLabel || `₱${product.price}`;
              const ratingLabel = Number.isFinite(product.averageRating)
                ? product.averageRating.toFixed(1)
                : "0.0";
              return (
                <div className="artisan-product-card" key={product.id}>
                  <div className="artisan-image-container">
                    <Image
                      src={productImage}
                      alt={product.name}
                      className="artisan-product-image"
                      fill
                      sizes="(max-width: 768px) 100vw, 312px"
                    />
                  </div>
                  <div className="artisan-product-info">
                    <div className="artisan-product-info-top">
                      <h3 className="artisan-product-name">{product.name}</h3>
                      <p className="artisan-product-artist">{artisan.artistName}</p>
                      <div className="artisan-product-tags">
                        {product.craftType && (
                          <span className="artisan-product-tag craft-type">
                            {product.craftType}
                          </span>
                        )}
                        {product.category && (
                          <span className="artisan-product-tag category">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className="artisan-product-info-bottom"
                      style={{ borderTop: "none", paddingTop: 0, marginTop: 0 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "2px",
                        }}
                      >
                        <span className="artisan-product-price">{priceLabel}</span>
                        <span
                          className="artisan-product-rating"
                          style={{ marginLeft: 0, marginTop: "2px" }}
                        >
                          ★ {ratingLabel} ({product.totalReviews})
                        </span>
                      </div>
                      <span
                        style={{ fontSize: "0.95rem", color: "#2e3f36", marginLeft: "18px" }}
                      >
                        Qty: {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
