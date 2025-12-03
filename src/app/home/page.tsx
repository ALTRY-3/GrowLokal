"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageCarousel from "@/components/ImageCarousel1";
import ProductModal from "@/components/ProductModal"; // Add this import
import { useWishlist } from "@/lib/useWishlist";
import { FaStar } from "react-icons/fa";

const HomeMapPreview = dynamic(() => import("@/components/HomeMapPreview"), {
  ssr: false,
});
import { MapPin, Sparkles, Globe, Flame } from "lucide-react";
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

// ===== MOCK DATA FOR NEW SECTIONS =====

// Trending Crafts data
const trendingCrafts = [
  {
    id: 101,
    name: "Handwoven Buri Bag",
    price: 79,
    artist: "Aba Dela Cruz",
    category: "Handicrafts",
    craftType: "Weaving",
    barangay: "Asinan",
    image: "/box7.png",
    trendingCount: 243,
  },
  {
    id: 102,
    name: "Embroidered Shawls",
    price: 699,
    artist: "David Delo Santos",
    category: "Fashion",
    craftType: "Embroidery",
    barangay: "East Bajac-Bajac",
    image: "/fashion5.png",
    trendingCount: 189,
  },
  {
    id: 103,
    name: "Hardin Beaded Earrings",
    price: 499,
    artist: "Frances Toyang",
    category: "Handicrafts",
    craftType: "Jewelry Making",
    barangay: "Kalaklan",
    image: "/box6.png",
    trendingCount: 156,
  },
  {
    id: 104,
    name: "Rice Grooved Kuksa Mug",
    price: 449,
    artist: "Ben Yap",
    category: "Handicrafts",
    craftType: "Woodwork",
    barangay: "Banicain",
    image: "/home6.png",
    trendingCount: 134,
  },
];

// Trending Artisan Shops data
const trendingArtisans = [
  {
    id: 201,
    name: "Aba Dela Cruz",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aba",
    craftType: "Weaving",
    category: "Handicrafts",
    location: "Asinan",
    rating: 4.8,
    productsCount: 24,
    viewsThisWeek: 487,
  },
  {
    id: 202,
    name: "Ben Yap",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ben",
    craftType: "Woodwork",
    category: "Handicrafts",
    location: "Banicain",
    rating: 4.6,
    productsCount: 18,
    viewsThisWeek: 412,
  },
  {
    id: 203,
    name: "David Delo Santos",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    craftType: "Embroidery",
    category: "Fashion",
    location: "East Bajac-Bajac",
    rating: 4.6,
    productsCount: 18,
    viewsThisWeek: 356,
  },
  {
    id: 204,
    name: "Frances Toyang",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frances",
    craftType: "Jewelry Making",
    category: "Handicrafts",
    location: "Kalaklan",
    rating: 4.7,
    productsCount: 21,
    viewsThisWeek: 298,
  },
];

// Trending Local Events data
const trendingEvents = [
  {
    id: 301,
    title: "Handcraft Workshop: Buri Weaving",
    date: "Dec 15, 2024",
    location: "Asinan Community Center",
    type: "Workshop",
    viewsThisWeek: 234,
  },
  {
    id: 302,
    title: "Olongapo Artisan Market",
    date: "Dec 16, 2024",
    location: "Subic Bay Freeport Zone",
    type: "Market",
    viewsThisWeek: 189,
  },
  {
    id: 303,
    title: "Cultural Heritage Tour",
    date: "Dec 17, 2024",
    location: "Downtown Olongapo",
    type: "Tour",
    viewsThisWeek: 156,
  },
  {
    id: 304,
    title: "Local Craft Fair 2024",
    date: "Dec 22, 2024",
    location: "Olongapo Convention Center",
    type: "Fair",
    viewsThisWeek: 312,
  },
];

// Newest Uploads data
const newestUploads = [
  {
    id: 401,
    name: "Organic Natural Soap",
    price: 189,
    artist: "Ebon Santos",
    category: "Beauty & Wellness",
    craftType: "Cosmetics",
    barangay: "East Tapinac",
    image: "/beauty3.png",
    uploadedDaysAgo: 2,
  },
  {
    id: 402,
    name: "Printed Cotton Tote Bag",
    price: 299,
    artist: "Juan Reyes",
    category: "Fashion",
    craftType: "Textile",
    barangay: "Gordon Heights",
    image: "/fashion5.png",
    uploadedDaysAgo: 3,
  },
  {
    id: 403,
    name: "Hand-Carved Wooden Box",
    price: 899,
    artist: "Ben Yap",
    category: "Handicrafts",
    craftType: "Woodwork",
    barangay: "Banicain",
    image: "/home6.png",
    uploadedDaysAgo: 1,
  },
  {
    id: 404,
    name: "Traditional Ube Jam",
    price: 259,
    artist: "Rei Bustamante",
    category: "Food",
    craftType: "Cooking",
    barangay: "New Ilalim",
    image: "/food6.png",
    uploadedDaysAgo: 4,
  },
];

// Most Viewed by Travelers data
const viewedByTravelers = [
  {
    id: 501,
    name: "Authentic Souvenir Pack",
    price: 599,
    artist: "Mixed Artisans",
    category: "Handicrafts",
    craftType: "Curated Gift",
    barangay: "Multiple",
    image: "/box6.png",
    travelersViews: 567,
  },
  {
    id: 502,
    name: "Olongapo Local Map Guide",
    price: 199,
    artist: "Tourism Board",
    category: "Travel",
    craftType: "Guide",
    barangay: "Downtown",
    image: "/home6.png",
    travelersViews: 489,
  },
  {
    id: 503,
    name: "Festival Merchandise Bundle",
    price: 899,
    artist: "Local Events",
    category: "Merchandise",
    craftType: "Special Edition",
    barangay: "Various",
    image: "/fashion5.png",
    travelersViews: 412,
  },
  {
    id: 504,
    name: "Handmade Travel Diary",
    price: 349,
    artist: "Frances Toyang",
    category: "Handicrafts",
    craftType: "Bookbinding",
    barangay: "Kalaklan",
    image: "/box7.png",
    travelersViews: 378,
  },
];

// Types for recommendations
interface RecommendedEvent {
  id: number;
  title: string;
  date: string;
  dateText: string;
  time: string;
  location: string;
  type: string;
  details: string;
  organizer?: string;
  featuredArtisan?: string;
  matchReason: string;
  matchScore: number;
}

interface RecommendedArtisan {
  id: string;
  name: string;
  shopName: string;
  avatar: string;
  craftType: string;
  category: string;
  location: string;
  rating: number;
  productsCount: number;
  matchReason: string;
  matchScore: number;
}

export default function HomePage() {
  const [eventReminders, setEventReminders] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Change this

  // Recommendations state
  const [recommendedEvents, setRecommendedEvents] = useState<
    RecommendedEvent[]
  >([]);
  const [recommendedArtisans, setRecommendedArtisans] = useState<
    RecommendedArtisan[]
  >([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [canScrollRecommendations, setCanScrollRecommendations] = useState({
    left: false,
    right: true,
  });

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

  // New carousel scroll states for "What's Popular" section
  const [canScrollTrendingCrafts, setCanScrollTrendingCrafts] = useState({
    left: false,
    right: true,
  });
  const [canScrollTrendingArtisans, setCanScrollTrendingArtisans] = useState({
    left: false,
    right: true,
  });
  const [canScrollTrendingEvents, setCanScrollTrendingEvents] = useState({
    left: false,
    right: true,
  });
  const [canScrollNewestUploads, setCanScrollNewestUploads] = useState({
    left: false,
    right: true,
  });
  const [canScrollTravelerViews, setCanScrollTravelerViews] = useState({
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
  const storiesRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  // Refs for "What's Popular" section carousels
  const trendingCraftsRef = useRef<HTMLDivElement>(null);
  const trendingArtisansRef = useRef<HTMLDivElement>(null);
  const trendingEventsRef = useRef<HTMLDivElement>(null);
  const newestUploadsRef = useRef<HTMLDivElement>(null);
  const travelerViewsRef = useRef<HTMLDivElement>(null);

  // Fetch personalized recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      setRecommendationsLoading(true);

      // Get user preferences from localStorage
      const viewedCategories = JSON.parse(
        localStorage.getItem("viewedCategories") || "[]"
      );
      const interests = JSON.parse(
        localStorage.getItem("userInterests") || "[]"
      );
      const recentSearches = JSON.parse(
        localStorage.getItem("recentSearches") || "[]"
      );
      const userLocation = localStorage.getItem("userLocation") || "";

      const params = new URLSearchParams();
      if (viewedCategories.length)
        params.set("viewedCategories", viewedCategories.join(","));
      if (interests.length) params.set("interests", interests.join(","));
      if (recentSearches.length)
        params.set("recentSearches", recentSearches.slice(0, 5).join(","));
      if (userLocation) params.set("userLocation", userLocation);

      const response = await fetch(
        `/api/home/recommendations?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setRecommendedEvents(data.data.events || []);
        setRecommendedArtisans(data.data.artisans || []);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Recheck scroll position when recommendations finish loading
  useEffect(() => {
    if (!recommendationsLoading) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        checkScrollPosition(
          recommendationsRef.current,
          setCanScrollRecommendations
        );
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [recommendationsLoading]);

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

  const scroll = (
    direction: "left" | "right",
    container: HTMLDivElement | null,
    setCanScroll?: React.Dispatch<
      React.SetStateAction<{ left: boolean; right: boolean }>
    >
  ): void => {
    if (!container) return;
    const cardWidth = 312;
    const gap = 24;
    const scrollDistance = cardWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollDistance : scrollDistance,
      behavior: "smooth",
    });

    // Update button visibility after scroll animation
    if (setCanScroll) {
      setTimeout(() => {
        checkScrollPosition(container, setCanScroll);
      }, 350);
    }
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
          recommendationsRef.current,
          setCanScrollRecommendations
        );
        // New popular section carousels
        checkScrollPosition(
          trendingCraftsRef.current,
          setCanScrollTrendingCrafts
        );
        checkScrollPosition(
          trendingArtisansRef.current,
          setCanScrollTrendingArtisans
        );
        checkScrollPosition(
          trendingEventsRef.current,
          setCanScrollTrendingEvents
        );
        checkScrollPosition(
          newestUploadsRef.current,
          setCanScrollNewestUploads
        );
        checkScrollPosition(
          travelerViewsRef.current,
          setCanScrollTravelerViews
        );
      }, 100);
    };

    const containers = [
      featuredRef.current,
      artisansRef.current,
      eventsRef.current,
      storiesRef.current,
      recommendationsRef.current,
      trendingCraftsRef.current,
      trendingArtisansRef.current,
      trendingEventsRef.current,
      newestUploadsRef.current,
      travelerViewsRef.current,
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
      checkScrollPosition(
        recommendationsRef.current,
        setCanScrollRecommendations
      );
      // New popular section carousels
      checkScrollPosition(
        trendingCraftsRef.current,
        setCanScrollTrendingCrafts
      );
      checkScrollPosition(
        trendingArtisansRef.current,
        setCanScrollTrendingArtisans
      );
      checkScrollPosition(
        trendingEventsRef.current,
        setCanScrollTrendingEvents
      );
      checkScrollPosition(newestUploadsRef.current, setCanScrollNewestUploads);
      checkScrollPosition(travelerViewsRef.current, setCanScrollTravelerViews);
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
            Discover Olongapo's Local{" "}
            <span className="highlight">Crafts, Culture & Stories</span>
          </h1>
          <p className="hero-text">
            Shop handmade treasures, explore artisan stories, and experience the
            heart of Olongapo — crafted for locals, travelers, and culture
            lovers from around the world.
          </p>
          <div className="hero-tagline-strip">
            <div className="tagline-item">
              <span className="tagline-flag-badge">🇵🇭</span>
              <span className="tagline-text">Proudly Olongapo-Made</span>
            </div>
            <div className="tagline-divider"></div>
            <div className="tagline-item">
              <span className="tagline-icon">👥</span>
              <span className="tagline-text">100+ Local Artisans</span>
            </div>
            <div className="tagline-divider"></div>
            <div className="tagline-item">
              <span className="tagline-icon">❤️</span>
              <span className="tagline-text">Loved by Travelers & Locals</span>
            </div>
          </div>
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
        {/* RECOMMENDED FOR YOU */}
        <section className="section bg-alt recommended-section">
          <div className="home-section-header">
            <div>
              <div className="section-title-with-icon">
                <Sparkles className="sparkle-icon" size={24} />
                <h2>Personalized Picks Just for You</h2>
              </div>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#666",
                  marginTop: "0.35rem",
                  marginBottom: "0",
                  fontWeight: "400",
                }}
              >
                Discover events, shops, and crafts that match your interests,
                browsing habits, and location.
              </p>
            </div>
            <span className="personalized-badge">Personalized</span>
          </div>

          {recommendationsLoading ? (
            <div className="recommendations-loading">
              <div className="recommendations-skeleton">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line short"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="carousel-container">
              {canScrollRecommendations.left && (
                <button
                  className="home-nav-button prev"
                  onClick={() =>
                    scroll(
                      "left",
                      recommendationsRef.current,
                      setCanScrollRecommendations
                    )
                  }
                  aria-label="Previous"
                >
                  <FaChevronLeft />
                </button>
              )}

              <div
                className="home-recommendations-carousel"
                ref={recommendationsRef}
              >
                {/* Recommended Events */}
                {recommendedEvents.slice(0, 3).map((event) => (
                  <div
                    className="home-recommendation-card event-card"
                    key={`event-${event.id}`}
                  >
                    <div className="recommendation-header">
                      <div className="recommendation-match-reason">
                        <Sparkles size={12} />
                        <span>{event.matchReason}</span>
                      </div>
                    </div>
                    <div className="recommendation-content">
                      <div className="recommendation-labels">
                        <span className="recommendation-badge recommendation-badge-event">
                          <Calendar size={12} />
                          <span>Event</span>
                        </span>
                        <span className="recommendation-type">
                          {event.type}
                        </span>
                      </div>
                      <h3 className="recommendation-title">{event.title}</h3>
                      <p className="recommendation-date">{event.dateText}</p>
                      <div className="recommendation-location">
                        <MapPin size={12} />
                        <span>{event.location}</span>
                      </div>
                      {event.featuredArtisan && (
                        <p className="recommendation-featured">
                          Featuring: {event.featuredArtisan}
                        </p>
                      )}
                      <button
                        className="recommendation-action"
                        onClick={() => handleViewDetails(event.title)}
                      >
                        View Event <FaChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Recommended Artisans */}
                {recommendedArtisans.slice(0, 3).map((artisan) => (
                  <div
                    className="home-recommendation-card artisan-card"
                    key={`artisan-${artisan.id}`}
                  >
                    <div className="recommendation-header">
                      <div className="recommendation-match-reason">
                        <Sparkles size={12} />
                        <span>{artisan.matchReason}</span>
                      </div>
                    </div>
                    <div className="recommendation-content">
                      <div className="recommendation-labels">
                        <span className="recommendation-badge recommendation-badge-artisan">
                          <Store size={12} />
                          <span>Shop</span>
                        </span>
                      </div>
                      <div className="recommendation-artisan-header">
                        <img
                          src={artisan.avatar}
                          alt={artisan.name}
                          className="recommendation-avatar"
                        />
                        <div className="recommendation-artisan-info">
                          <h3 className="recommendation-title">
                            {artisan.shopName}
                          </h3>
                          <p className="recommendation-artist">
                            by {artisan.name}
                          </p>
                        </div>
                      </div>
                      <div className="recommendation-tags">
                        <span className="recommendation-tag craft-type">
                          {artisan.craftType}
                        </span>
                        <span className="recommendation-tag category">
                          {artisan.category}
                        </span>
                      </div>
                      <div className="recommendation-location">
                        <MapPin size={12} />
                        <span>{artisan.location}</span>
                      </div>
                      <div className="recommendation-meta">
                        <div className="recommendation-rating">
                          <FaStar className="star-icon" />
                          <span>{artisan.rating.toFixed(1)}</span>
                        </div>
                        <span className="recommendation-products">
                          {artisan.productsCount} products
                        </span>
                      </div>
                      <Link
                        href={`/artisan/${artisan.id}`}
                        className="recommendation-action"
                      >
                        Visit Shop <FaChevronRight size={10} />
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Show placeholder cards if no recommendations yet */}
                {recommendedEvents.length === 0 &&
                  recommendedArtisans.length === 0 && (
                    <>
                      {upcomingEvents.slice(0, 3).map((event, index) => (
                        <div
                          className="home-recommendation-card event-card"
                          key={`fallback-event-${index}`}
                        >
                          <div className="recommendation-header">
                            <div className="recommendation-match-reason">
                              <Sparkles size={12} />
                              <span>Popular event</span>
                            </div>
                          </div>
                          <div className="recommendation-content">
                            <div className="recommendation-labels">
                              <span className="recommendation-badge recommendation-badge-event">
                                <Calendar size={12} />
                                <span>Event</span>
                              </span>
                              <span className="recommendation-type">
                                {event.type}
                              </span>
                            </div>
                            <h3 className="recommendation-title">
                              {event.title}
                            </h3>
                            <p className="recommendation-date">{event.date}</p>
                            <div className="recommendation-location">
                              <MapPin size={12} />
                              <span>{event.location}</span>
                            </div>
                            <button
                              className="recommendation-action"
                              onClick={() => handleViewDetails(event.title)}
                            >
                              View Event <FaChevronRight size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {topArtisans.slice(0, 3).map((artisan) => (
                        <div
                          className="home-recommendation-card artisan-card"
                          key={`fallback-artisan-${artisan.id}`}
                        >
                          <div className="recommendation-header">
                            <div className="recommendation-match-reason">
                              <Sparkles size={12} />
                              <span>Popular artisan</span>
                            </div>
                          </div>
                          <div className="recommendation-content">
                            <div className="recommendation-labels">
                              <span className="recommendation-badge recommendation-badge-artisan">
                                <Store size={12} />
                                <span>Shop</span>
                              </span>
                            </div>
                            <div className="recommendation-artisan-header">
                              <img
                                src={artisan.avatar}
                                alt={artisan.name}
                                className="recommendation-avatar"
                              />
                              <div className="recommendation-artisan-info">
                                <h3 className="recommendation-title">
                                  {artisan.name}
                                </h3>
                                <p className="recommendation-artist">
                                  {artisan.craftType}
                                </p>
                              </div>
                            </div>
                            <div className="recommendation-tags">
                              <span className="recommendation-tag craft-type">
                                {artisan.craftType}
                              </span>
                              <span className="recommendation-tag category">
                                {artisan.category}
                              </span>
                            </div>
                            <div className="recommendation-location">
                              <MapPin size={12} />
                              <span>{artisan.location}</span>
                            </div>
                            <div className="recommendation-meta">
                              <div className="recommendation-rating">
                                <FaStar className="star-icon" />
                                <span>{artisan.rating.toFixed(1)}</span>
                              </div>
                              <span className="recommendation-products">
                                {artisan.productsCount} products
                              </span>
                            </div>
                            <Link
                              href={`/artisan/${artisan.id}`}
                              className="recommendation-action"
                            >
                              Visit Shop <FaChevronRight size={10} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
              </div>

              {canScrollRecommendations.right && (
                <button
                  className="home-nav-button next"
                  onClick={() =>
                    scroll(
                      "right",
                      recommendationsRef.current,
                      setCanScrollRecommendations
                    )
                  }
                  aria-label="Next"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>
          )}
        </section>

        {/* WHAT'S POPULAR THIS WEEK IN OLONGAPO */}
        <section className="section bg-white">
          <div className="home-section-header">
            <div>
              <h2>What's Popular This Week in Olongapo</h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#666",
                  marginTop: "0.35rem",
                  marginBottom: "0",
                  fontWeight: "400",
                }}
              >
                See what locals and travelers are discovering and loving right
                now.
              </p>
            </div>
          </div>

          {/* Trending Crafts Subsection */}
          <div style={{ marginBottom: "3rem" }}>
            <h3 className="popular-subsection-title">
              <Flame
                size={18}
                style={{ marginRight: "0.5rem", color: "#af7928" }}
              />
              Trending Crafts
              <span className="popular-subsection-subtitle">
                Updated Weekly
              </span>
            </h3>
            <div className="carousel-container">
              {canScrollTrendingCrafts.left && (
                <button
                  className="home-nav-button prev"
                  onClick={() =>
                    scroll(
                      "left",
                      trendingCraftsRef.current,
                      setCanScrollTrendingCrafts
                    )
                  }
                  aria-label="Previous"
                >
                  <FaChevronLeft />
                </button>
              )}
              <div className="home-product-carousel" ref={trendingCraftsRef}>
                {trendingCrafts.map((product) => (
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
                        <p className="home-product-price">₱{product.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {canScrollTrendingCrafts.right && (
                <button
                  className="home-nav-button next"
                  onClick={() =>
                    scroll(
                      "right",
                      trendingCraftsRef.current,
                      setCanScrollTrendingCrafts
                    )
                  }
                  aria-label="Next"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>
          </div>

          {/* Trending Artisan Shops Subsection */}
          <div style={{ marginBottom: "3rem" }}>
            <h3 className="popular-subsection-title">
              <Flame
                size={18}
                style={{ marginRight: "0.5rem", color: "#af7928" }}
              />
              Trending Artisan Shops
              <span className="popular-subsection-subtitle">Most Visited</span>
            </h3>
            <div className="carousel-container">
              {canScrollTrendingArtisans.left && (
                <button
                  className="home-nav-button prev"
                  onClick={() =>
                    scroll(
                      "left",
                      trendingArtisansRef.current,
                      setCanScrollTrendingArtisans
                    )
                  }
                  aria-label="Previous"
                >
                  <FaChevronLeft />
                </button>
              )}
              <div className="home-artisan-carousel" ref={trendingArtisansRef}>
                {trendingArtisans.map((artisan) => (
                  <div className="home-artisan-card" key={artisan.id}>
                    <Link
                      href={`/artisan/${artisan.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div className="home-artisan-profile">
                        <img
                          src={artisan.avatar}
                          alt={artisan.name}
                          className="home-artisan-avatar"
                        />
                        <div className="home-artisan-info">
                          <h3 className="home-artisan-name">{artisan.name}</h3>
                          <span className="home-artisan-category">
                            {artisan.craftType}
                          </span>
                          <p className="home-artisan-location">
                            <MapPin size={12} />
                            {artisan.location}
                          </p>
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
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              {canScrollTrendingArtisans.right && (
                <button
                  className="home-nav-button next"
                  onClick={() =>
                    scroll(
                      "right",
                      trendingArtisansRef.current,
                      setCanScrollTrendingArtisans
                    )
                  }
                  aria-label="Next"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>
          </div>

          {/* Trending Local Events Subsection */}
          <div style={{ marginBottom: "3rem" }}>
            <h3 className="popular-subsection-title">
              <Flame
                size={18}
                style={{ marginRight: "0.5rem", color: "#af7928" }}
              />
              Trending Local Events
              <span className="popular-subsection-subtitle">Top Picks</span>
            </h3>
            <div className="carousel-container">
              {canScrollTrendingEvents.left && (
                <button
                  className="home-nav-button prev"
                  onClick={() =>
                    scroll(
                      "left",
                      trendingEventsRef.current,
                      setCanScrollTrendingEvents
                    )
                  }
                  aria-label="Previous"
                >
                  <FaChevronLeft />
                </button>
              )}
              <div className="home-event-carousel" ref={trendingEventsRef}>
                {trendingEvents.map((event) => (
                  <div className="home-event-card" key={event.id}>
                    <div className="home-event-header">
                      <span className="home-event-type">{event.type}</span>
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
              {canScrollTrendingEvents.right && (
                <button
                  className="home-nav-button next"
                  onClick={() =>
                    scroll(
                      "right",
                      trendingEventsRef.current,
                      setCanScrollTrendingEvents
                    )
                  }
                  aria-label="Next"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>
          </div>

          {/* Newest Uploads Subsection */}
          <div style={{ marginBottom: "3rem" }}>
            <h3 className="popular-subsection-title">
              <Flame
                size={18}
                style={{ marginRight: "0.5rem", color: "#af7928" }}
              />
              Newest Uploads
              <span className="popular-subsection-subtitle">
                Fresh Additions
              </span>
            </h3>
            <div className="carousel-container">
              {canScrollNewestUploads.left && (
                <button
                  className="home-nav-button prev"
                  onClick={() =>
                    scroll(
                      "left",
                      newestUploadsRef.current,
                      setCanScrollNewestUploads
                    )
                  }
                  aria-label="Previous"
                >
                  <FaChevronLeft />
                </button>
              )}
              <div className="home-product-carousel" ref={newestUploadsRef}>
                {newestUploads.map((product) => (
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
                        </div>
                      </div>
                      <div className="home-product-info-bottom">
                        <p className="home-product-price">₱{product.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {canScrollNewestUploads.right && (
                <button
                  className="home-nav-button next"
                  onClick={() =>
                    scroll(
                      "right",
                      newestUploadsRef.current,
                      setCanScrollNewestUploads
                    )
                  }
                  aria-label="Next"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>
          </div>

          {/* Most Viewed by Travelers Subsection */}
          <div>
            <h3 className="popular-subsection-title">
              <Flame
                size={18}
                style={{ marginRight: "0.5rem", color: "#af7928" }}
              />
              Most Viewed by Travelers This Week
              <span className="popular-subsection-subtitle">
                Based on Views
              </span>
            </h3>
            <div className="carousel-container">
              {canScrollTravelerViews.left && (
                <button
                  className="home-nav-button prev"
                  onClick={() =>
                    scroll(
                      "left",
                      travelerViewsRef.current,
                      setCanScrollTravelerViews
                    )
                  }
                  aria-label="Previous"
                >
                  <FaChevronLeft />
                </button>
              )}
              <div className="home-product-carousel" ref={travelerViewsRef}>
                {viewedByTravelers.map((product) => (
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
                        </div>
                      </div>
                      <div className="home-product-info-bottom">
                        <p className="home-product-price">₱{product.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {canScrollTravelerViews.right && (
                <button
                  className="home-nav-button next"
                  onClick={() =>
                    scroll(
                      "right",
                      travelerViewsRef.current,
                      setCanScrollTravelerViews
                    )
                  }
                  aria-label="Next"
                >
                  <FaChevronRight />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}

        {/* ARTISAN STORIES */}
        <section className="section bg-alt">
          <div className="home-section-header">
            <div>
              <h2>Stories Behind the Craft</h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#666",
                  marginTop: "0.35rem",
                  marginBottom: "0",
                  fontWeight: "400",
                }}
              >
                Discover the journeys and traditions that shape every handmade
                creation.
              </p>
            </div>
            <Link href="/stories" className="home-see-all">
              Read More <FaChevronRight className="home-arrow-icon" />
            </Link>
          </div>

          <div className="carousel-container">
            {canScrollStories.left && (
              <button
                className="home-nav-button prev"
                onClick={() =>
                  scroll("left", storiesRef.current, setCanScrollStories)
                }
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
                onClick={() =>
                  scroll("right", storiesRef.current, setCanScrollStories)
                }
                aria-label="Next"
              >
                <FaChevronRight />
              </button>
            )}
          </div>
        </section>

        {/* EXPLORE OLONGAPO ON THE MAP */}
        <section className="section bg-white">
          <div className="home-section-header">
            <div>
              <h2>Explore Olongapo on the Map</h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#666",
                  marginTop: "0.35rem",
                  marginBottom: "0",
                  fontWeight: "400",
                }}
              >
                Discover artisan shops, events, and cultural spots across
                Olongapo.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "2rem",
              padding: "0",
              width: "100%",
            }}
          >
            <div className="map-preview-card">
              <HomeMapPreview />
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/map" className="map-preview-cta">
              <MapPin size={16} />
              View Full Map
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="section bg-alt full-width become-seller-cta">
          <div className="cta-content">
            <h2>Ready to Grow Your Craft Business?</h2>
            <p>
              Join Olongapo's artisan community. Showcase your creations and
              reach new customers.
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
