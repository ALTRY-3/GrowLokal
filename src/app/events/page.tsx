"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MdNotifications, MdNotificationsActive } from "react-icons/md";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaCalendar,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./events.css";
import { useSearchParams } from "next/navigation";

// Update the Event type definition
type Event = {
  date: string;
  title: string;
  dateText: string;
  time: string;
  location: string;
  details: string;
  type: "Festival" | "Workshop" | "Fair";
  organizer?: string; // Add optional organizer property
};

type EventType =
  | "Festival"
  | "Craft Fair"
  | "Local Market"
  | "Cultural Show"
  | "Business Campaign"
  | "Workshop";

const events: Event[] = [
  {
    date: "2025-09-15",
    title: "Subic Bay Cultural Festival",
    dateText: "March 15, 2025",
    time: "9:00 AM",
    location: "Subic Bay Freeport Zone",
    details:
      "Annual celebration of local culture featuring artisan booths, traditional performances, and cultural exhibits.",
    type: "Fair",
    organizer: "Olongapo City Tourism Office",
  },
  {
    date: "2026-02-17",
    title: "Alab Sining 2026",
    dateText: "February 17, 2026",
    time: "9:00 AM",
    location: "SM City Olongapo Central",
    details:
      "An art exhibit held at SM City Olongapo Central, showcasing traditional and contemporary artworks by artists from Olongapo, Zambales, and Bataan.",
    type: "Festival",
    organizer: "SM City Olongapo",
  },
  {
    date: "2025-10-25",
    title: "This Is Not Art Escape",
    dateText: "October 25, 2025",
    time: "9:00 AM",
    location: "Ayala Malls Harbor Point",
    details:
      "A two-day art market at Ayala Malls Harbor Point, offering handmade crafts, original artworks, and unique creations from local artists.",
    type: "Workshop",
  },
  {
    date: "2026-06-22",
    title: "Crft PINAY Pottery Experience",
    dateText: "June 22, 2026",
    time: "9:00 AM",
    location: "Sibul Kapihan, SBFZ",
    details:
      "A pottery workshop held at Ianthe, providing participants with hands-on experience in traditional Filipino pottery-making techniques.",
    type: "Workshop",
  },
  {
    date: "2025-09-16",
    title: "My City, My SM, My Crafts",
    dateText: "September 16, 2025",
    time: "9:00 AM",
    location: "SM City Olongapo",
    details:
      "An initiative by SM City Olongapo to showcase and celebrate the craftsmanship and artistry of local Filipino artisans.",
    type: "Fair",
  },
  {
    date: "2025-10-12",
    title: "Luzon Art Fair 2025",
    dateText: "October 12, 2025",
    time: "9:00 AM",
    location: "Diwa ng Tarlac and Bulwagang Kanlahi, Tarlac City",
    details:
      "Olongapo Zambales Artists (OZA) is a creative collective founded in 2022, born from a shared passion to uplift and unify the art community across Olongapo and the province of Zambales.",
    type: "Festival",
  },
  {
    date: "2025-11-11",
    title: "Sip and Sketch 'Gapo",
    dateText: "November 11, 2025",
    time: "9:00 AM",
    location: "Olongapo City, Sibul Kapihan",
    details:
      "A creative gathering where artists and art enthusiasts come together to sketch, sip beverages, and engage in artistic conversations, fostering a community of local artists.",
    type: "Workshop",
  },
];

export default function EventsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [reminders, setReminders] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof events>([]);
  const [calendarReminder, setCalendarReminder] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<EventType | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);

  const eventRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for event from query string (map page)
    const eventTitle = searchParams?.get("event");
    if (eventTitle) {
      const foundEvent = events.find((event) => event.title === eventTitle);
      if (foundEvent) {
        setFilteredEvents([foundEvent]);
        setSelectedEvent(foundEvent);
        setDate(new Date(foundEvent.date));
        return; // Don't check localStorage if query param is present
      }
    }

    // Fallback: Check for selected date from localStorage (home page)
    const selectedDate = localStorage.getItem("selectedEventDate");
    if (selectedDate) {
      // Sanitize date string: remove spaces and ensure format is YYYY-MM-DD
      const cleanDate = selectedDate.replace(/\s+/g, "");
      const parsedDate = new Date(cleanDate);

      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);

        const dateEvents = events.filter((event) => event.date === cleanDate);

        setFilteredEvents(dateEvents);

        if (dateEvents.length > 0) {
          setSelectedEvent(dateEvents[0]);
        }
      } else {
        // fallback: show all events if date is invalid
        setFilteredEvents(events);
        setSelectedEvent(null);
        setDate(new Date());
      }

      localStorage.removeItem("selectedEventDate");
    }
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setSuggestions([]);
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(
        (event) =>
          event.title.toLowerCase().includes(value.toLowerCase()) ||
          event.location.toLowerCase().includes(value.toLowerCase()) ||
          event.dateText.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setFilteredEvents(filtered);
    }
  };

  const handleSuggestionClick = (index: number) => {
    setQuery("");
    setSuggestions([]);
    eventRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const toggleReminder = (idx: number) => {
    const eventDate = events[idx].date;
    setReminders((prev) =>
      prev.includes(eventDate)
        ? prev.filter((d) => d !== eventDate)
        : [...prev, eventDate]
    );
  };

  const handleDateClick = (clickedDate: Date) => {
    setDate(clickedDate);
    setCalendarReminder(false);
    const foundEvent = events.find(
      (event) =>
        new Date(event.date).toDateString() === clickedDate.toDateString()
    );
    setSelectedEvent(foundEvent || null);
  };

  // Add featured events from your existing events
  const featuredEvents = events.slice(0, 3);

  return (
    <div className="events-page">
      <Navbar />

      <main role="main">
        {/* Update Hero Section */}
        <section className="events-hero">
          <div className="hero-content">
            <h1>
              Discover Local Events
              <br />
              in Olongapo City
            </h1>
            <p>
              Festivals, workshops, fairs, and community campaigns celebrating
              Filipino culture and craftsmanship
            </p>
          </div>
        </section>

        {/* Add Featured Events Section */}
        <section className="featured-events-section">
          <div className="events-section-header">
            <h2>Featured Events</h2>
          </div>

          <div className="featured-events-wrapper">
            <button
              className="events-nav-button prev"
              onClick={() => {
                const container = document.querySelector(
                  ".featured-events-grid"
                );
                if (container) {
                  container.scrollLeft -= 650;
                }
              }}
              aria-label="Previous events"
            >
              <FaChevronLeft />
            </button>

            <div className="featured-events-grid">
              {featuredEvents.map((event, idx) => (
                <div className="all-event-card featured" key={idx}>
                  <div className="all-event-header">
                    <span
                      className={`all-event-type ${event.type.toLowerCase()}`}
                    >
                      {event.type}
                    </span>
                    <button
                      className={`reminder-btn ${
                        reminders.includes(event.date) ? "active" : ""
                      }`}
                      onClick={() => toggleReminder(idx)}
                    >
                      {reminders.includes(event.date) ? (
                        <MdNotificationsActive className="icon-ringing" />
                      ) : (
                        <MdNotifications />
                      )}
                    </button>
                  </div>
                  <h3 className="all-event-title">{event.title}</h3>
                  <div className="all-event-meta">
                    <FaCalendar />
                    <span>{event.dateText}</span>
                  </div>
                  <div className="all-event-meta">
                    <FaClock />
                    <span>{event.time}</span>
                  </div>
                  <p className="all-event-description">{event.details}</p>
                  <div className="all-event-location">
                    <FaMapMarkerAlt />
                    <span>{event.location}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="events-nav-button next"
              onClick={() => {
                const container = document.querySelector(
                  ".featured-events-grid"
                );
                if (container) {
                  container.scrollLeft += 650;
                }
              }}
              aria-label="Next events"
            >
              <FaChevronRight />
            </button>
          </div>
        </section>

        <div className="events-search-bar-container">
          <form
            className="events-search-bar"
            role="search"
            aria-label="Search for Olongapo's events"
            onSubmit={(e) => e.preventDefault()}
          >
            <FaSearch className="search-icon" aria-hidden="true" />
            <input
              id="events-search"
              className="events-search-input"
              type="text"
              placeholder="Search for an event or location"
              value={query}
              onChange={handleSearchChange}
              aria-label="Search events or locations"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                }}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </form>

          <button
            type="button"
            className="event-filter-button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filter events"
          >
            <FaFilter />
          </button>
          {showFilters && (
            <div className="event-filter-dropdown">
              {[
                "Festival",
                "Craft Fair",
                "Local Market",
                "Cultural Show",
                "Business Campaign",
                "Workshop",
              ].map((type) => (
                <button
                  key={type}
                  className={`event-filter-option ${
                    selectedFilter === type ? "active" : ""
                  }`}
                  onClick={() => {
                    const newFilter =
                      selectedFilter === type ? null : (type as EventType);
                    setSelectedFilter(newFilter);
                    setShowFilters(false);

                    // Filter events based on selected type
                    if (!newFilter) {
                      setFilteredEvents(events);
                    } else {
                      const filtered = events.filter(
                        (event) =>
                          event.type.toLowerCase() === newFilter.toLowerCase()
                      );
                      setFilteredEvents(filtered);
                    }
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <h2 className="all-events-title">All Upcoming Events</h2>

        <div className="events-content">
          <div className="all-events-container">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, idx) => (
                <article
                  className="all-event-card"
                  key={idx}
                  ref={(el: HTMLDivElement | null) => {
                    eventRefs.current[idx] = el;
                  }}
                >
                  <div className="all-event-header">
                    <span
                      className={`all-event-type ${event.type.toLowerCase()}`}
                    >
                      {event.type}
                    </span>
                    <button
                      className={`reminder-btn ${
                        reminders.includes(event.date) ? "active" : ""
                      }`}
                      onClick={() => toggleReminder(idx)}
                    >
                      {reminders.includes(event.date) ? (
                        <MdNotificationsActive className="icon-ringing" />
                      ) : (
                        <MdNotifications />
                      )}
                    </button>
                  </div>

                  <h3 className="all-event-title">{event.title}</h3>

                  <div className="all-event-meta">
                    <FaCalendar />
                    <span>{event.dateText}</span>
                  </div>

                  <div className="all-event-meta">
                    <FaClock />
                    <span>{event.time}</span>
                  </div>

                  <p className="all-event-description">{event.details}</p>

                  <div className="all-event-location">
                    <FaMapMarkerAlt />
                    <span>{event.location}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="no-events-card">
                <FaCalendar className="no-events-icon" aria-hidden="true" />
                <h3 className="no-events-title">No Events Found</h3>
                <p className="no-events-subtitle">
                  {selectedFilter
                    ? "No events match the selected filter."
                    : query
                    ? "No events match your search."
                    : "No events on this date."}
                </p>
                <div className="no-events-actions">
                  <button
                    className="no-events-button secondary"
                    onClick={() => {
                      setDate(new Date());
                      setSelectedEvent(null);
                      setSelectedFilter(null);
                      setQuery("");
                      setFilteredEvents(events);
                    }}
                  >
                    Clear Filters
                  </button>
                  <button
                    className="no-events-button primary"
                    onClick={() => {
                      setSelectedFilter(null);
                      setQuery("");
                      setFilteredEvents(events);
                    }}
                  >
                    Show All Events
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="calendar-box" aria-label="Event calendar">
            <div className="calendar-header">
              <div className="calendar-title-group">
                <span className="calendar-title">Event Calendar</span>
                <p className="calendar-subtitle">
                  Select a date to filter events or set a reminder. Dotted dates
                  have events.
                </p>
              </div>
              <div className="calendar-actions">
                <button
                  type="button"
                  className={`calendar-icon-box ${
                    reminders.includes(
                      date.getFullYear() +
                        "-" +
                        String(date.getMonth() + 1).padStart(2, "0") +
                        "-" +
                        String(date.getDate()).padStart(2, "0")
                    )
                      ? "active"
                      : ""
                  }`}
                  aria-pressed={reminders.includes(
                    date.getFullYear() +
                      "-" +
                      String(date.getMonth() + 1).padStart(2, "0") +
                      "-" +
                      String(date.getDate()).padStart(2, "0")
                  )}
                  aria-label={
                    reminders.includes(
                      date.getFullYear() +
                        "-" +
                        String(date.getMonth() + 1).padStart(2, "0") +
                        "-" +
                        String(date.getDate()).padStart(2, "0")
                    )
                      ? "Remove reminder for this date"
                      : "Set a reminder for this date"
                  }
                  onClick={() => {
                    const selectedDateStr =
                      date.getFullYear() +
                      "-" +
                      String(date.getMonth() + 1).padStart(2, "0") +
                      "-" +
                      String(date.getDate()).padStart(2, "0");
                    const hasEvent = events.some(
                      (event) =>
                        new Date(event.date).toDateString() ===
                        date.toDateString()
                    );
                    if (!hasEvent) return;

                    setReminders((reminders) =>
                      reminders.includes(selectedDateStr)
                        ? reminders.filter((d) => d !== selectedDateStr)
                        : [...reminders, selectedDateStr]
                    );
                    setCalendarReminder((prev) => !prev);
                  }}
                >
                  {reminders.includes(
                    date.getFullYear() +
                      "-" +
                      String(date.getMonth() + 1).padStart(2, "0") +
                      "-" +
                      String(date.getDate()).padStart(2, "0")
                  ) ? (
                    <MdNotificationsActive
                      className="icon-ringing"
                      aria-hidden="true"
                    />
                  ) : (
                    <MdNotifications aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="calendar-body">
              <Calendar
                value={date}
                onChange={(value) =>
                  value instanceof Date && handleDateClick(value)
                }
                locale="en-US"
                tileClassName={({ date: tileDate }) => {
                  const dateStr =
                    tileDate.getFullYear() +
                    "-" +
                    String(tileDate.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(tileDate.getDate()).padStart(2, "0");

                  if (reminders.includes(dateStr)) {
                    return "react-calendar__tile--reminder";
                  }

                  if (
                    calendarReminder &&
                    tileDate.toDateString() === date.toDateString() &&
                    events.some(
                      (event) =>
                        new Date(event.date).toDateString() ===
                        tileDate.toDateString()
                    )
                  ) {
                    return "react-calendar__tile--reminder";
                  }
                  return "";
                }}
                tileContent={({ date: tileDate }) => {
                  const hasEvent = events.some(
                    (event) =>
                      new Date(event.date).toDateString() ===
                      tileDate.toDateString()
                  );
                  return hasEvent ? (
                    <div
                      style={{
                        marginTop: "2px",
                        width: "4px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#AF7928",
                        marginInline: "auto",
                      }}
                    />
                  ) : null;
                }}
              />
            </div>

            {selectedEvent && (
              <section className="calendar-event-details" aria-live="polite">
                <div className="calendar-event-header">
                  <div className="calendar-event-title">
                    {selectedEvent.title}
                  </div>
                  <span className="calendar-event-type">
                    {selectedEvent.type}
                  </span>
                </div>
                <div className="calendar-event-divider"></div>
                <div className="calendar-event-location">
                  <svg
                    className="location-icon"
                    width="12"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                  </svg>
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="calendar-event-datetime">
                  <span>{selectedEvent.dateText}</span>
                  <span>|</span>
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="calendar-event-description">
                  {selectedEvent.details}
                </div>

                <div className="calendar-divider" />

                <div className="calendar-artisans">
                  <div className="calendar-artisans-header">
                    <FaUser />
                    <span>Featured Artisans:</span>
                  </div>
                  <div className="calendar-artisans-list">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aba"
                      alt="Featured artisan"
                      className="artisan-avatar"
                    />
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abc"
                      alt="Featured artisan"
                      className="artisan-avatar"
                    />
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abf"
                      alt="Featured artisan"
                      className="artisan-avatar"
                    />
                  </div>
                </div>

                <div className="calendar-divider" />

                <p className="calendar-organizer">
                  Organized by{" "}
                  <strong>
                    {selectedEvent.organizer || "Olongapo City LGU"}
                  </strong>
                </p>
              </section>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
