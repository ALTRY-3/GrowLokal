"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

const MapContent = dynamic(() => import("./MapContent"), { ssr: false });

export default function MapPage() {
  const router = useRouter();

  return (
    <main className="map-page">
      <button onClick={() => router.push("/events")} className="back-button">
        <FontAwesomeIcon icon={faChevronLeft} />
        <span
          style={{
            fontWeight: 600,
            fontSize: "1rem",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          BACK
        </span>
      </button>
      <div className="map-wrapper">
        <MapContent />
      </div>
    </main>
  );
}
