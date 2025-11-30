"use client";

import { useState, useEffect } from "react";

interface ImageCarouselProps {
  autoSlide?: boolean;
  slideInterval?: number;
}

const images = [
  { src: "/slide4.jpg", alt: "Olongapo traditional crafts and artisans" },
  { src: "/slide5.jpeg", alt: "Local art exhibition and cultural displays" },
  {
    src: "/slide6.jpg",
    alt: "Colorful traditional Filipino textiles and crafts",
  },
];

export default function ImageCarousel({
  autoSlide = true,
  slideInterval = 2000,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoSlide) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, slideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, slideInterval]);

  return (
    <>
      <div className="hero-image">
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          className="craft-image"
        />
      </div>

      <div className="dots-indicator">
        {images.map((_, index) => (
          <div
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
          ></div>
        ))}
      </div>
    </>
  );
}
