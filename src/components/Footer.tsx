"use client";

import { FaEnvelope, FaFacebook, FaInstagram, FaPhone } from "react-icons/fa";
import Link from "next/link";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section about">
          <h3>About GrowLokal</h3>
          <p>
            GrowLokal is a community marketplace connecting Olongapo’s artisans,
            indigenous communities, and entrepreneurs with the world. We
            celebrate culture, support sustainable tourism, and empower local
            economies through digital innovation.
          </p>
        </div>

        <div className="footer-section links">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <Link href="/marketplace">Marketplace</Link>
            </li>
            <li>
              <Link href="/stories">Stories</Link>
            </li>
            <li>
              <Link href="/events">Events</Link>
            </li>
            <li>
              <Link href="/map">Map</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section connect">
          <h3>Connect With Us</h3>
          <div className="social-icons">
            <FaFacebook />
            <FaInstagram />
          </div>
          <div className="contact-info">
            <p>
              <FaEnvelope /> team.growlokal@gmail.com
            </p>
            <p>
              <FaPhone /> +63 912 911 7890
            </p>
          </div>
        </div>
      </div>

      <div className="footer-copyright">
        © 2025 GrowLokal. Preserving Filipino heritage, one craft at a time.
      </div>
    </footer>
  );
}
