"use client";

import { useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./map.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCheck,
  faMap,
  faChevronDown,
  faChevronUp,
  faUser,
  faCalendar,
  faClock,
  faMapMarkerAlt,
  faPaintBrush,
  faSyncAlt,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import toast, { Toaster } from "react-hot-toast";
import { LatLngExpression } from "leaflet";
import { useRouter } from "next/navigation";

// Update artist type to include missing properties
interface Artist {
  name: string;
  avatar: string;
  location: string;
  lat: number;
  lng: number;
  craftType: string;
  image: string;
  shopName?: string;
  category?: string;
  ratingCount?: number;
  productCount?: number;
}

// --- Helper for recenter button ---
function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      className="recenter-btn"
      onClick={() => map.setView(center, 14, { animate: true })}
      aria-label="Recenter Map"
    >
      <FontAwesomeIcon icon={faSyncAlt} />
    </button>
  );
}

export default function MapContent() {
  // Temporary any-casted wrappers to suppress React 19 + react-leaflet v5 typing incompatibilities
  // Remove once upstream types support React 19 without stripping props.
  const AnyMapContainer: any = MapContainer;
  const AnyCircle: any = Circle;
  const AnyMarker: any = Marker;
  // --- Data ---
  const events = [
    {
      title: "Artisan Fair",
      date: "2025-09-15",
      location: "SM City Olongapo",
      lat: 14.8333,
      lng: 120.2828,
      details: "A four-day artisan fair featuring Filipino crafts.",
      type: "Fair",
      dateText: "September 15, 2025",
      time: "9:00 AM",
      image: "/event-header.jpg",
    },
    {
      title: "Alab Sining 2026",
      date: "2026-02-27",
      location: "SM City Olongapo Central",
      lat: 14.8355,
      lng: 120.2839,
      details: "An art exhibit showcasing works from local artists.",
      type: "Festival",
      dateText: "February 27, 2026",
      time: "9:00 AM",
      image: "/event-header.jpg",
    },
    {
      title: "This Is Not Art Escape",
      date: "2025-10-25",
      location: "Ayala Malls Harbor Point",
      lat: 14.8276,
      lng: 120.2823,
      details: "A two-day art market with handmade crafts and artworks.",
      type: "Workshop",
      dateText: "October 25, 2025",
      time: "9:00 AM",
      image: "/event-header.jpg",
    },
    {
      title: "Crft PINAY Pottery Experience",
      date: "2026-06-22",
      location: "Sibul Kapihan, SBFZ",
      lat: 14.815,
      lng: 120.315,
      details: "A pottery workshop with hands-on traditional techniques.",
      type: "Workshop",
      dateText: "June 22, 2026",
      time: "9:00 AM",
      image: "/event-header.jpg",
    },
    {
      title: "My City, My SM, My Crafts",
      date: "2025-09-16",
      location: "SM City Olongapo",
      lat: 14.8333,
      lng: 120.2828,
      details: "A showcase of local Filipino artisans and craftsmanship.",
      type: "Fair",
      dateText: "September 16, 2025",
      time: "9:00 AM",
      image: "/event-header.jpg",
    },
    {
      title: "Subic Bay Cultural Festival",
      date: "2025-09-15",
      location: "Subic Bay Freeport Zone",
      lat: 14.805,
      lng: 120.282,
      details:
        "Annual celebration of local culture featuring artisan booths, traditional performances, and cultural exhibits.",
      type: "Fair",
      dateText: "September 15, 2025",
      time: "9:00 AM",
      image: "/event-header.jpg",
    },
    {
      title: "Luzon Art Fair 2025",
      date: "2025-10-12",
      location: "Diwa ng Tarlac and Bulwagang Kanlahi, Tarlac City",
      lat: 15.485,
      lng: 120.588,
      details:
        "Olongapo Zambales Artists (OZA) is a creative collective founded in 2022, born from a shared passion to uplift and unify the art community across Olongapo and the province of Zambales.",
      type: "Festival",
      dateText: "October 12, 2025",
      time: "9:00 AM",
      image: "/event-header.jpg",
    },
    {
      title: "Sip and Sketch 'Gapo",
      date: "2025-11-05",
      location: "Café by the Bay, Olongapo City",
      lat: 14.835,
      lng: 120.285,
      details:
        "An evening of casual sketching and socializing at a local café, perfect for artists of all levels.",
      type: "Workshop",
      dateText: "November 5, 2025",
      time: "9:00 AM",
      image: "/event-header.jpg",
    },
  ];

  const artists: Artist[] = [
    {
      name: "Aba Dela Cruz",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aba",
      location: "Asinan",
      lat: 14.83,
      lng: 120.28,
      craftType: "Weaving",
      image: "/artist-header.jpg",
      shopName: "Aba's Weaving Shop",
      category: "Handicrafts",
      ratingCount: 42,
      productCount: 12,
    },
    {
      name: "Ben Yap",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ben",
      location: "Banicain",
      lat: 14.835,
      lng: 120.285,
      craftType: "Woodwork",
      image: "/artist-header.jpg",
      shopName: "Ben's Woodcraft",
      category: "Handicrafts",
      ratingCount: 38,
      productCount: 15,
    },
    // ... other artists
  ];

  // --- State ---
  const [tab, setTab] = useState<"events" | "artists">("events");
  const [reminders, setReminders] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [radius, setRadius] = useState(0);
  const [artistSearch, setArtistSearch] = useState("");
  const [craftType, setCraftType] = useState("");
  const [artistRadius, setArtistRadius] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const center: [number, number] = [14.8333, 120.2828];

  // --- Filtering ---
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = typeFilter ? event.type === typeFilter : true;
    const matchesDate = dateFilter ? event.date === dateFilter : true;
    const matchesRadius =
      radius > 0
        ? getDistance(center[0], center[1], event.lat, event.lng) <= radius
        : true;
    return matchesSearch && matchesType && matchesDate && matchesRadius;
  });

  const filteredArtists = artists.filter((artist) => {
    const matchesSearch = artist.name
      .toLowerCase()
      .includes(artistSearch.toLowerCase());
    const matchesCraft = craftType ? artist.craftType === craftType : true;
    const matchesRadius =
      artistRadius > 0
        ? getDistance(center[0], center[1], artist.lat, artist.lng) <=
          artistRadius
        : true;
    return matchesSearch && matchesCraft && matchesRadius;
  });

  // --- Icons ---
  const eventIcon = L.divIcon({
    className: "custom-pin event-pin",
    html: `
      <span style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #fff;
        border: 5px solid #2E3F36;
        box-sizing: border-box;
      ">
        <i class="fa-solid fa-calendar" style="color:#2E3F36;font-size:1.5rem;"></i>
      </span>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });

  const artistIcon = L.divIcon({
    className: "custom-pin artist-pin",
    html: `
      <span style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #fff;
        border: 4px solid #AF7928;
        box-sizing: border-box;
      ">
        <i class="fa-solid fa-store" style="color:#AF7928;font-size:1.5rem;"></i>
      </span>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });

  const router = useRouter();

  // --- Reminder ---
  const handleSetReminder = (idx: number, eventTitle: string) => {
    if (!reminders.includes(idx)) {
      setReminders([...reminders, idx]);
    }
  };

  // --- View Details handler for events ---
  const handleViewEventDetails = (event: (typeof events)[0]) => {
    // Redirect to /events?event=<event-title>
    router.push(`/events?event=${encodeURIComponent(event.title)}`);
  };

  // --- Animation for filter card ---
  const filterCardRef = useRef<HTMLDivElement>(null);

  // --- Craft types for dropdown ---
  const craftTypes = Array.from(new Set(artists.map((a) => a.craftType)));

  return (
    <>
      <Toaster position="top-center" />

      {/* Floating Glassmorphism Filter Card */}
      <div
        className={`map-filter-card${filtersOpen ? " open" : ""}`}
        ref={filterCardRef}
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="filter-tabs-row">
          <div className="filter-tabs">
            <button
              type="button"
              className={`tab-btn ${tab === "events" ? "active" : ""}`}
              onClick={() => setTab("events")}
              aria-pressed={tab === "events"}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} /> Events
            </button>

            <button
              type="button"
              className={`tab-btn ${tab === "artists" ? "active" : ""}`}
              onClick={() => setTab("artists")}
              aria-pressed={tab === "artists"}
            >
              <FontAwesomeIcon icon={faUser} /> Artisans
            </button>
          </div>
          <div
            className="filter-toggle"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <FontAwesomeIcon icon={filtersOpen ? faChevronUp : faChevronDown} />
          </div>
        </div>
        <div
          className={`filter-fields${filtersOpen ? " expanded" : ""}`}
          style={{
            maxHeight: filtersOpen ? 400 : 0,
            transition: "max-height 0.4s cubic-bezier(.4,1.4,.6,1)",
            overflow: "hidden",
          }}
        >
          {tab === "events" ? (
            <div className="filter-fields-inner">
              <input
                type="text"
                placeholder="Search event title"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All types</option>
                <option value="Festival">Festival</option>
                <option value="Fair">Craft Fair</option>
                <option value="Workshop">Local Market</option>
                <option value="Workshop">Cultural Show</option>
                <option value="Workshop">Workshop</option>
                <option value="Workshop">Business Campaign</option>
                <option value="Workshop">Workshop</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              >
                <option value={0}>Any distance</option>
                <option value={2}>Within 2 km</option>
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
              </select>
            </div>
          ) : (
            <div className="filter-fields-inner">
              <input
                type="text"
                placeholder="Search artisan or shop name"
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
              />
              <select
                value={craftType}
                onChange={(e) => setCraftType(e.target.value)}
              >
                <option value="">All crafts</option>
                {/* Static craft types */}
                <option value="Weaving">Weaving</option>
                <option value="Woodwork">Woodwork</option>
                <option value="Pottery">Pottery</option>
                <option value="Embroidery">Embroidery</option>
                <option value="Basketry">Basketry</option>
                <option value="Cooking">Cooking</option>
                <option value="Textile">Textile</option>
                <option value="Jewelry Making">Jewelry Making</option>
                <option value="Leatherwork">Leatherwork</option>
                <option value="Cosmetics">Cosmetics</option>
                {/* Dynamic craft types from data */}
                {craftTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={"" /* You can add a state for category if needed */}
                onChange={() => {}}
              >
                <option value="">All categories</option>
                <option value="Traditional">Handicrafts</option>
                <option value="Modern">Fashion</option>
                <option value="Fashion">Home</option>
                <option value="Home">Beauty & Wellness</option>
                <option value="Food">Food</option>
                {/* Add more categories as needed */}
              </select>
              <select
                value={artistRadius}
                onChange={(e) => setArtistRadius(Number(e.target.value))}
              >
                <option value={0}>Any distance</option>
                <option value={2}>Within 2 km</option>
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <AnyMapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Events radius circle */}
        {tab === "events" && radius > 0 && (
          <AnyCircle
            center={center}
            radius={radius * 1000}
            pathOptions={{
              color: "#2E3F36",
              fillColor: "#2E3F36",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 6",
            }}
          />
        )}

        {/* Artists radius circle */}
        {tab === "artists" && artistRadius > 0 && (
          <AnyCircle
            center={center}
            radius={artistRadius * 1000}
            pathOptions={{
              color: "#AF7928",
              fillColor: "#AF7928",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 6",
            }}
          />
        )}

        {/* Event Markers */}
        {tab === "events" &&
          filteredEvents.map((event, idx) => (
            <AnyMarker
              position={[event.lat, event.lng]}
              icon={eventIcon}
              key={idx}
            >
              <Popup>
                <div className="popup-info">
                  {/* Category and Bell Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span className={`map-event-type`}>{event.type}</span>
                    <button
                      className="popup-bell-btn"
                      title={
                        reminders.includes(idx)
                          ? "Reminder set"
                          : "Set reminder"
                      }
                      onClick={() => handleSetReminder(idx, event.title)}
                      disabled={reminders.includes(idx)}
                      style={{ marginLeft: "auto" }}
                    >
                      <FontAwesomeIcon
                        icon={reminders.includes(idx) ? faCheck : faBell}
                      />
                    </button>
                  </div>
                  {/* Title and details */}
                  <h3>{event.title}</h3>
                  <p className="date">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      style={{ marginRight: 4 }}
                    />
                    {event.dateText}
                  </p>
                  <p className="details">{event.details}</p>
                  <br />
                  {/* Location row below description */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      margin: "6px 0 0 0",
                    }}
                  >
                    {/* Location icon in circle */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "28px",
                        height: "28px",
                        background: "#fff",
                        marginRight: "8px",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        style={{ color: "#2E3F36", fontSize: "1.5rem" }}
                      />
                    </span>
                    <span
                      style={{
                        fontStyle: "italic",
                        fontWeight: 500,
                        color: "#2E3F36",
                        fontSize: "0.92rem",
                      }}
                    >
                      {event.location} [{event.lat.toFixed(4)},{" "}
                      {event.lng.toFixed(4)}]
                    </span>
                  </div>
                  <div
                    className="popup-footer"
                    style={{
                      display: "flex",
                      width: "100%",
                      padding: "8px 0 0 0",
                    }}
                  >
                    <button
                      className="popup-details-btn"
                      style={{
                        flex: 1,
                        width: "100%",
                        justifyContent: "center",
                        display: "flex",
                      }}
                      onClick={() => handleViewEventDetails(event)}
                    >
                      View Events Details
                    </button>
                  </div>
                </div>
              </Popup>
            </AnyMarker>
          ))}

        {/* Artist Markers */}
        {tab === "artists" &&
          filteredArtists.map((artist, idx) => (
            <AnyMarker
              key={`artist-${idx}`}
              position={[artist.lat, artist.lng]}
              icon={artistIcon}
            >
              <Popup>
                <div
                  className="popup-info"
                  style={{ display: "flex", alignItems: "flex-start" }}
                >
                  {/* Profile picture on the left */}
                  <img
                    src={artist.avatar}
                    alt={artist.name}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: "12px",
                      border: "2px solid #AF7928",
                      background: "#fff",
                      flexShrink: 0,
                    }}
                  />
                  {/* Info on the right */}
                  <div style={{ flex: 1 }}>
                    {/* Artist name */}
                    <h3
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        color: "#2E3F36",
                      }}
                    >
                      {artist.name}
                    </h3>
                    {/* Shop icon and shop name */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "22px",
                          height: "22px",
                          background: "#fff",
                          marginRight: "6px",
                        }}
                      >
                        <i
                          className="fa-solid fa-shop"
                          style={{ color: "#AF7928", fontSize: "1rem" }}
                        ></i>
                      </span>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#2E3F36",
                          fontSize: "0.95rem",
                        }}
                      >
                        {artist.shopName || `${artist.name}'s Shop`}
                      </span>
                    </div>
                    {/* Craft type and category tags, full width */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "8px",
                        width: "100%",
                      }}
                    >
                      <span
                        className="map-event-type"
                        style={{ flex: 1, textAlign: "center" }}
                      >
                        {artist.craftType}
                      </span>
                      <span
                        className="map-event-type"
                        style={{ flex: 1, textAlign: "center" }}
                      >
                        {artist.category || "Handicrafts"}
                      </span>
                    </div>
                    {/* Shop rating and product count row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "8px",
                        width: "100%",
                      }}
                    >
                      {/* Shop rating count */}
                      <span
                        style={{
                          color: "#2E3F36",
                          fontWeight: 500,
                          fontSize: "0.95rem",
                        }}
                      >
                        {artist.ratingCount ?? 0} Ratings
                      </span>
                      {/* Vertical line */}
                      <span
                        style={{
                          display: "inline-block",
                          width: "1px",
                          height: "18px",
                          background: "#787878ff",
                          margin: "0 12px",
                        }}
                      ></span>
                      {/* Number of products */}
                      <span
                        style={{
                          color: "#2E3F36",
                          fontWeight: 500,
                          fontSize: "0.95rem",
                        }}
                      >
                        {artist.productCount ?? 0} Products
                      </span>
                    </div>
                  </div>
                </div>
                {/* Location row, full width below profile/info */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "8px 0 0 0",
                    width: "100%",
                    padding: "0 12px",
                  }}
                >
                  {/* Location icon in circle */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      background: "#fff",
                      marginRight: "8px",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      style={{ color: "#2E3F36", fontSize: "1.5rem" }}
                    />
                  </span>
                  <span
                    style={{
                      fontStyle: "italic",
                      fontWeight: 500,
                      color: "#2E3F36",
                      fontSize: "0.92rem",
                    }}
                  >
                    {artist.location} [{artist.lat.toFixed(4)},{" "}
                    {artist.lng.toFixed(4)}]
                  </span>
                </div>
                <div
                  className="popup-footer"
                  style={{
                    display: "flex",
                    width: "100%",
                    padding: "8px 0 0 0",
                  }}
                >
                  <button
                    className="popup-details-btn"
                    style={{
                      flex: 1,
                      width: "100%",
                      justifyContent: "center",
                      display: "flex",
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    Visit Shop
                  </button>
                </div>
              </Popup>
            </AnyMarker>
          ))}

        {/* Floating Recenter Button */}
        <RecenterButton center={center} />
      </AnyMapContainer>

      {/* Legend Box */}
      <div className="map-legend">
        <div>
          <span
            className="legend-pin event-pin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#fff",
              border: "2px solid #2E3F36",
              boxSizing: "border-box",
              marginRight: "8px",
            }}
          >
            <i
              className="fa-solid fa-calendar"
              style={{ color: "#2E3F36", fontSize: "1rem" }}
            ></i>
          </span>
          Events
        </div>
        <div>
          <span
            className="legend-pin artist-pin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#fff",
              border: "2px solid #FFC46B",
              boxSizing: "border-box",
              marginRight: "8px",
            }}
          >
            <i
              className="fa-solid fa-store"
              style={{ color: "#AF7928", fontSize: "1rem" }}
            ></i>
          </span>
          Artists
        </div>
      </div>
    </>
  );
}
