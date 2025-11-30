"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { useCsrfToken, getCsrfHeaders } from "@/lib/useCsrfToken";
import type { PasswordStrength } from "@/lib/passwordPolicy";
import "./reset-password.css";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [tokenState, setTokenState] = useState<'valid' | 'invalid' | 'expired' | 'used'>('valid');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [isPasswordBreached, setIsPasswordBreached] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');
  const { csrfToken, loading: csrfLoading } = useCsrfToken();

  useEffect(() => {
    if (!token || !email) {
      setIsValidToken(false);
      setTokenState('invalid');
      setMessage('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidToken) {
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      setIsSuccess(false);
      return;
    }

    // Check password strength
    if (!passwordStrength || passwordStrength.score < 2) {
      setMessage("Please choose a stronger password!");
      setIsSuccess(false);
      return;
    }

    // Warn about breached passwords
    if (isPasswordBreached) {
      setMessage("This password has been found in a data breach. Please choose a different password.");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/auth/reset-password', getCsrfHeaders(csrfToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          email, 
          newPassword: password 
        }),
      }));

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setIsSuccess(true);
        setTokenState('valid');
        // Redirect to login after 4 seconds
        setTimeout(() => {
          router.push('/login?reset=true');
        }, 4000);
      } else {
        setMessage(data.message || 'An error occurred. Please try again.');
        setIsSuccess(false);
        
        // Set token state based on error code
        if (data.errorCode === 'TOKEN_EXPIRED') {
          setTokenState('expired');
          setIsValidToken(false);
        } else if (data.errorCode === 'TOKEN_USED') {
          setTokenState('used');
          setIsValidToken(false);
        } else if (data.errorCode === 'INVALID_TOKEN') {
          setTokenState('invalid');
          setIsValidToken(false);
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage('Network error. Please check your connection and try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-app-container">
      {/* Left Panel - Hero Section */}
      <div className="left-panel">
        <div className="pattern-overlay">
          <Image
            src="/left-panel.svg"
            alt="Pattern"
            className="left-pattern"
            fill
            sizes="60px"
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
                sizes="40px"
              />
            </div>
            <span className="logo-text">GrowLokal</span>
          </div>

          <div className="hero-section">
            <h1 className="hero-title">Secure Your Account</h1>
            <p className="hero-subtitle">
              Create a strong, unique password to protect your account and personal information.
            </p>

            <div className="hero-image">
              <Image
                src="/slide2.jpg"
                alt="Security Illustration"
                className="craft-image"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            </div>

            <ul className="features-list">
              <li className="feature-item">
                <i className="fas fa-shield-alt"></i>
                <span>Bank-level encryption protects your password</span>
              </li>
              <li className="feature-item">
                <i className="fas fa-clock"></i>
                <span>Reset links expire after 1 hour for security</span>
              </li>
              <li className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>One-time use tokens prevent unauthorized access</span>
              </li>
              <li className="feature-item">
                <i className="fas fa-user-lock"></i>
                <span>Your data is always private and secure</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="main-content">
        <div className="back-button">
          <Link href="/login">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="reset-container">
          <div className="reset-header">
            <div className="lock-icon">
              <i className="fas fa-key"></i>
            </div>
            <h2>Reset Password</h2>
            <p>
              Create a strong password with at least 8 characters including uppercase, lowercase, and numbers.
            </p>
          </div>

          {message && (
            <div className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
              <i className={`fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
              {message}
              {isSuccess && (
                <div className="redirect-timer">
                  Redirecting to login in a few seconds...
                </div>
              )}
            </div>
          )}

          {!isValidToken ? (
            <div className="invalid-token">
              <div className="invalid-icon">
                <i className={`fas ${
                  tokenState === 'expired' ? 'fa-clock' : 
                  tokenState === 'used' ? 'fa-check-circle' : 
                  'fa-times-circle'
                }`}></i>
              </div>
              <p>
                {tokenState === 'expired' && 'This password reset link has expired. Links are valid for 1 hour.'}
                {tokenState === 'used' && 'This password reset link has already been used.'}
                {tokenState === 'invalid' && 'This password reset link is invalid.'}
              </p>
              <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                {tokenState === 'expired' && (
                  <p>Password reset links expire after 1 hour for security reasons.</p>
                )}
                {tokenState === 'used' && (
                  <p>Each reset link can only be used once. If you need to reset your password again, please request a new link.</p>
                )}
                {tokenState === 'invalid' && (
                  <p>The link may be corrupted or incomplete. Please copy and paste the entire link from your email.</p>
                )}
              </div>
              <Link href="/forgot-password" className="retry-link" style={{ marginTop: '20px', display: 'inline-block' }}>
                <i className="fas fa-redo"></i>
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form className="reset-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} input-icon password-toggle`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <PasswordStrengthMeter
                  password={password}
                  checkBreaches={true}
                  onChange={(strength, breached) => {
                    setPasswordStrength(strength);
                    setIsPasswordBreached(breached || false);
                  }}
                />
              )}

              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-input ${confirmPassword && password !== confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <i
                  className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} input-icon password-toggle`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                ></i>
                {confirmPassword && password !== confirmPassword && (
                  <div className="field-error">
                    <i className="fas fa-exclamation-circle"></i>
                    Passwords don't match
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className={`reset-button ${isSuccess ? 'success' : ''}`}
                disabled={isLoading || isSuccess || !passwordStrength || passwordStrength.score < 2 || password !== confirmPassword}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Updating Password...
                  </>
                ) : isSuccess ? (
                  <>
                    <i className="fas fa-check"></i>
                    Password Updated Successfully!
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Update Password
                  </>
                )}
              </button>
            </form>
          )}

          <div className="login-redirect">
            <p>
              Remember your password?{' '}
              <Link href="/login" className="login-link">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="security-footer">
            <div className="security-features">
              <div className="feature-item">
                <i className="fas fa-shield-alt"></i>
                <span>Bank-level Security</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-lock"></i>
                <span>Encrypted Storage</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-user-shield"></i>
                <span>Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
