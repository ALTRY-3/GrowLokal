"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "./verify-email.css";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams?.get('token');
      const email = searchParams?.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid verification link. Please request a new one.');
        return;
      }

      setUserEmail(email);

      try {
        const response = await fetch('/api/auth/verify-magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          
          // Store the JWT token
          if (data.token) {
            localStorage.setItem('token', data.token);
          }

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleResendLink = async () => {
    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('New verification link sent to your email!');
      }
    } catch (error) {
      console.error('Error resending link:', error);
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
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
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
            <h1 className="hero-title">Welcome to GrowLokal!</h1>
            <p className="hero-subtitle">
              You're just one step away from joining our community of local artisans and creators.
            </p>
          </div>

          <div className="hero-image">
            <Image
              src="/slide2.jpg"
              alt="Artisan community"
              className="craft-image"
              width={400}
              height={200}
            />
          </div>

          <div className="dots-indicator">
            <div className="dot"></div>
            <div className="dot active"></div>
            <div className="dot"></div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="verify-container">
          <div className="verify-header">
            <div className={`status-icon ${status}`}>
              {status === 'verifying' && <i className="fas fa-spinner fa-spin"></i>}
              {status === 'success' && <i className="fas fa-check-circle"></i>}
              {status === 'error' && <i className="fas fa-exclamation-circle"></i>}
            </div>
            
            <h2>
              {status === 'verifying' && 'Verifying Your Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </h2>
            
            <p className="status-message">{message}</p>
          </div>

          <div className="action-section">
            {status === 'success' && (
              <div className="success-actions">
                <p className="redirect-notice">
                  Redirecting you to login in a few seconds...
                </p>
                <Link href="/login?verified=true" className="continue-button">
                  Continue to Login
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="error-actions">
                {userEmail && (
                  <button onClick={handleResendLink} className="resend-button">
                    <i className="fas fa-paper-plane"></i>
                    Send New Verification Link
                  </button>
                )}
                <Link href="/signup" className="signup-link">
                  Back to Sign Up
                </Link>
              </div>
            )}

            {status === 'verifying' && (
              <div className="verifying-actions">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}