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

// Booking type definition
type Booking = {
  eventId: number;
  eventTitle: string;
  userName: string;
  userEmail: string;
  participants: number;
  message: string;
  bookedAt: string;
};

// Update the Event type definition
type Event = {
  id: number; // Add this line
  date: string;
  title: string;
  dateText: string;
  time: string;
  location: string;
  details: string;
  type:
    | "Festival"
    | "Craft Fair"
    | "Local Market"
    | "Cultural Show"
    | "Business Campaign"
    | "Workshop"
    | "Demo";
  organizer?: string;
  featuredArtisan?: string; // Featured artisan name for the event
};

type EventType =
  | "Festival"
  | "Craft Fair"
  | "Local Market"
  | "Cultural Show"
  | "Business Campaign"
  | "Workshop"
  | "Demo";

const events: Event[] = [
  {
    id: 1, // Add unique ID
    date: "2025-09-15",
    title: "Subic Bay Cultural Festival",
    dateText: "March 15, 2025",
    time: "9:00 AM",
    location: "Subic Bay Freeport Zone",
    details:
      "Annual celebration of local culture featuring artisan booths, traditional performances, and cultural exhibits.",
    type: "Cultural Show",
    organizer: "Olongapo City Tourism Office",
    featuredArtisan: "Maria Santos",
  },
  {
    id: 2, // Add unique ID
    date: "2026-02-17",
    title: "Alab Sining 2026",
    dateText: "February 17, 2026",
    time: "9:00 AM",
    location: "SM City Olongapo Central",
    details:
      "An art exhibit held at SM City Olongapo Central, showcasing traditional and contemporary artworks by artists from Olongapo, Zambales, and Bataan.",
    type: "Craft Fair",
    organizer: "SM City Olongapo",
    featuredArtisan: "Juan Dela Cruz",
  },
  {
    id: 3, // Add unique ID
    date: "2025-10-25",
    title: "This Is Not Art Escape",
    dateText: "October 25, 2025",
    time: "9:00 AM",
    location: "Ayala Malls Harbor Point",
    details:
      "A two-day art market at Ayala Malls Harbor Point, offering handmade crafts, original artworks, and unique creations from local artists.",
    type: "Local Market",
    featuredArtisan: "Rosa Reyes",
  },
  {
    id: 4, // Add unique ID
    date: "2026-06-22",
    title: "Crft PINAY Pottery Experience",
    dateText: "June 22, 2026",
    time: "9:00 AM",
    location: "Sibul Kapihan, SBFZ",
    details:
      "A pottery workshop held at Ianthe, providing participants with hands-on experience in traditional Filipino pottery-making techniques.",
    type: "Workshop",
    featuredArtisan: "Ana Gonzales",
  },
  {
    id: 5, // Add unique ID
    date: "2025-09-16",
    title: "My City, My SM, My Crafts",
    dateText: "September 16, 2025",
    time: "9:00 AM",
    location: "SM City Olongapo",
    details:
      "An initiative by SM City Olongapo to showcase and celebrate the craftsmanship and artistry of local Filipino artisans.",
    type: "Craft Fair",
    featuredArtisan: "Miguel Fernandez",
  },
  {
    id: 6, // Add unique ID
    date: "2025-10-12",
    title: "Luzon Art Fair 2025",
    dateText: "October 12, 2025",
    time: "9:00 AM",
    location: "Diwa ng Tarlac and Bulwagang Kanlahi, Tarlac City",
    details:
      "Olongapo Zambales Artists (OZA) is a creative collective founded in 2022, born from a shared passion to uplift and unify the art community across Olongapo and the province of Zambales.",
    type: "Festival",
    featuredArtisan: "Carlos Mendoza",
  },
  {
    id: 7, // Add unique ID
    date: "2025-11-11",
    title: "Sip and Sketch 'Gapo",
    dateText: "November 11, 2025",
    time: "9:00 AM",
    location: "Olongapo City, Sibul Kapihan",
    details:
      "A creative gathering where artists and art enthusiasts come together to sketch, sip beverages, and engage in artistic conversations, fostering a community of local artists.",
    type: "Workshop",
    featuredArtisan: "Teresa Villanueva",
  },
  {
    id: 8, // Different ID for second Pottery Demonstration
    date: "2026-03-20",
    title: "Pottery Demonstration",
    dateText: "March 20, 2026",
    time: "9:00 AM",
    location: "Olongapo City, Triangle",
    details:
      "A hands-on pottery demonstration showcasing the art of shaping clay into functional and decorative pieces. Attendees will observe traditional and modern pottery techniques, learn about the tools and processes involved, and gain a deeper appreciation for the craftsmanship behind each creation. Open to artists, students, and the public who wish to explore the beauty of handmade ceramics.",
    type: "Demo",
    featuredArtisan: "Ramon Cruz",
  },
  {
    id: 9, // Different ID for third event
    date: "2026-03-25",
    title: "Cultural Festival", // Can have same title
    dateText: "March 25, 2026",
    time: "9:00 AM",
    location: "Magsaysay Drive, Olongapo City",
    details:
      "Experience the art of pottery up close in this live demonstration featuring the creative process from clay molding to final design. Participants will witness various shaping and glazing techniques, learn about the cultural roots of pottery, and discover how simple clay can be transformed into timeless works of art. Ideal for anyone curious about craftsmanship and creative expression.",
    type: "Demo",
    featuredArtisan: "Lucia Mendez",
  },
];

// BookingModal Component
interface BookingModalProps {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  onSubmit: (booking: Booking) => void;
}

function BookingModal({ isOpen, event, onClose, onSubmit }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    participants: 1,
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "participants" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    const booking: Booking = {
      eventId: event.id,
      eventTitle: event.title,
      userName: formData.name,
      userEmail: formData.email,
      participants: formData.participants,
      message: formData.message,
      bookedAt: new Date().toISOString(),
    };

    onSubmit(booking);
    setSubmitted(true);

    setTimeout(() => {
      setFormData({ name: "", email: "", participants: 1, message: "" });
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  return (
    <div
      className="booking-modal-backdrop"
      ref={modalRef}
      onClick={handleBackdropClick}
    >
      <div className="booking-modal">
        <button
          className="booking-modal-close"
          onClick={onClose}
          aria-label="Close booking modal"
        >
          <FaTimes />
        </button>

        {submitted ? (
          <div className="booking-modal-success">
            <div className="success-icon">✓</div>
            <h2>Booking Confirmed!</h2>
            <p>
              You're booked for <strong>{event.title}</strong>!
            </p>
            <p className="success-subtitle">Check your email for details.</p>
          </div>
        ) : (
          <>
            <div className="booking-modal-header">
              <h2>Book Experience</h2>
              <p className="booking-modal-subtitle">
                Secure your spot for this amazing event
              </p>
            </div>

            <form onSubmit={handleSubmit} className="booking-modal-form">
              {/* Event Info Section (Read-only) */}
              <div className="booking-form-section">
                <label className="booking-form-label">Event Title</label>
                <input
                  type="text"
                  value={event.title}
                  readOnly
                  className="booking-form-input readonly"
                />
              </div>

              <div className="booking-form-section">
                <label className="booking-form-label">Date</label>
                <input
                  type="text"
                  value={event.dateText}
                  readOnly
                  className="booking-form-input readonly"
                />
              </div>

              <div className="booking-form-section">
                <label className="booking-form-label">Time</label>
                <input
                  type="text"
                  value={event.time}
                  readOnly
                  className="booking-form-input readonly"
                />
              </div>

              <div className="booking-form-section">
                <label className="booking-form-label">Location</label>
                <input
                  type="text"
                  value={event.location}
                  readOnly
                  className="booking-form-input readonly"
                />
              </div>

              <div className="booking-form-section">
                <label className="booking-form-label">Featured Artisan</label>
                <input
                  type="text"
                  value={event.featuredArtisan || "Not specified"}
                  readOnly
                  className="booking-form-input readonly"
                />
              </div>

              <hr className="booking-form-divider" />

              {/* User Info Section */}
              <div className="booking-form-section">
                <label className="booking-form-label">
                  Your Name <span className="required-asterisk">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="booking-form-input"
                  required
                />
              </div>

              <div className="booking-form-section">
                <label className="booking-form-label">
                  Email Address <span className="required-asterisk">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="booking-form-input"
                  required
                />
              </div>

              <div className="booking-form-row">
                <div className="booking-form-section">
                  <label className="booking-form-label">
                    Number of Participants{" "}
                    <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="number"
                    name="participants"
                    min="1"
                    max="50"
                    value={formData.participants}
                    onChange={handleInputChange}
                    className="booking-form-input"
                    required
                  />
                </div>
              </div>

              <div className="booking-form-section">
                <label className="booking-form-label">Message (Optional)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Any special requests or questions?"
                  className="booking-form-input booking-form-textarea"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="booking-modal-submit-btn"
                disabled={!formData.name || !formData.email}
              >
                Confirm Booking
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedEventForBooking, setSelectedEventForBooking] =
    useState<Event | null>(null);
  const [canScrollFeatured, setCanScrollFeatured] = useState({
    left: false,
    right: true,
  });
  const [canScrollAllEvents, setCanScrollAllEvents] = useState({
    left: false,
    right: true,
  });

  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const featuredEventsGridRef = useRef<HTMLDivElement | null>(null);
  const allEventsGridRef = useRef<HTMLDivElement | null>(null);
  const [emphasizedEvent, setEmphasizedEvent] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Load reminders from localStorage on mount
  useEffect(() => {
    const savedReminders = localStorage.getItem("eventReminders");
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }

    // Load bookings from localStorage on mount
    const savedBookings = localStorage.getItem("eventBookings");
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }
  }, []);

  useEffect(() => {
    // Check for event from query string (map page)
    const eventTitle = searchParams?.get("event");
    if (eventTitle && eventRefs.current[eventTitle]) {
      eventRefs.current[eventTitle]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setEmphasizedEvent(eventTitle);
      const timer = setTimeout(() => setEmphasizedEvent(null), 2000);
      return () => clearTimeout(timer);
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
  }, [searchParams, filteredEvents]);

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
    setReminders((prev) => {
      const newReminders = prev.includes(eventDate)
        ? prev.filter((d) => d !== eventDate)
        : [...prev, eventDate];

      // Save to localStorage to sync with home page
      localStorage.setItem("eventReminders", JSON.stringify(newReminders));
      return newReminders;
    });
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

  // Helper function to check if event is in the past
  const isPastEvent = (eventDate: string): boolean => {
    const eventDateTime = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDateTime < today;
  };

  // Add featured events from your existing events
  const featuredEvents = events.filter((event) => [2, 4, 6].includes(event.id));

  const handleBookingSubmit = (booking: Booking) => {
    setBookings((prev) => {
      const newBookings = [...prev, booking];
      // Save to localStorage to sync with home page
      localStorage.setItem("eventBookings", JSON.stringify(newBookings));
      return newBookings;
    });
    // In a real app, you'd send this to a backend API here
    console.log("Booking saved:", booking);
  };

  // Check if an event is already booked
  const isEventBooked = (eventId: number): boolean => {
    return bookings.some((booking) => booking.eventId === eventId);
  };

  const openBookingModal = (event: Event) => {
    setSelectedEventForBooking(event);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedEventForBooking(null);
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

  useEffect(() => {
    // Check initial scroll state on mount
    setTimeout(() => {
      checkScrollPosition(featuredEventsGridRef.current, setCanScrollFeatured);
      checkScrollPosition(allEventsGridRef.current, setCanScrollAllEvents);
    }, 100);

    // Add scroll listeners
    const featuredContainer = featuredEventsGridRef.current;
    const allEventsContainer = allEventsGridRef.current;

    const handleFeaturedScroll = () => {
      checkScrollPosition(featuredContainer, setCanScrollFeatured);
    };

    const handleAllEventsScroll = () => {
      checkScrollPosition(allEventsContainer, setCanScrollAllEvents);
    };

    if (featuredContainer) {
      featuredContainer.addEventListener("scroll", handleFeaturedScroll);
    }
    if (allEventsContainer) {
      allEventsContainer.addEventListener("scroll", handleAllEventsScroll);
    }

    return () => {
      if (featuredContainer) {
        featuredContainer.removeEventListener("scroll", handleFeaturedScroll);
      }
      if (allEventsContainer) {
        allEventsContainer.removeEventListener("scroll", handleAllEventsScroll);
      }
    };
  }, []);

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
            {canScrollFeatured.left && (
              <button
                className="events-nav-button prev"
                onClick={() => {
                  if (featuredEventsGridRef.current) {
                    featuredEventsGridRef.current.scrollLeft -= 650;
                  }
                }}
                aria-label="Previous events"
              >
                <FaChevronLeft />
              </button>
            )}

            <div className="featured-events-grid" ref={featuredEventsGridRef}>
              {featuredEvents.map((event, idx) => (
                <div className="all-event-card featured" key={event.id}>
                  <div className="all-event-header">
                    <span
                      className={`all-event-type ${event.type.toLowerCase()}`}
                    >
                      {event.type}
                    </span>
                    <div className="all-event-actions">
                      {event.type === "Workshop" || event.type === "Demo" ? (
                        <button
                          className="book-experience-btn"
                          onClick={() => openBookingModal(event)}
                          disabled={
                            isPastEvent(event.date) || isEventBooked(event.id)
                          }
                          title={
                            isPastEvent(event.date)
                              ? "Event has passed - booking unavailable"
                              : isEventBooked(event.id)
                              ? "Already booked"
                              : "Book this experience"
                          }
                        >
                          {isEventBooked(event.id) ? "✓ Booked" : "📅 Book"}
                        </button>
                      ) : (
                        <button
                          className={`reminder-btn ${
                            reminders.includes(event.date) ? "active" : ""
                          }`}
                          onClick={() =>
                            !isPastEvent(event.date) && toggleReminder(idx)
                          }
                          disabled={isPastEvent(event.date)}
                          title={
                            isPastEvent(event.date)
                              ? "Cannot set reminder for past events"
                              : "Set reminder"
                          }
                        >
                          {reminders.includes(event.date) ? (
                            <MdNotificationsActive className="icon-ringing" />
                          ) : (
                            <MdNotifications />
                          )}
                        </button>
                      )}
                    </div>
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
                  <div className="all-event-location">
                    <FaMapMarkerAlt />
                    <span>{event.location}</span>
                  </div>
                  <p className="all-event-description">{event.details}</p>
                </div>
              ))}
            </div>

            {canScrollFeatured.right && (
              <button
                className="events-nav-button next"
                onClick={() => {
                  if (featuredEventsGridRef.current) {
                    featuredEventsGridRef.current.scrollLeft += 650;
                  }
                }}
                aria-label="Next events"
              >
                <FaChevronRight />
              </button>
            )}
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
              {/* Add "All Events" option at the top */}
              <button
                key="All Events"
                className={`event-filter-option ${
                  selectedFilter === null ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedFilter(null);
                  setShowFilters(false);
                  setFilteredEvents(events);
                }}
              >
                All Events
              </button>
              {[
                "Festival",
                "Craft Fair",
                "Local Market",
                "Cultural Show",
                "Business Campaign",
                "Workshop",
                "Demo",
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
              filteredEvents
                .sort((a, b) => {
                  const aIsPast = isPastEvent(a.date);
                  const bIsPast = isPastEvent(b.date);
                  if (aIsPast === bIsPast) {
                    return (
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                    );
                  }
                  return aIsPast ? 1 : -1;
                })
                .map((event, idx) => (
                  <article
                    className={`all-event-card${
                      emphasizedEvent === event.title ? " emphasized" : ""
                    }`}
                    key={event.id} // Use id instead of title
                    ref={(el: HTMLDivElement | null) => {
                      if (el) {
                        eventRefs.current[event.title] = el;
                      }
                    }}
                  >
                    <div className="all-event-header">
                      <span
                        className={`all-event-type ${event.type.toLowerCase()}`}
                      >
                        {event.type}
                      </span>
                      {event.type === "Workshop" || event.type === "Demo" ? (
                        <button
                          className={`book-experience-btn ${
                            isEventBooked(event.id) ? "booked" : ""
                          }`}
                          onClick={() =>
                            !isPastEvent(event.date) &&
                            !isEventBooked(event.id) &&
                            openBookingModal(event)
                          }
                          disabled={
                            isPastEvent(event.date) || isEventBooked(event.id)
                          }
                          title={
                            isPastEvent(event.date)
                              ? "Event has passed - booking unavailable"
                              : isEventBooked(event.id)
                              ? "Already booked"
                              : "Book this experience"
                          }
                        >
                          {isEventBooked(event.id) ? "✓ Booked" : "📅 Book"}
                        </button>
                      ) : (
                        <button
                          className={`reminder-btn ${
                            reminders.includes(event.date) ? "active" : ""
                          }`}
                          onClick={() => {
                            const eventIndex = events.findIndex(
                              (e) => e.id === event.id
                            );
                            if (!isPastEvent(event.date)) {
                              toggleReminder(eventIndex);
                            }
                          }}
                          disabled={isPastEvent(event.date)}
                          title={
                            isPastEvent(event.date)
                              ? "Cannot set reminder for past events"
                              : "Set reminder"
                          }
                        >
                          {reminders.includes(event.date) ? (
                            <MdNotificationsActive className="icon-ringing" />
                          ) : (
                            <MdNotifications />
                          )}
                        </button>
                      )}
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

                    <div className="all-event-location">
                      <FaMapMarkerAlt />
                      <span>{event.location}</span>
                    </div>

                    <p className="all-event-description">{event.details}</p>
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
                  disabled={isPastEvent(
                    date.getFullYear() +
                      "-" +
                      String(date.getMonth() + 1).padStart(2, "0") +
                      "-" +
                      String(date.getDate()).padStart(2, "0")
                  )}
                  title={
                    isPastEvent(
                      date.getFullYear() +
                        "-" +
                        String(date.getMonth() + 1).padStart(2, "0") +
                        "-" +
                        String(date.getDate()).padStart(2, "0")
                    )
                      ? "Cannot set reminder for past dates"
                      : "Set reminder"
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
                    if (!hasEvent || isPastEvent(selectedDateStr)) return;

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
                      className="events-artisan-avatar"
                    />
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abc"
                      alt="Featured artisan"
                      className="events-artisan-avatar"
                    />
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abf"
                      alt="Featured artisan"
                      className="events-artisan-avatar"
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

      <BookingModal
        isOpen={showBookingModal}
        event={selectedEventForBooking}
        onClose={closeBookingModal}
        onSubmit={handleBookingSubmit}
      />

      <Footer />
    </div>
  );
}
