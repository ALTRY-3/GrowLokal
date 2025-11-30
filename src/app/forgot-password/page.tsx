"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setIsSuccess(true);
        setEmail(""); // Clear the email field
      } else {
        setMessage(data.message || 'An error occurred. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage('Network error. Please check your connection and try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="pattern-overlay">
          <Image
            src="/left-panel.svg"
            alt="Pattern"
            className="left-pattern"
            fill
          />
        </div>
        
        <div className="left-content">
          <div className="logo-section">
            <div className="logo-icon">
              <Image
                src="/logo.svg"
                alt="GrowLokal Logo"
                className="logo-image"
                fill
              />
            </div>
            <span className="logo-text">GrowLokal</span>
          </div>

          <div className="hero-section">
            <h1 className="hero-title">Forgot Your Password?</h1>
            <p className="hero-subtitle">
              Don't worry! It happens to the best of us. Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="hero-image">
            <Image
              src="/slide1.jpg"
              alt="Artisan crafting"
              className="craft-image"
              width={400}
              height={200}
            />
          </div>

          <div className="dots-indicator">
            <div className="dot active"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="back-button">
          <Link href="/login">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="forgot-container">
          <div className="forgot-header">
            <div className="lock-icon">
              <i className="fas fa-lock"></i>
            </div>
            <h2>Reset Password</h2>
            <p>
              Enter your email address and we'll send you a secure link to reset your password.
            </p>
          </div>

          {message && (
            <div className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
              <i className={`fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
              {message}
            </div>
          )}

          <form className="forgot-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <i className="fas fa-envelope input-icon"></i>
            </div>

            <button type="submit" className="forgot-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  SENDING...
                </>
              ) : (
                'SEND RESET LINK'
              )}
            </button>
          </form>

          <div className="login-redirect">
            <p>
              Remember your password?{' '}
              <Link href="/login" className="login-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}