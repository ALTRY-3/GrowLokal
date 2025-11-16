"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageCarousel from "@/components/ImageCarousel1";
import ProductModal from "@/components/ProductModal"; // Add this import
import { useWishlist } from "@/lib/useWishlist";
import { FaStar } from "react-icons/fa";
import { MapPin } from "lucide-react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Calendar } from "lucide-react";
import { Megaphone, Store } from "lucide-react";
import { MdNotifications, MdNotificationsActive } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import "./home.css";

const featuredProducts = [
  {
    id: 1,
    name: "Pure Honey",
    price: 369,
    artist: "Rei Bustamante",
    category: "Food",
    craftType: "Cooking",
    barangay: "New Ilalim",
    image: "/food6.png",
  },
  {
    id: 2,
    name: "Rice Grooved Kuksa Mug",
    price: 449,
    artist: "Ben Yap",
    category: "Handicrafts",
    craftType: "Woodwork",
    barangay: "Banicain",
    image: "/home6.png",
  },
  {
    id: 3,
    name: "Embroidered Shawls",
    price: 699,
    artist: "David Delo Santos",
    category: "Fashion",
    craftType: "Embroidery",
    barangay: "East Bajac-Bajac",
    image: "/fashion5.png",
  },
  {
    id: 4,
    name: "Hardin Beaded Earrings",
    price: 499,
    artist: "Frances Toyang",
    category: "Handicrafts",
    craftType: "Jewelry Making",
    barangay: "Kalaklan",
    image: "/box6.png",
  },
  {
    id: 5,
    name: "Organic Deodorant",
    price: 229,
    artist: "Jabon Lee",
    category: "Beauty & Wellness",
    craftType: "Cosmetics",
    barangay: "Pag-asa",
    image: "/beauty3.png",
  },
  {
    id: 6,
    name: "Handwoven Buri Bag",
    price: 79,
    artist: "Aba Dela Cruz",
    category: "Handicrafts",
    craftType: "Weaving",
    barangay: "Asinan",
    image: "/box7.png",
  },
];

const topArtisans = [
  {
    id: 1,
    name: "Aba Dela Cruz",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aba",
    craftType: "Weaving",
    category: "Handicrafts", // Add category
    location: "Asinan",
    rating: 4.8,
    productsCount: 24,
  },
  {
    id: 2,
    name: "Ben Yap",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ben",
    craftType: "Woodwork",
    category: "Handicrafts",
    location: "Banicain",
    rating: 4.6,
    productsCount: 18,
  },
  {
    id: 3,
    name: "Carla Abdul",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
    craftType: "Pottery",
    category: "Handicrafts",
    location: "Baretto",
    rating: 4.6,
    productsCount: 18,
  },
  {
    id: 4,
    name: "David Delo Santos",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    craftType: "Embroidery",
    category: "Fashion",
    location: "East Bajac-Bajac",
    rating: 4.6,
    productsCount: 18,
  },
  {
    id: 5,
    name: "Ebon Santos",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ebon",
    craftType: "Cosmetics",
    category: "Beauty & Wellness",
    location: "East Tapinac",
    rating: 4.6,
    productsCount: 18,
  },
  {
    id: 6,
    name: "Juan Reyes",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan",
    craftType: "Textile",
    category: "Fashion",
    location: "Gordon Heights",
    rating: 4.6,
    productsCount: 18,
  },
  {
    id: 7,
    name: "Frances Toyang",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frances",
    craftType: "Jewelry Making",
    category: "Handicrafts",
    location: "Kalaklan",
    rating: 5.3,
    productsCount: 18,
  },
  {
    id: 8,
    name: "Brian Porlo",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Brian",
    craftType: "Basketry",
    category: "Handicrafts",
    location: "Mabayuan",
    rating: 6.5,
    productsCount: 50,
  },
  {
    id: 9,
    name: "Lissy Agasa",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lissy",
    craftType: "Leatherwork",
    category: "Handicrafts",
    location: "New Cabalan",
    rating: 2.6,
    productsCount: 8,
  },
  {
    id: 10,
    name: "Rei Bustamante",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rei",
    craftType: "Cooking",
    category: "Food",
    location: "New Ilalim",
    rating: 3.1,
    productsCount: 10,
  },
];

const upcomingEvents = [
  {
    title: "Luzon Art Fair 2025",
    type: "Fair",
    date: "October 12, 2025",
    location: "Barangay Pag-asa",
    fullDate: "2025-10-12",
  },
  {
    title: "Alab Sining 2026",
    type: "Festival",
    date: "February 17, 2026",
    location: "SM City Olongapo Central",
    fullDate: "2026-02-17",
  },
  {
    title: "Pottery Demonstration",
    type: "Demo",
    date: "March 20, 2026",
    location: "Olongapo City, Triangle",
    fullDate: "2026-03-20",
  },
  {
    title: "Cultural Festival",
    type: "Festival",
    date: "March 25, 2026",
    location: "Magsaysay Drive, Olongapo City",
    fullDate: "2026-03-25",
  },
  {
    title: "Sip and Sketch 'Gapo",
    type: "Fair",
    date: "November 11, 2025",
    location: "Olongapo City, Sibul Kapihan",
    image: "/event2.jpg",
    fullDate: "2025-11-11",
  },
  {
    title: "Local Crafts Fair",
    type: "Fair",
    date: "April 2, 2025",
    location: "Olongapo City Plaza",
    image: "/event2.jpg",
    fullDate: "2025-04-02",
  },
];

const announcements = [
  {
    title: "New Artisan Training Program",
    date: "March 10, 2025",
    description:
      "LGU announces free training for aspiring artisans in traditional crafts.",
  },
  {
    title: "Barangay Craft Fair",
    date: "April 1, 2025",
    description:
      "Join the local fair and showcase your handmade creations to the community.",
  },
  {
    title: "Subic Bay Cultural Festival",
    date: "March 15, 2025",
    description:
      "Annual celebration of local culture featuring artisan booths, traditional performances, and cultural exhibits.",
  },
  {
    title: "Alab Sining 2026",
    date: "February 17, 2026",
    description:
      "An art exhibit held at SM City Olongapo Central, showcasing traditional and contemporary artworks by artists from Olongapo.",
  },
  {
    title: "Market Day Extension",
    date: "March 8, 2025",
    description: "Weekend market hours extended to support local artisans.",
  },
  {
    title: "New Artisan Training Program",
    date: "March 10, 2025",
    description:
      "LGU announces free training for aspiring artisans in traditional crafts.s",
  },
];

// Replace the existing artisanStories array with this:
const artisanStories = [
  {
    id: "1",
    title: "A Journey to the Home of Rattan Furniture Making",
    artistName: "Aba Dela Cruz",
    story:
      "Rattan is a strong part of Filipino cultural material tradition and Cebu is known through out the Philippines for its strong tradition in rattan furniture making. During my residency I visited Cebu to learn about both the traditional and innovative techniques furniture makers use. The techniques I learnt there gave me a strong understanding of frame making and weaving and it was with this knowledge that I returned to my studio in Manila. There I  began to experiment with rattan frame making and applying it to sculptural forms and concepts working towards an exhibition that was to be held at the end of my residency.",
    image: "/artisans4.jpeg",
  },
  {
    id: "2",
    title: "Grain of Time",
    artistName: "Ben Yap",
    story:
      "Each piece of wood I touch holds a memory, of rain, of sun, of silence. When I carve, I listen to its rhythm, the pulse hidden beneath its grain. The sound of the chisel against the wood reminds me that even something once cut down can be shaped into something new. Every curve I sand feels like rewriting a story that refuses to end.",
    image: "/artisans4.jpg",
  },
  {
    id: "3",
    title: "In the Shape of My Hands",
    artistName: "Carla Abdul",
    story:
      "The clay never lies. It remembers every hesitation, every moment I lose focus. When I sit at the wheel, it feels like time folds in on itself — just me, the slow spin, and the soft resistance beneath my palms.",
    image: "/artisans1.jpg",
  },
  {
    id: "4",
    title: "Threads of Quiet",
    artistName: "David Delo Santos",
    story:
      "Each stitch feels like a whisper, a small act of patience that holds the fabric together. I lose track of time as colors bloom beneath my fingers, stories forming where there were once only blank spaces. When I finish, it’s never just a pattern — it’s a piece of calm I’ve sewn into being.",
    image: "/artisans5.jpg",
  },
  {
    id: "5",
    title: "Beads and Beauty",
    artistName: "Frances Toyang",
    story:
      "Tiny beads slip through my fingers like drops of light, each one holding a fragment of color and meaning. I thread them together slowly, finding rhythm in the quiet click of glass against glass. When the piece catches the sun, I see more than jewelry — I see patience turned into beauty.",
    image: "/artisans6.jpg",
  },
];

export default function HomePage() {
  const [eventReminders, setEventReminders] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Change this
  
  // Use wishlist hook instead of local state
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const router = useRouter();

  // Add state to track scroll positions for each carousel
  const [canScrollFeatured, setCanScrollFeatured] = useState({
    left: false,
    right: true,
  });
  const [canScrollArtisans, setCanScrollArtisans] = useState({
    left: false,
    right: true,
  });
  const [canScrollEvents, setCanScrollEvents] = useState({
    left: false,
    right: true,
  });
  const [canScrollStories, setCanScrollStories] = useState({
    left: false,
    right: true,
  });
  const [canScrollAnnouncements, setCanScrollAnnouncements] = useState({
    left: false,
    right: true,
  });

  useEffect(() => {
    const savedReminders = localStorage.getItem("eventReminders");
    if (savedReminders) {
      setEventReminders(JSON.parse(savedReminders));
    }
  }, []);

  useEffect(() => {
    // Check for selected product from home page
    const selectedProductFromHome = localStorage.getItem("selectedProduct");
    if (selectedProductFromHome) {
      // Set the selected product and show modal
      setSelectedProduct(JSON.parse(selectedProductFromHome));
      // Clear the stored product
      localStorage.removeItem("selectedProduct");
    }
  }, []);

  const featuredRef = useRef<HTMLDivElement>(null);
  const artisansRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const announcementsRef = useRef<HTMLDivElement>(null);
  const storiesRef = useRef<HTMLDivElement>(null);

  const scroll = (
    direction: "left" | "right",
    container: HTMLDivElement | null
  ): void => {
    if (!container) return;
    const cardWidth = 312;
    const gap = 24;
    const scrollDistance = cardWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollDistance : scrollDistance,
      behavior: "smooth",
    });
  };

  const toggleEventReminder = (title: string) => {
    setEventReminders((prev) => {
      const newReminders = prev.includes(title)
        ? prev.filter((prevTitle) => prevTitle !== title)
        : [...prev, title];

      localStorage.setItem("eventReminders", JSON.stringify(newReminders));
      return newReminders;
    });
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (openMenuId !== null) {
      const menu = document.getElementById(`menu-${openMenuId}`);
      if (menu && !menu.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleProductClick = (product: any) => {
    // Convert product to modal format
    const modalProduct = {
      img: product.image,
      hoverImg: product.image,
      name: product.name,
      artist: product.artist,
      price: `₱${product.price.toFixed(2)}`,
      craftType: product.craftType,
      category: product.category,
      productId: product.id.toString(),
      maxStock: 10,
      soldCount: 0,
    };
    setSelectedProduct(modalProduct);
  };

  const handleViewDetails = (eventTitle: string) => {
    // Navigate to events page with event title as query param
    router.push(`/events?event=${encodeURIComponent(eventTitle)}`);
  };

  const checkScrollPosition = (
    container: HTMLDivElement | null,
    setCanScroll: React.Dispatch<
      React.SetStateAction<{ left: boolean; right: boolean }>
    >
  ) => {
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScroll({
      left: scrollLeft > 0,
      right: scrollLeft < scrollWidth - clientWidth - 10,
    });
  };

  // Add scroll event listeners
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        checkScrollPosition(featuredRef.current, setCanScrollFeatured);
        checkScrollPosition(artisansRef.current, setCanScrollArtisans);
        checkScrollPosition(eventsRef.current, setCanScrollEvents);
        checkScrollPosition(storiesRef.current, setCanScrollStories);
        checkScrollPosition(
          announcementsRef.current,
          setCanScrollAnnouncements
        );
      }, 100);
    };

    const containers = [
      featuredRef.current,
      artisansRef.current,
      eventsRef.current,
      storiesRef.current,
      announcementsRef.current,
    ];

    containers.forEach((container) => {
      if (container) {
        container.addEventListener("scroll", handleScroll);
      }
    });

    // Check initial state
    setTimeout(() => {
      checkScrollPosition(featuredRef.current, setCanScrollFeatured);
      checkScrollPosition(artisansRef.current, setCanScrollArtisans);
      checkScrollPosition(eventsRef.current, setCanScrollEvents);
      checkScrollPosition(storiesRef.current, setCanScrollStories);
      checkScrollPosition(announcementsRef.current, setCanScrollAnnouncements);
    }, 500);

    return () => {
      clearTimeout(scrollTimeout);
      containers.forEach((container) => {
        if (container) {
          container.removeEventListener("scroll", handleScroll);
        }
      });
    };
  }, []); // Empty dependency array - runs only once on mount

  return (
    <div className="homepage">
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero-section">
        <ImageCarousel autoSlide={true} slideInterval={3000} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            Empowering Local{" "}
            <span className="highlight">Artisans & Communities</span>
          </h1>
          <p className="hero-text">
            Whether you're a buyer seeking authentic crafts or an artisan ready
            to showcase your work, GrowLokal connects everyone to preserve and
            celebrate Filipino heritage.
          </p>
          <div className="hero-buttons">
            <Link href="/marketplace" className="btn-explore">
              Explore Marketplace
            </Link>
            <Link href="/profile" className="btn-start-hero">
              <span>Start Selling</span>
            </Link>
          </div>
        </div>
      </section>

      <main className="main-content">
        {/* TOP ARTISANS */}
        <section className="section bg-white">
          <div className="home-section-header">
            <h2>Top Artisans</h2>
          </div>

          <div className="carousel-container">
            {canScrollArtisans.left && (
              <button
                className="home-nav-button prev"
                onClick={() => scroll("left", artisansRef.current)}
                aria-label="Previous"
              >
                <FaChevronLeft />
              </button>
            )}

            <div className="home-artisan-carousel" ref={artisansRef}>
              {topArtisans.map((artisan) => (
                <div className="home-artisan-card" key={artisan.id}>
                  <div className="home-artisan-menu" id={`menu-${artisan.id}`}>
                    <button
                      className="home-artisan-menu-button"
                      onClick={(e) => {
                        setOpenMenuId(
                          openMenuId === artisan.id ? null : artisan.id
                        );
                      }}
                      aria-label="Artisan menu"
                    >
                      <BsThreeDotsVertical />
                    </button>
                    {openMenuId === artisan.id && (
                      <div className="home-artisan-menu-dropdown">
                        <Link
                          href={`/artisan/${artisan.id}`}
                          className="home-artisan-menu-item"
                        >
                          <User size={16} />
                          Visit Shop
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/artisan/${artisan.id}`}
                    className="home-artisan-profile"
                    style={{ textDecoration: "none" }}
                  >
                    <img
                      src={artisan.avatar}
                      alt={artisan.name}
                      className="home-artisan-avatar"
                    />
                    <div className="home-artisan-info">
                      <h3 className="home-artisan-name">{artisan.name}</h3>
                      <div className="home-artisan-tags">
                        <span className="home-artisan-tag craft-type">
                          {artisan.craftType}
                        </span>
                        <span className="home-artisan-tag category">
                          {artisan.category}
                        </span>
                      </div>
                      <div className="home-artisan-location">
                        <MapPin size={12} />
                        <span>{artisan.location}</span>
                      </div>
                      <div className="home-artisan-meta">
                        <div className="home-artisan-rating">
                          <FaStar className="star-icon" />
                          <span>{artisan.rating}</span>
                        </div>
                        <span className="home-artisan-products">
                          {artisan.productsCount} products
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {canScrollArtisans.right && (
              <button
                className="home-nav-button next"
                onClick={() => scroll("right", artisansRef.current)}
                aria-label="Next"
              >
                <FaChevronRight />
              </button>
            )}
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="section bg-alt">
          <div className="home-section-header">
            <h2>Featured Crafts</h2>
            <Link href="/marketplace" className="home-see-all">
              See All <FaChevronRight className="home-arrow-icon" />
            </Link>
          </div>

          <div className="carousel-container">
            {canScrollFeatured.left && (
              <button
                className="home-nav-button prev"
                onClick={() => scroll("left", featuredRef.current)}
                aria-label="Previous"
              >
                <FaChevronLeft />
              </button>
            )}

            <div className="home-product-carousel" ref={featuredRef}>
              {featuredProducts.map((product) => (
                <div
                  className="home-product-card"
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="home-image-container">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="home-product-image"
                    />
                  </div>
                  <div className="home-product-info">
                    <div className="home-product-info-top">
                      <h3 className="home-product-name">{product.name}</h3>
                      <p className="home-product-artist">{product.artist}</p>
                      <p className="home-product-location">
                        <MapPin size={12} />
                        {product.barangay}
                      </p>
                      <div className="home-product-tags">
                        <span className="home-product-tag craft-type">
                          {product.craftType}
                        </span>
                        <span className="home-product-tag category">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <div className="home-product-info-bottom">
                      <div className="home-product-price-wrapper">
                        <span className="home-product-price">
                          ₱{product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {canScrollFeatured.right && (
              <button
                className="home-nav-button next"
                onClick={() => scroll("right", featuredRef.current)}
                aria-label="Next"
              >
                <FaChevronRight />
              </button>
            )}
          </div>
        </section>

        {/* EVENTS */}
        <section className="section bg-white">
          <div className="home-section-header">
            <h2>Upcoming Events</h2>
            <Link href="/events" className="home-see-all">
              View All <FaChevronRight className="home-arrow-icon" />
            </Link>
          </div>

          <div className="carousel-container">
            {canScrollEvents.left && (
              <button
                className="home-nav-button prev"
                onClick={() => scroll("left", eventsRef.current)}
                aria-label="Previous"
              >
                <FaChevronLeft />
              </button>
            )}

            <div className="home-event-carousel" ref={eventsRef}>
              {upcomingEvents.map((event, index) => (
                <div className="home-event-card" key={index}>
                  <div className="home-event-header">
                    <span className="home-event-type">{event.type}</span>
                    <button
                      className={`home-event-reminder ${
                        eventReminders.includes(event.title) ? "active" : ""
                      }`}
                      onClick={() => toggleEventReminder(event.title)}
                      aria-label={
                        eventReminders.includes(event.title)
                          ? "Remove reminder"
                          : "Set reminder"
                      }
                    >
                      {eventReminders.includes(event.title) ? (
                        <MdNotificationsActive className="icon-ringing" />
                      ) : (
                        <MdNotifications />
                      )}
                    </button>
                  </div>
                  <div className="home-event-content">
                    <h3 className="home-event-title">{event.title}</h3>
                    <p className="home-event-date">{event.date}</p>
                    <div className="home-event-location">
                      <MapPin size={12} />
                      <span>{event.location}</span>
                    </div>
                    <div className="home-event-actions">
                      <button
                        className="home-event-view-details"
                        onClick={() => handleViewDetails(event.title)}
                      >
                        View Event Details <FaChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {canScrollEvents.right && (
              <button
                className="home-nav-button next"
                onClick={() => scroll("right", eventsRef.current)}
                aria-label="Next"
              >
                <FaChevronRight />
              </button>
            )}
          </div>
        </section>

        {/* ARTISAN STORIES */}
        <section className="section bg-alt">
          <div className="home-section-header">
            <h2>Artisan Stories</h2>
            <Link href="/stories" className="home-see-all">
              Read More <FaChevronRight className="home-arrow-icon" />
            </Link>
          </div>

          <div className="carousel-container">
            {canScrollStories.left && (
              <button
                className="home-nav-button prev"
                onClick={() => scroll("left", storiesRef.current)}
                aria-label="Previous"
              >
                <FaChevronLeft />
              </button>
            )}

            <div className="home-stories-carousel" ref={storiesRef}>
              {artisanStories.map((story) => (
                <div className="home-story-card" key={story.id}>
                  <div className="home-story-image-container">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="home-story-image"
                    />
                  </div>
                  <div className="home-story-content">
                    <h3 className="home-story-title">{story.title}</h3>
                    <p className="home-story-artist">{story.artistName}</p>
                    <p className="home-story-excerpt">
                      {story.story.length > 200
                        ? `${story.story.substring(0, 200)}...`
                        : story.story}
                    </p>
                    <Link
                      href={`/stories?storyId=${story.id}`}
                      className="home-story-read-more"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {canScrollStories.right && (
              <button
                className="home-nav-button next"
                onClick={() => scroll("right", storiesRef.current)}
                aria-label="Next"
              >
                <FaChevronRight />
              </button>
            )}
          </div>
        </section>

        {/* ANNOUNCEMENTS */}
        <section className="section bg-white">
          <div className="home-section-header">
            <h2>Community Announcements</h2>
            <div className="header-right">
              <Megaphone size={24} className="megaphone-icon" />
            </div>
          </div>

          <div className="carousel-container">
            {canScrollAnnouncements.left && (
              <button
                className="home-nav-button prev"
                onClick={() => scroll("left", announcementsRef.current)}
                aria-label="Previous"
              >
                <FaChevronLeft />
              </button>
            )}

            <div className="home-announcement-carousel" ref={announcementsRef}>
              {announcements.map((announcement, index) => (
                <div className="home-announcement-card" key={index}>
                  <div className="home-announcement-content">
                    <div className="announcement-title-row">
                      <h3 className="home-announcement-title">
                        {announcement.title}
                      </h3>
                      <span className="home-announcement-date">
                        {announcement.date}
                      </span>
                    </div>
                    <p className="home-announcement-description">
                      {announcement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {canScrollAnnouncements.right && (
              <button
                className="home-nav-button next"
                onClick={() => scroll("right", announcementsRef.current)}
                aria-label="Next"
              >
                <FaChevronRight />
              </button>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="section bg-alt full-width become-seller-cta">
          <div className="cta-content">
            <h2>Ready to Grow Your Craft Business?</h2>
            <p>
              Join hundreds of local artisans in Olongapo. Showcase your crafts,
              connect with buyers, and track your growth, all in one place.
            </p>
            <Link href="/profile" className="btn-start">
              <Store size={20} />
              <span>Start Selling</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* Add ProductModal */}
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
