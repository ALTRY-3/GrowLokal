export type EventType =
  | "Festival"
  | "Craft Fair"
  | "Local Market"
  | "Cultural Show"
  | "Business Campaign"
  | "Workshop"
  | "Demo";

export type Event = {
  id: number;
  date: string;
  title: string;
  dateText: string;
  time: string;
  location: string;
  details: string;
  type: EventType;
  organizer?: string;
  featuredArtisan?: string;
};

export const events: Event[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
    id: 6,
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
    id: 7,
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
    id: 8,
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
    id: 9,
    date: "2026-03-25",
    title: "Cultural Festival",
    dateText: "March 25, 2026",
    time: "9:00 AM",
    location: "Magsaysay Drive, Olongapo City",
    details:
      "Experience the art of pottery up close in this live demonstration featuring the creative process from clay molding to final design. Participants will witness various shaping and glazing techniques, learn about the cultural roots of pottery, and discover how simple clay can be transformed into timeless works of art. Ideal for anyone curious about craftsmanship and creative expression.",
    type: "Demo",
    featuredArtisan: "Lucia Mendez",
  },
];
