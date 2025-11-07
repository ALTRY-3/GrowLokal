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

  const artists = [
    {
      name: "Aba Dela Cruz",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aba",
      location: "Asinan",
      lat: 14.83,
      lng: 120.28,
      craftType: "Weaving",
      image: "/artist-header.jpg",
    },
    {
      name: "Ben Yap",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ben",
      location: "Banicain",
      lat: 14.835,
      lng: 120.285,
      craftType: "Woodwork",
      image: "/artist-header.jpg",
    },
    // ...other artists
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
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 24 36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24C24 5.4 18.6 0 12 0z" fill="#2E3F36"/>
        <circle cx="12" cy="12" r="5" fill="#FFC46B"/>
      </svg>
    `,
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -42],
  });

  const artistIcon = L.divIcon({
    className: "custom-pin artist-pin",
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 24 36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24C24 5.4 18.6 0 12 0z" fill="#AF7928"/>
        <circle cx="12" cy="12" r="5" fill="#FFC46L"/>
      </svg>
    `,
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -42],
  });

  // --- Reminder ---
  const handleSetReminder = (idx: number, eventTitle: string) => {
    if (!reminders.includes(idx)) {
      setReminders([...reminders, idx]);
      toast.success(`Reminder set for "${eventTitle}"!`);
    }
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
              className={tab === "events" ? "active" : ""}
              onClick={() => setTab("events")}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} /> Events
            </button>
            <button
              className={tab === "artists" ? "active" : ""}
              onClick={() => setTab("artists")}
            >
              <FontAwesomeIcon icon={faUser} /> Artists
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
                <option value="Fair">Fair</option>
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
                placeholder="Search artist name"
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
              />
              <select
                value={craftType}
                onChange={(e) => setCraftType(e.target.value)}
              >
                <option value="">All crafts</option>
                {craftTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
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
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Radius Circle */}
        {tab === "events" && radius > 0 && (
          <Circle
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
        {tab === "artists" && artistRadius > 0 && (
          <Circle
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
            <Marker position={[event.lat, event.lng]} icon={eventIcon}>
              <Popup>
                <div className="popup-card">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="popup-img"
                    style={{
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                  <div className="popup-info">
                    <h3>{event.title}</h3>
                    <p className="date">
                      <FontAwesomeIcon
                        icon={faCalendar}
                        style={{ marginRight: 4 }}
                      />
                      {event.dateText}
                    </p>
                    <p className="location">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        style={{ marginRight: 4 }}
                      />
                      {event.location}
                    </p>
                    <p className="details">{event.details}</p>
                    <span
                      className={`all-event-type ${event.type.toLowerCase()}`}
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "14px",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        background:
                          event.type === "Festival"
                            ? "#AF7928"
                            : event.type === "Workshop"
                            ? "#2E3F36"
                            : "#FFC46B",
                        color: event.type === "Fair" ? "#2E3F36" : "#fff",
                        marginTop: "8px",
                      }}
                    >
                      {event.type}
                    </span>
                  </div>
                  <div className="popup-footer">
                    <button
                      className="popup-bell-btn"
                      title={
                        reminders.includes(idx)
                          ? "Reminder set"
                          : "Set reminder"
                      }
                      onClick={() => handleSetReminder(idx, event.title)}
                      disabled={reminders.includes(idx)}
                    >
                      <FontAwesomeIcon
                        icon={reminders.includes(idx) ? faCheck : faBell}
                      />
                    </button>
                    <button className="popup-details-btn">View Details</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Artist Markers */}
        {tab === "artists" &&
          filteredArtists.map((artist, idx) => (
            <Marker
              key={`artist-${idx}`}
              position={[artist.lat, artist.lng]}
              icon={artistIcon}
            >
              <Popup>
                <div className="popup-card">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="popup-img"
                    style={{
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                  <div className="popup-info">
                    <h3>{artist.name}</h3>
                    <p className="location">
                      <FontAwesomeIcon
                        icon={faUser}
                        style={{ color: "#af7928", marginRight: "4px" }}
                      />
                      {artist.location}
                    </p>
                    <p className="details">
                      <FontAwesomeIcon
                        icon={faPaintBrush}
                        style={{ marginRight: "4px", color: "#AF7928" }}
                      />
                      {artist.craftType}
                    </p>
                  </div>
                  <div className="popup-footer">
                    <button className="popup-details-btn">View Details</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Floating Recenter Button */}
        <RecenterButton center={center} />
      </MapContainer>

      {/* Legend Box */}
      <div className="map-legend">
        <div>
          <span className="legend-pin event-pin"></span> Events
        </div>
        <div>
          <span className="legend-pin artist-pin"></span> Artists
        </div>
      </div>
    </>
  );
}
