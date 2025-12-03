"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OLONGAPO_MAP_CENTER } from "@/lib/map/constants";

interface Artist {
  id: string;
  name: string;
  shopName: string;
  avatar: string;
  location: string;
  lat: number;
  lng: number;
  craftType: string;
  category: string;
}

interface Event {
  title: string;
  date: string;
  location: string;
  lat: number;
  lng: number;
  details: string;
  type: string;
  dateText: string;
  time: string;
}

const eventsData: Event[] = [
  {
    title: "Artisan Fair",
    date: "2026-09-15",
    location: "SM City Olongapo",
    lat: 14.8333,
    lng: 120.2828,
    details: "A four-day artisan fair featuring Filipino crafts.",
    type: "Fair",
    dateText: "September 15, 2026",
    time: "9:00 AM",
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
  },
  {
    title: "This Is Not Art Escape",
    date: "2026-10-25",
    location: "Ayala Malls Harbor Point",
    lat: 14.8276,
    lng: 120.2823,
    details: "A two-day art market with handmade crafts and artworks.",
    type: "Workshop",
    dateText: "October 25, 2026",
    time: "9:00 AM",
  },
];

// Recenter button component for map
function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      style={{
        position: "absolute",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 1000,
        background: "#2E3F36",
        color: "#FFC46B",
        border: "none",
        borderRadius: "50%",
        width: "50px",
        height: "50px",
        boxShadow: "0 4px 16px rgba(46,63,54,0.13)",
        fontSize: "1.3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={() => map.setView(center, 13, { animate: true })}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#AF7928";
        (e.currentTarget as HTMLButtonElement).style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#2E3F36";
        (e.currentTarget as HTMLButtonElement).style.color = "#FFC46B";
      }}
      aria-label="Refresh Map"
      title="Refresh Map"
    >
      ↻
    </button>
  );
}

export default function HomeMapPreview() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEvents, setShowEvents] = useState(false);
  const center: [number, number] = OLONGAPO_MAP_CENTER;

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const response = await fetch("/api/map/sellers", {
          cache: "no-store",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Failed to fetch sellers: ${response.status} ${response.statusText}`,
            errorText
          );
          setLoading(false);
          return;
        }

        let payload;
        try {
          payload = await response.json();
        } catch (jsonError) {
          console.error(
            "Failed to parse JSON response from sellers API:",
            jsonError
          );
          setLoading(false);
          return;
        }

        if (payload.success && Array.isArray(payload.data)) {
          setArtists(payload.data.slice(0, 8)); // Limit to 8 for preview
        } else {
          console.warn("Invalid response structure from sellers API:", payload);
        }
      } catch (error) {
        console.error("Failed to load artists for map preview:", error);
      } finally {
        setLoading(false);
      }
    };

    loadArtists();
  }, []);

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
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
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
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
  });

  // Temporary any-cast to suppress React 19 + react-leaflet v5 typing incompatibilities
  const AnyMapContainer: any = MapContainer;
  const AnyMarker: any = Marker;
  const AnyTileLayer: any = TileLayer;

  return (
    <div className="home-map-preview-container">
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        {/* Tab Buttons */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.9)",
            padding: "8px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <button
            onClick={() => setShowEvents(false)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: !showEvents ? "#af7928" : "#f0f0f0",
              color: !showEvents ? "#fff" : "#333",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              fontFamily: "Poppins, sans-serif",
              transition: "all 0.2s",
            }}
          >
            Artisans
          </button>
          <button
            onClick={() => setShowEvents(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: showEvents ? "#af7928" : "#f0f0f0",
              color: showEvents ? "#fff" : "#333",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              fontFamily: "Poppins, sans-serif",
              transition: "all 0.2s",
            }}
          >
            Events
          </button>
        </div>

        {/* Map Loading State */}
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              fontSize: "1rem",
              color: "#666",
              background: "#f5f5f5",
            }}
          >
            Loading map data...
          </div>
        ) : (
          <>
            <AnyMapContainer
              center={center}
              zoom={13}
              scrollWheelZoom={false}
              className="home-map-preview"
              style={{
                height: "400px",
                borderRadius: "12px",
                overflow: "hidden",
                border: "2px solid #af7928",
              }}
            >
              <AnyTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Artist Markers - Show when not showEvents */}
              {!showEvents &&
                artists.map((artist) => (
                  <AnyMarker
                    key={`artist-${artist.id}`}
                    position={[artist.lat, artist.lng]}
                    icon={artistIcon}
                  >
                    <Popup>
                      <div
                        style={{
                          fontSize: "14px",
                          maxWidth: "240px",
                          fontFamily: "Poppins, sans-serif",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            color: "#2E3F36",
                            marginBottom: "8px",
                          }}
                        >
                          {artist.shopName || artist.name}
                        </div>
                        <div
                          style={{
                            margin: "6px 0",
                            color: "#af7928",
                            fontWeight: "500",
                          }}
                        >
                          {artist.craftType}
                        </div>
                        <div
                          style={{
                            margin: "6px 0",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          📍 {artist.location}
                        </div>
                        <div
                          style={{
                            margin: "6px 0",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          {artist.category}
                        </div>
                      </div>
                    </Popup>
                  </AnyMarker>
                ))}

              {/* Event Markers - Show when showEvents is true */}
              {showEvents &&
                eventsData.map((event) => (
                  <AnyMarker
                    key={`event-${event.title}`}
                    position={[event.lat, event.lng]}
                    icon={eventIcon}
                  >
                    <Popup>
                      <div
                        style={{
                          fontSize: "14px",
                          maxWidth: "240px",
                          fontFamily: "Poppins, sans-serif",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            color: "#2E3F36",
                            marginBottom: "8px",
                          }}
                        >
                          {event.title}
                        </div>
                        <div
                          style={{
                            margin: "6px 0",
                            color: "#2e3f36",
                            fontWeight: "500",
                          }}
                        >
                          {event.type}
                        </div>
                        <div
                          style={{
                            margin: "6px 0",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          📅 {event.dateText}
                        </div>
                        <div
                          style={{
                            margin: "6px 0",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          📍 {event.location}
                        </div>
                        <div
                          style={{
                            margin: "8px 0 0 0",
                            fontSize: "11px",
                            color: "#555",
                            lineHeight: "1.4",
                          }}
                        >
                          {event.details}
                        </div>
                      </div>
                    </Popup>
                  </AnyMarker>
                ))}
              {/* Recenter Button - needs to be inside map to use useMap hook */}
              <RecenterButton center={center} />
            </AnyMapContainer>
            {/* Legend */}
            <div
              style={{
                position: "absolute",
                bottom: "1.5rem",
                left: "1.5rem",
                zIndex: 1000,
                background: "rgba(255,255,255,0.92)",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(46,63,54,0.09)",
                padding: "0.7rem 1.2rem",
                fontSize: "0.95rem",
                color: "#2E3F36",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#AF7928",
                    border: "2px solid #FFC46B",
                    boxShadow: "0 2px 6px rgba(46,63,54,0.09)",
                  }}
                />
                <span>Artisans</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#2E3F36",
                    border: "2px solid #FFC46B",
                    boxShadow: "0 2px 6px rgba(46,63,54,0.09)",
                  }}
                />
                <span>Events</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
