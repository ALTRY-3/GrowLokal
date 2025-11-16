"use client";

import Link from "next/link";
import ImageCarousel from "@/components/ImageCarousel1";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaStore, FaMapMarkerAlt } from "react-icons/fa";
import "./stories.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";

// Use the same DiceBear avatar placeholder as in home
const getProfileAvatar = (artist: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    artist
  )}`;

// Add category, craftType, location, and profilePic to Story
interface Story {
  id: string;
  img: string;
  title: string;
  artist: string;
  excerpt: string;
  category?: string | null;
  craftType?: string | null;
  location?: string | null;
  profilePic?: string | null;
  storeUrl?: string | null;
}

const featuredStories: Story[] = [
  {
    id: "1",
    img: "/artisans4.jpeg",
    title: "A Journey to the Home of Rattan Furniture Making",
    artist: "Aba Dela Cruz",
    excerpt:
      "Rattan is a strong part of Filipino cultural material tradition and Cebu is known through out the Philippines for its strong tradition in rattan furniture making. During my residency I visited Cebu to learn about both the traditional and innovative techniques furniture makers use. The techniques I learnt there gave me a strong understanding of frame making and weaving and it was with this knowledge that I returned to my studio in Manila. There I  began to experiment with rattan frame making and applying it to sculptural forms and concepts working towards an exhibition that was to be held at the end of my residency.",
    category: "Handicrafts",
    craftType: "Weaving",
    location: "Asinan",
    profilePic: "/profile1.jpg",
    storeUrl: "/artisan/1",
  },
  {
    id: "2",
    img: "/artisans4.jpg",
    title: "Grain of Time",
    artist: "Ben Yap",
    excerpt:
      "Each piece of wood I touch holds a memory, of rain, of sun, of silence. When I carve, I listen to its rhythm, the pulse hidden beneath its grain. The sound of the chisel against the wood reminds me that even something once cut down can be shaped into something new. Every curve I sand feels like rewriting a story that refuses to end.",
    category: "Handicrafts",
    craftType: "Woodwork",
    location: "Banicain",
    profilePic: "/profile2.jpg",
    storeUrl: "/artisan/2",
  },
  {
    id: "3",
    img: "/artisans1.jpg",
    title: "In the Shape of My Hands",
    artist: "Carla Abdul",
    excerpt:
      "The clay never lies. It remembers every hesitation, every moment I lose focus. When I sit at the wheel, it feels like time folds in on itself — just me, the slow spin, and the soft resistance beneath my palms.",
    category: "Handicrafts",
    craftType: "Pottery",
    location: "Baretto",
    profilePic: "/profile3.jpg",
    storeUrl: "/artisan/3",
  },
  {
    id: "4",
    img: "/artisans5.jpg",
    title: "Threads of Quiet",
    artist: "David Delo Santos",
    excerpt:
      "Each stitch feels like a whisper, a small act of patience that holds the fabric together. I lose track of time as colors bloom beneath my fingers, stories forming where there were once only blank spaces. When I finish, it’s never just a pattern — it’s a piece of calm I’ve sewn into being.",
    category: "Fashion",
    craftType: "Embroidery",
    location: "East Bajac-Bajac",
    profilePic: "/profile4.jpg",
    storeUrl: "/artisan/4",
  },
  {
    id: "5",
    img: "/artisans6.jpg",
    title: "Beads and Beauty",
    artist: "Frances Toyang",
    excerpt:
      "Tiny beads slip through my fingers like drops of light, each one holding a fragment of color and meaning. I thread them together slowly, finding rhythm in the quiet click of glass against glass. When the piece catches the sun, I see more than jewelry — I see patience turned into beauty.",
    category: "Handicrafts",
    craftType: "Jewelry Making",
    location: "Kalaklan",
    profilePic: "/profile5.jpg",
    storeUrl: "/artisan/5",
  },
  {
    id: "6",
    img: "/artisans7.png",
    title: "Threads of the Earth",
    artist: "Juan Reyes",
    excerpt:
      "I run my hands over the fabric, feeling the texture shaped by hours of weaving and dyeing. Each thread carries the story of where it came from — the soil, the plant, the hands that spun it. As the patterns come alive, I realize I’m not just making cloth; I’m preserving memory.",
    category: "Fashion",
    craftType: "Textile",
    location: "Gordon Heights",
    profilePic: "/profile6.jpg",
    storeUrl: "/artisan/6",
  },
];

function getExcerptLimit() {
  if (typeof window !== "undefined") {
    return window.innerWidth <= 700 ? 80 : 125;
  }
  return 125;
}

export default function StoriesPage() {
  const [dynamicStories, setDynamicStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchParams = useSearchParams();
  const storyId = searchParams.get("storyId");
  const [emphasizedId, setEmphasizedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setStoriesError(null);
        const response = await fetch("/api/stories");
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to load artisan stories");
        }
        setDynamicStories(payload.data || []);
      } catch (error) {
        console.error("Stories fetch error", error);
        setStoriesError(
          error instanceof Error ? error.message : "Failed to load artisan stories"
        );
      } finally {
        setStoriesLoading(false);
      }
    };

    fetchStories();
  }, []);

  const combinedStories = useMemo(() => {
    const featuredIds = new Set(featuredStories.map((story) => story.id));
    const extras = dynamicStories.filter((story) => !featuredIds.has(story.id));
    return [...featuredStories, ...extras];
  }, [dynamicStories]);

  useEffect(() => {
    if (storyId && cardRefs.current[storyId]) {
      cardRefs.current[storyId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setEmphasizedId(storyId);
      // Remove emphasis after 2 seconds
      const timer = setTimeout(() => setEmphasizedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [storyId, combinedStories.length]);

  const handleSeeMore = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <>
      <Navbar />
      <div className="stories-page">
        <div className="stories-carousel">
          <ImageCarousel autoSlide={true} slideInterval={3000} />
          <div className="stories-carousel-text">
            <h1 className="stories-carousel-title">Stories of Olongapo</h1>
            <p className="stories-carousel-subtext">
              Discover the people, culture, and heritage behind every craft.
            </p>
          </div>
        </div>

        <div className="stories-vertical-list">
          {storiesLoading && (
            <div className="stories-state">Loading artisan stories…</div>
          )}
          {!storiesLoading && storiesError && (
            <div className="stories-state stories-state-error">
              {storiesError}
            </div>
          )}
          {!storiesLoading && !storiesError && combinedStories.length === 0 && (
            <div className="stories-state">No artisan stories yet. Check back soon!</div>
          )}
          {combinedStories.map((story) => {
            const limit = getExcerptLimit();
            const isLong = story.excerpt.length > limit;
            const showFull = expanded[story.id];
            const displayExcerpt =
              showFull || !isLong
                ? story.excerpt
                : story.excerpt.slice(0, limit) + "…";

            return (
              <div
                key={story.id}
                ref={(el) => {
                  cardRefs.current[story.id] = el;
                }}
                className={`story-vertical-card${
                  emphasizedId === story.id ? " emphasized" : ""
                }`}
              >
                <div className="story-card-header">
                  <div className="story-profile">
                    <img
                      src={
                        story.profilePic && story.profilePic !== ""
                          ? story.profilePic
                          : getProfileAvatar(story.artist)
                      }
                      alt={story.artist}
                      className="story-profile-pic"
                    />
                    <div className="story-profile-info">
                      <span className="story-artist-name">{story.artist}</span>
                      <div className="story-location">
                        <FaMapMarkerAlt className="story-location-icon" />
                        <span>{story.location || "Olongapo"}</span>
                      </div>
                      <div className="story-tags">
                        {story.category && (
                          <span className="story-tag">{story.category}</span>
                        )}
                        {story.craftType && (
                          <span className="story-tag">{story.craftType}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={story.storeUrl || `/artisan/${story.id}`}
                    className="visit-store-btn"
                  >
                    <FaStore className="visit-store-icon" />
                    Visit Store
                  </Link>
                </div>
                <hr className="story-divider" />
                <div className="story-content">
                  <h2 className="story-title">{story.title}</h2>
                  <p className="story-excerpt">
                    {displayExcerpt}
                    {isLong && !showFull && (
                      <button
                        className="see-more-btn"
                        onClick={() => handleSeeMore(story.id)}
                        aria-label="See more"
                      >
                        See more
                      </button>
                    )}
                  </p>
                </div>
                <img
                  src={story.img || story.profilePic || getProfileAvatar(story.artist)}
                  alt={story.title}
                  className="story-img-wide"
                />
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}
