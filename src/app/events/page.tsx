"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
import { useSession } from "next-auth/react";
import { events, type Event, type EventType } from "@/data/events";
import { broadcastNotificationsUpdate } from "@/lib/clientNotifications";

const EVENT_TYPES: readonly EventType[] = [
  "Festival",
  "Craft Fair",
  "Local Market",
  "Cultural Show",
  "Business Campaign",
  "Workshop",
  "Demo",
] as const;

const isEventType = (value: string | undefined): value is EventType =>
  EVENT_TYPES.includes(value as EventType);

type BookingRequest = {
  eventId: number;
  eventTitle: string;
  userName: string;
  userEmail: string;
  participants: number;
  message: string;
};

type StoredBooking = {
  _id: string;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventDateText: string;
  eventTime: string;
  eventLocation: string;
  eventType: EventType;
  organizer?: string;
  featuredArtisan?: string;
  contactName: string;
  contactEmail: string;
  participants: number;
  message?: string;
  bookedAt: string;
};

type SerializableId = { toString(): string };

type RawBooking = Partial<
  Omit<StoredBooking, "_id" | "eventDate" | "bookedAt" | "eventType">
> & {
  _id?: string | SerializableId;
  eventDate?: string | Date | null;
  bookedAt?: string | Date | null;
  eventType?: EventType | string;
  userName?: string;
  userEmail?: string;
};

type BookingListResponse =
  | { success: true; data: RawBooking[] }
  | { success: false; message?: string };

type BookingMutationResponse =
  | { success: true; data: RawBooking }
  | { success: false; message?: string };

type BookingDeleteResponse =
  | { success: true }
  | { success: false; message?: string };

const toIsoString = (value?: string | Date) => {
  if (!value) {
    return new Date().toISOString();
  }
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const formatDisplayDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeBooking = (booking: RawBooking): StoredBooking => {
  const eventDateIso = toIsoString(booking.eventDate ?? booking.bookedAt);
  const eventId =
    typeof booking.eventId === "number"
      ? booking.eventId
      : Number.parseInt(String(booking.eventId ?? 0), 10);
  const resolvedEventType = isEventType(booking.eventType)
    ? booking.eventType
    : "Local Market";
  const serializedId =
    typeof booking._id === "string" ? booking._id : booking._id?.toString();

  return {
    _id: serializedId ?? `${eventId}-${booking.bookedAt ?? Date.now()}`,
    eventId,
    eventTitle: booking.eventTitle ?? "",
    eventDate: eventDateIso,
    eventDateText: booking.eventDateText ?? formatDisplayDate(eventDateIso),
    eventTime: booking.eventTime ?? "",
    eventLocation: booking.eventLocation ?? "",
    eventType: resolvedEventType,
    organizer: booking.organizer ?? undefined,
    featuredArtisan: booking.featuredArtisan ?? undefined,
    contactName: booking.contactName ?? booking.userName ?? "",
    contactEmail: booking.contactEmail ?? booking.userEmail ?? "",
    participants:
      typeof booking.participants === "number"
        ? booking.participants
        : Number(booking.participants ?? 1),
    message: booking.message ?? undefined,
    bookedAt: toIsoString(booking.bookedAt),
  };
};

const formatDateKey = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const getDaysUntil = (value: string): number | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// BookingModal Component
interface BookingModalProps {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  onSubmit: (booking: BookingRequest) => Promise<boolean>;
  isSubmitting: boolean;
  errorMessage: string | null;
}

function BookingModal({
  isOpen,
  event,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: BookingModalProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    const booking: BookingRequest = {
      eventId: event.id,
      eventTitle: event.title,
      userName: formData.name,
      userEmail: formData.email,
      participants: formData.participants,
      message: formData.message,
    };

    const success = await onSubmit(booking);
    if (!success) {
      return;
    }

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
              You&apos;re booked for <strong>{event.title}</strong>!
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

              {errorMessage && (
                <p className="booking-modal-error" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="booking-modal-submit-btn"
                disabled={
                  !formData.name || !formData.email || isSubmitting
                }
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

interface ManageBookingModalProps {
  isOpen: boolean;
  booking: StoredBooking | null;
  mode: "edit" | "cancel";
  onClose: () => void;
  onSubmit: (updates: { participants: number; message: string }) => Promise<boolean>;
  onCancelBooking: () => Promise<boolean>;
  isSubmitting: boolean;
  isCancelling: boolean;
  errorMessage: string | null;
}

function ManageBookingModal({
  isOpen,
  booking,
  mode,
  onClose,
  onSubmit,
  onCancelBooking,
  isSubmitting,
  isCancelling,
  errorMessage,
}: ManageBookingModalProps) {
  const [formState, setFormState] = useState({
    participants: 1,
    message: "",
  });

  useEffect(() => {
    if (booking) {
      setFormState({
        participants: booking.participants,
        message: booking.message ?? "",
      });
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formState);
  };

  return (
    <div
      className="booking-modal-backdrop"
      onClick={(e) =>
        e.target === e.currentTarget && !isSubmitting && !isCancelling && onClose()
      }
    >
      <div className="booking-modal">
        <button
          className="booking-modal-close"
          onClick={onClose}
          aria-label="Close manage booking modal"
          disabled={isSubmitting || isCancelling}
        >
          <FaTimes />
        </button>
        <div className="booking-modal-header">
          <h2>Manage Booking</h2>
          <p className="booking-modal-subtitle">
            {mode === "cancel"
              ? "You&apos;re about to cancel this experience."
              : "Update your participant count or note."}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="booking-modal-form">
          <div className="booking-form-section">
            <label className="booking-form-label">Event</label>
            <input
              type="text"
              value={booking.eventTitle}
              readOnly
              className="booking-form-input readonly"
            />
          </div>
          <div className="booking-form-row">
            <div className="booking-form-section">
              <label className="booking-form-label">Date</label>
              <input
                type="text"
                value={booking.eventDateText}
                readOnly
                className="booking-form-input readonly"
              />
            </div>
            <div className="booking-form-section">
              <label className="booking-form-label">Time</label>
              <input
                type="text"
                value={booking.eventTime}
                readOnly
                className="booking-form-input readonly"
              />
            </div>
          </div>
          <div className="booking-form-section">
            <label className="booking-form-label">Participants</label>
            <input
              type="number"
              min={1}
              value={formState.participants}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  participants: parseInt(e.target.value, 10) || 1,
                }))
              }
              className="booking-form-input"
            />
          </div>
          <div className="booking-form-section">
            <label className="booking-form-label">Message</label>
            <textarea
              rows={3}
              value={formState.message}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, message: e.target.value }))
              }
              className="booking-form-input booking-form-textarea"
              placeholder="Add a note for the organizer"
            />
          </div>
          {errorMessage && (
            <p className="booking-modal-error" role="alert">
              {errorMessage}
            </p>
          )}
          <div className="booking-modal-actions">
            <button
              type="submit"
              className="booking-modal-submit-btn"
              disabled={isSubmitting || formState.participants < 1}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="booking-modal-secondary-btn"
              onClick={onCancelBooking}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [reminders, setReminders] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [, setSuggestions] = useState<typeof events>([]);
  const [calendarReminder, setCalendarReminder] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<EventType | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingModalError, setBookingModalError] = useState<string | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedBookingForManage, setSelectedBookingForManage] =
    useState<StoredBooking | null>(null);
  const [isManageUpdating, setIsManageUpdating] = useState(false);
  const [isManageCancelling, setIsManageCancelling] = useState(false);
  const [manageModalError, setManageModalError] = useState<string | null>(null);
  const [manageModalMode, setManageModalMode] = useState<"edit" | "cancel">(
    "edit"
  );
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedEventForBooking, setSelectedEventForBooking] =
    useState<Event | null>(null);
  const [canScrollFeatured, setCanScrollFeatured] = useState({
    left: false,
    right: true,
  });
  const [, setCanScrollAllEvents] = useState({
    left: false,
    right: true,
  });

  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const featuredEventsGridRef = useRef<HTMLDivElement | null>(null);
  const allEventsGridRef = useRef<HTMLDivElement | null>(null);
  const [emphasizedEvent, setEmphasizedEvent] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { status: authStatus } = useSession();

  // Load reminders from localStorage on mount
  useEffect(() => {
    const savedReminders = localStorage.getItem("eventReminders");
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    if (authStatus !== "authenticated") {
      return;
    }

    setIsLoadingBookings(true);
    setBookingError(null);

    try {
      const response = await fetch("/api/events/bookings", {
        method: "GET",
        cache: "no-store",
      });
      const data: BookingListResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Unable to load bookings"
        );
      }

      if (!data.success) {
        throw new Error(data.message ?? "Unable to load bookings");
      }

      const normalized = data.data.map((booking) => normalizeBooking(booking));

      setBookings(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load bookings";
      setBookingError(message);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchBookings();
    }

    if (authStatus === "unauthenticated") {
      setBookings([]);
      setBookingError(null);
    }
  }, [authStatus, fetchBookings]);

  const bookedDateSet = useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach((booking) => {
      const key = formatDateKey(booking.eventDate);
      if (key) {
        dates.add(key);
      }
    });
    return dates;
  }, [bookings]);

  const upcomingBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings
      .filter((booking) => {
        const eventDate = new Date(booking.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );
  }, [bookings]);

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

  const closeManageModal = useCallback(() => {
    setShowManageModal(false);
    setSelectedBookingForManage(null);
    setManageModalError(null);
    setIsManageUpdating(false);
    setIsManageCancelling(false);
  }, []);

  const handleBookingSubmit = useCallback(
    async (booking: BookingRequest) => {
      if (authStatus !== "authenticated") {
        setBookingModalError("Please log in to book events.");
        return false;
      }

      setBookingModalError(null);
      setIsBookingSubmitting(true);

      try {
        const response = await fetch("/api/events/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(booking),
        });

        const data: BookingMutationResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Unable to create booking"
          );
        }

        if (!data.success) {
          throw new Error(data.message ?? "Unable to create booking");
        }

        const normalized = normalizeBooking(data.data);
        setBookings((prev) => [...prev, normalized]);
        broadcastNotificationsUpdate();
        setBookingModalError(null);
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to create booking";
        setBookingModalError(message);
        return false;
      } finally {
        setIsBookingSubmitting(false);
      }
    },
    [authStatus]
  );

  const handleManageSubmit = useCallback(
    async (updates: { participants: number; message: string }) => {
      if (!selectedBookingForManage) {
        return false;
      }

      setIsManageUpdating(true);
      setManageModalError(null);

      try {
        const response = await fetch(
          `/api/events/bookings/${selectedBookingForManage._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          }
        );

        const data: BookingMutationResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Unable to update booking"
          );
        }

        if (!data.success) {
          throw new Error(data.message ?? "Unable to update booking");
        }

        const normalized = normalizeBooking(data.data);
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === normalized._id ? normalized : booking
          )
        );
        closeManageModal();
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update booking";
        setManageModalError(message);
        return false;
      } finally {
        setIsManageUpdating(false);
      }
    },
    [selectedBookingForManage, closeManageModal]
  );

  const handleBookingCancel = useCallback(async () => {
    if (!selectedBookingForManage) {
      return false;
    }

    setIsManageCancelling(true);
    setManageModalError(null);

    try {
      const response = await fetch(
        `/api/events/bookings/${selectedBookingForManage._id}`,
        {
          method: "DELETE",
        }
      );

      const data: BookingDeleteResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Unable to cancel booking"
        );
      }

      if (!data.success) {
        throw new Error(data.message ?? "Unable to cancel booking");
      }

      setBookings((prev) =>
        prev.filter((booking) => booking._id !== selectedBookingForManage._id)
      );
      closeManageModal();
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to cancel booking";
      setManageModalError(message);
      return false;
    } finally {
      setIsManageCancelling(false);
    }
  }, [selectedBookingForManage, closeManageModal]);

  // Check if an event is already booked
  const isEventBooked = (eventId: number): boolean => {
    return bookings.some((booking) => booking.eventId === eventId);
  };

  const openBookingModal = (event: Event) => {
    setBookingModalError(null);
    setSelectedEventForBooking(event);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedEventForBooking(null);
    setBookingModalError(null);
  };

  const openManageModal = (
    booking: StoredBooking,
    mode: "edit" | "cancel" = "edit"
  ) => {
    setSelectedBookingForManage(booking);
    setManageModalMode(mode);
    setManageModalError(null);
    setShowManageModal(true);
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
            aria-label="Search for Olongapo&apos;s events"
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
              {EVENT_TYPES.map((type) => (
                <button
                  key={type}
                  className={`event-filter-option ${
                    selectedFilter === type ? "active" : ""
                  }`}
                  onClick={() => {
                    const newFilter = selectedFilter === type ? null : type;
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
                .map((event) => (
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
                  const classes: string[] = [];
                  const dateStr = formatDateKey(tileDate);

                  if (reminders.includes(dateStr)) {
                    classes.push("react-calendar__tile--reminder");
                  }

                  if (bookedDateSet.has(dateStr)) {
                    classes.push("react-calendar__tile--booked");
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
                    classes.push("react-calendar__tile--reminder");
                  }

                  return classes.join(" ");
                }}
                tileContent={({ date: tileDate }) => {
                  const hasEvent = events.some(
                    (event) =>
                      new Date(event.date).toDateString() ===
                      tileDate.toDateString()
                  );
                  const dateStr = formatDateKey(tileDate);
                  const isBooked = bookedDateSet.has(dateStr);

                  if (!hasEvent && !isBooked) {
                    return null;
                  }

                  return (
                    <div
                      className={`calendar-tile-indicator${
                        isBooked ? " booked" : ""
                      }`}
                    />
                  );
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

            <section className="calendar-bookings-section">
              <div className="calendar-bookings-header">
                <span>My Booked Events</span>
                {authStatus === "authenticated" && (
                  <button
                    type="button"
                    className="calendar-bookings-refresh"
                    onClick={fetchBookings}
                    disabled={isLoadingBookings}
                  >
                    {isLoadingBookings ? "Syncing..." : "Refresh"}
                  </button>
                )}
              </div>

              {authStatus === "loading" ? (
                <p className="calendar-bookings-empty">
                  Syncing your calendar...
                </p>
              ) : authStatus !== "authenticated" ? (
                <p className="calendar-bookings-empty">
                  Sign in to automatically save workshops and demos to your
                  calendar.
                </p>
              ) : bookingError ? (
                <p className="calendar-bookings-error" role="alert">
                  {bookingError}
                </p>
              ) : upcomingBookings.length === 0 ? (
                <p className="calendar-bookings-empty">
                  Book an experience to see it here.
                </p>
              ) : (
                <ul className="calendar-bookings-list">
                  {upcomingBookings.map((booking) => {
                    const daysUntil = getDaysUntil(booking.eventDate);
                    return (
                      <li
                        key={booking._id}
                        className="calendar-booking-card"
                      >
                        <div className="calendar-booking-date">
                          {formatDisplayDate(booking.eventDate)}
                        </div>
                        <div className="calendar-booking-title">
                          {booking.eventTitle}
                        </div>
                        <div className="calendar-booking-meta">
                          <span>
                            <FaClock aria-hidden="true" /> {booking.eventTime}
                          </span>
                          <span>
                            <FaMapMarkerAlt aria-hidden="true" />
                            {" "}
                            {booking.eventLocation}
                          </span>
                        </div>
                        {daysUntil !== null && (
                          <span className="calendar-booking-countdown">
                            {daysUntil > 0
                              ? `In ${daysUntil} day${
                                  daysUntil === 1 ? "" : "s"
                                }`
                              : "Happening today"}
                          </span>
                        )}
                        <div className="calendar-booking-actions">
                          <button
                            type="button"
                            className="calendar-booking-action"
                            onClick={() => openManageModal(booking, "edit")}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="calendar-booking-action danger"
                            onClick={() => openManageModal(booking, "cancel")}
                          >
                            Cancel
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </main>

      <BookingModal
        isOpen={showBookingModal}
        event={selectedEventForBooking}
        onClose={closeBookingModal}
        onSubmit={handleBookingSubmit}
        isSubmitting={isBookingSubmitting}
        errorMessage={bookingModalError}
      />

      <ManageBookingModal
        isOpen={showManageModal}
        booking={selectedBookingForManage}
        mode={manageModalMode}
        onClose={closeManageModal}
        onSubmit={handleManageSubmit}
        onCancelBooking={handleBookingCancel}
        isSubmitting={isManageUpdating}
        isCancelling={isManageCancelling}
        errorMessage={manageModalError}
      />

      <Footer />
    </div>
  );
}
