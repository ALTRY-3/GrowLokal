"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import "./artisan.css";

// Example frontend artisan data
const artisans = [
  {
    id: "1",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aba",
    shopName: "Aba's Weaving Shop",
    name: "Aba Dela Cruz",
    craftType: "Weaving",
    category: "Handicrafts",
    rating: 4.8,
    location: "Asinan",
    joined: "2025-11-07",
    storyImage: "/artisans4.jpeg",
    storyTitle: "A Journey to the Home of Rattan Furniture Making",
    storyExcerpt:
      "Rattan is a strong part of Filipino cultural material tradition and Cebu is known through out the Philippines for its strong tradition in rattan furniture making. During my residency I visited Cebu to learn about both the traditional and innovative techniques furniture makers use. The techniques I learnt there gave me a strong understanding of frame making and weaving and it was with this knowledge that I returned to my studio in Manila. There I  began to experiment with rattan frame making and applying it to sculptural forms and concepts working towards an exhibition that was to be held at the end of my residency.",
    products: [
      {
        _id: "1",
        name: "Handwoven Buri Bag",
        artistName: "Aba Dela Cruz",
        price: 799,
        images: ["/box7.png", "/box7-hover.png"],
        averageRating: 4.7,
        totalReviews: 12,
        isAvailable: true,
        stock: 5,
        isFeatured: true,
        craftType: "Weaving",
        category: "Handicrafts",
        thumbnailUrl: "/box7.png",
      },
      // ...more products
    ],
  },
  {
    id: "2",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ben",
    shopName: "Ben's Pottery Studio",
    name: "Ben Yap",
    craftType: "Woodwork",
    category: "Banicain",
    rating: 4.6,
    location: "Banicain",
    joined: "2024-08-15",
    storyImage: "/artisans4.jpg",
    storyTitle: "Grain of Time",
    storyExcerpt:
      "Each piece of wood I touch holds a memory, of rain, of sun, of silence. When I carve, I listen to its rhythm, the pulse hidden beneath its grain. The sound of the chisel against the wood reminds me that even something once cut down can be shaped into something new. Every curve I sand feels like rewriting a story that refuses to end.",
    products: [
      {
        _id: "1",
        name: "Rice Grooved Kuksa Mug",
        artistName: "Ben Yap",
        price: 499,
        images: ["/home6.png", "/home6-hover.png"],
        averageRating: 4.9,
        totalReviews: 2,
        isAvailable: true,
        stock: 3,
        isFeatured: true,
        craftType: "Woodwork",
        category: "Handicrafts",
        thumbnailUrl: "/home6.png",
      },
    ],
  },
  {
    id: "3",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dan",
    shopName: "Carla's Shop",
    name: "Carla Abdul",
    craftType: "Pottery",
    category: "Handicrafts",
    rating: 4.7,
    location: "Baretto",
    joined: "2022-03-10",
    storyImage: "/artisans1.jpg",
    storyTitle: "In the Shape of My Hands",
    storyExcerpt:
      "The clay never lies. It remembers every hesitation, every moment I lose focus. When I sit at the wheel, it feels like time folds in on itself — just me, the slow spin, and the soft resistance beneath my palms.",
    products: [
      {
        _id: "1",
        name: "Embroidered Shawls",
        artistName: "Carla Abdul",
        price: 699,
        images: ["/fashion5.png", "/fashion5-hover.png"],
        averageRating: 4.5,
        totalReviews: 8,
        isAvailable: true,
        stock: 10,
        isFeatured: false,
        craftType: "Pottery",
        category: "Handicrafts",
        thumbnailUrl: "/fashion5.png",
      },
    ],
  },
  {
    id: "4",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cara",
    shopName: "David's Store",
    name: "David Delo Santos",
    craftType: "Embroidery",
    category: "Fashion",
    rating: 4.9,
    location: "East Bajac-Bajac",
    joined: "2023-05-22",
    storyImage: "/artisans5.jpg",
    storyTitle: "Threads of Quiet",
    storyExcerpt:
      "Each stitch feels like a whisper, a small act of patience that holds the fabric together. I lose track of time as colors bloom beneath my fingers, stories forming where there were once only blank spaces. When I finish, it’s never just a pattern — it’s a piece of calm I’ve sewn into being.",
    products: [
      {
        _id: "1",
        name: "Embroidered Shawls",
        artistName: "David Delo Santos",
        price: 699,
        images: ["/fashion5.png", "/fashion5-hover.png"],
        averageRating: 4.5,
        totalReviews: 8,
        isAvailable: true,
        stock: 10,
        isFeatured: false,
        craftType: "Embroidery",
        category: "Fashion",
        thumbnailUrl: "/fashion5.png",
      },
    ],
  },
  {
    id: "5",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve",
    shopName: "Frances' Creations",
    name: "Frances Toyang",
    craftType: "Jewelry Making",
    category: "Handicrafts",
    rating: 4.85,
    location: "Kalaklan",
    joined: "2021-12-05",
    storyImage: "/artisans6.jpg",
    storyTitle: "Beads of Beauty",
    storyExcerpt:
      "Tiny beads slip through my fingers like drops of light, each one holding a fragment of color and meaning. I thread them together slowly, finding rhythm in the quiet click of glass against glass. When the piece catches the sun, I see more than jewelry — I see patience turned into beauty.",
    products: [
      {
        _id: "1",
        name: "Hardin Beaded Earrings",
        artistName: "Frances Toyang",
        price: 499,
        images: ["/box6.png", "/box6-hover.png"],
        averageRating: 4.85,
        totalReviews: 15,
        isAvailable: true,
        stock: 20,
        isFeatured: true,
        craftType: "Jewelry Making",
        category: "Handicrafts",
        thumbnailUrl: "/box6.png",
      },
    ],
  },
  {
    id: "6",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joe",
    shopName: "Juan's Textiles",
    name: "Juan Reyes",
    craftType: "Textile",
    category: "Fashion",
    rating: 4.75,
    location: "Gordon Heights",
    joined: "2020-09-18",
    storyImage: "/artisans7.png",
    storyTitle: "Threads of the Earth",
    storyExcerpt:
      "I run my hands over the fabric, feeling the texture shaped by hours of weaving and dyeing. Each thread carries the story of where it came from — the soil, the plant, the hands that spun it. As the patterns come alive, I realize I’m not just making cloth; I’m preserving memory.",
    products: [
      {
        _id: "1",
        name: "Crochet Dress with Beaded Straps",
        artistName: "Juan Reyes",
        price: 799,
        images: ["/fashion3.png", "/fashion3-hover.png"],
        averageRating: 4.75,
        totalReviews: 10,
        isAvailable: true,
        stock: 15,
        isFeatured: false,
        craftType: "Textile",
        category: "Fashion",
        thumbnailUrl: "/fashion3.png",
      },
    ],
  },
];

export default function ArtisanProfilePage() {
  const params = useParams();
  const artisanId = params.id;
  const artisan = artisans.find((a) => a.id === artisanId);

  if (!artisan) {
    return (
      <div>
        <Navbar />
        <main className="artisan-profile-main">
          <div>Artisan not found.</div>
        </main>
        <Footer />
      </div>
    );
  }

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
            {artisan.products.map((product) => (
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
