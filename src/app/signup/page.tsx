"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import ImageCarousel from "@/components/ImageCarousel";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { useRecaptcha } from "@/lib/useRecaptcha";
import { useCsrfToken, getCsrfHeaders } from "@/lib/useCsrfToken";
import { getFriendlyErrorMessage } from "@/lib/authErrors";
import type { PasswordStrength } from "@/lib/passwordPolicy";
import "./signup.css";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devVerificationLink, setDevVerificationLink] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [isPasswordBreached, setIsPasswordBreached] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const { getToken, error: recaptchaError } = useRecaptcha();
  const { csrfToken, loading: csrfLoading } = useCsrfToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Redirect authenticated users to marketplace
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/marketplace");
    }
  }, [status, router]);

  // Check for OAuth errors in URL
  useEffect(() => {
    const urlError = searchParams?.get('error');
    if (urlError) {
      setError(getFriendlyErrorMessage(urlError));
    }
  }, [searchParams]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#4CAF50' }}></i>
          <p style={{ marginTop: '20px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!agreeToTerms) {
      setError("Please agree to the Terms of Service");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check password strength
    if (!passwordStrength || passwordStrength.score < 2) {
      setError("Please choose a stronger password");
      return;
    }

    // Warn about breached passwords
    if (isPasswordBreached) {
      setError("This password has been found in a data breach. Please choose a different password.");
      return;
    }

    setIsLoading(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getToken('signup');
      
      if (!recaptchaToken && process.env.NODE_ENV !== 'development') {
        throw new Error('Security verification failed. Please try again.');
      }

      const response = await fetch('/api/auth/register', getCsrfHeaders(csrfToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          recaptchaToken,
        }),
      }));

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Save token to localStorage (you might want to use a more secure method)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Store development link if provided
      if (data.developmentLink) {
        setDevVerificationLink(data.developmentLink);
        console.log('Development verification link:', data.developmentLink);
      }

      // Show success message and redirect to login
      setSuccess("Account created successfully! Please check your email to verify your account.");
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error: any) {
      setError(getFriendlyErrorMessage(error.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'facebook') => {
    if (socialLoading || isLoading) return; // Prevent double submit
    
    setSocialLoading(provider);
    setError(""); // Clear previous errors
    try {
      const result = await signIn(provider, { 
        callbackUrl: '/marketplace',
        redirect: false 
      });
      
      if (result?.error) {
        setError(getFriendlyErrorMessage(result.error));
        setSocialLoading(null);
      } else if (result?.ok) {
        window.location.href = '/marketplace';
      }
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error?.message || error));
      setSocialLoading(null);
    }
  };

  return (
    <div className="app-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="pattern-overlay">
          <Image
            src="/left-panel.svg"
            alt="Traditional Pattern"
            className="left-pattern"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
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
                width={40}
                height={40}
                priority
              />
            </div>
            <span className="logo-text">GROWLOKAL</span>
          </div>

          <div className="hero-section">
            <h1 className="hero-title">
              Be part of <div>Olongapo&apos;s story.</div> Sign up today.
            </h1>
            <p className="hero-subtitle">
              Discover authentic crafts, connect with artisans, and support local communities.
            </p>
          </div>

          <ImageCarousel autoSlide={true} slideInterval={2000} />
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="signup-container">
          <div className="signup-header">
            <h2>Get Started</h2>
            <p>
              Already have an account?{" "}
              <Link href="/login" className="login-link">
                Login
              </Link>
            </p>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            {(error || recaptchaError) && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error || recaptchaError}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <div className="input-group">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className="form-input"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
              <i className="fas fa-user input-icon"></i>
            </div>

            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="form-input"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <i className="fas fa-envelope input-icon"></i>
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="form-input"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
              />
              <i
                className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} input-icon password-toggle`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            {/* Password Strength Meter - only shown when password field is focused */}
            {formData.password && isPasswordFocused && (
              <PasswordStrengthMeter
                password={formData.password}
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
                name="confirmPassword"
                placeholder="Confirm Password"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <i
                className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} input-icon password-toggle`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              ></i>
            </div>

            <div className="terms-section">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                />
                <span className="checkmark"></span>
                By checking this box, you are agreeing to our{" "}
                <span className="terms-link" onClick={() => setShowTermsModal(true)}>
                  Terms of Service
                </span>
              </label>
            </div>

            <button type="submit" className="signup-button" disabled={isLoading || socialLoading !== null}>
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  CREATING ACCOUNT...
                </>
              ) : (
                "SIGNUP"
              )}
            </button>
          </form>

          <div className="divider">
            <span>OR SIGN UP WITH</span>
          </div>

          <div className="social-signup">
            <button 
              className="social-button facebook"
              onClick={() => handleSocialSignup('facebook')}
              type="button"
              disabled={isLoading || socialLoading !== null}
              style={{ opacity: socialLoading === 'facebook' || (socialLoading && socialLoading !== 'facebook') ? 0.6 : 1, cursor: (isLoading || socialLoading !== null) ? 'not-allowed' : 'pointer' }}
            >
              {socialLoading === 'facebook' ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <Image
                  src="/facebook.svg"
                  className="social-icon"
                  alt="Facebook"
                  width={20}
                  height={20}
                />
              )}
            </button>
            <button 
              className="social-button google"
              onClick={() => handleSocialSignup('google')}
              type="button"
              disabled={isLoading || socialLoading !== null}
              style={{ opacity: socialLoading === 'google' || (socialLoading && socialLoading !== 'google') ? 0.6 : 1, cursor: (isLoading || socialLoading !== null) ? 'not-allowed' : 'pointer' }}
            >
              {socialLoading === 'google' ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <Image
                  src="/google.svg"
                  className="social-icon"
                  alt="Google"
                  width={20}
                  height={20}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <i className="fa-solid fa-clipboard-list modal-icon"></i>
                <div className="modal-title-text">
                  <h2>Terms of Service</h2>
                  <p className="modal-date">Last updated September 8, 2025</p>
                </div>
              </div>
            </div>

            <div className="modal-body">
              <p>Welcome to GrowLokal, a digital marketplace created to connect Olongapo’s artisans, entrepreneurs, and consumers. By accessing or using our platform, you agree to these Terms of Service. Please read them carefully before proceeding. <br /><br />
                GrowLokal exists to provide a community-driven space where users can explore local crafts, discover cultural products, and support local entrepreneurs. By registering, you confirm that you are <b>at least eighteen (18) years old</b> or that you have the consent of a parent or guardian to use the platform. You also agree to provide accurate and truthful information when creating your account. <br /><br />
                As a member of GrowLokal, you are expected to use the platform responsibly and respectfully. You must not engage in harmful behavior, post misleading or inappropriate content, or misuse the services provided. Any content you upload, such as product descriptions or images, remains your property; however, by posting, you grant GrowLokal permission to display this content on the platform. <b>Please ensure that all content you share belongs to you or that you have the right to share it.</b><br /><br />
                We are committed to fostering a respectful and inclusive community. Accounts or content that promote hate speech, scams, violence, or cultural disrespect may be removed at our discretion. GrowLokal is a student-developed project intended for educational purposes. As such, we cannot guarantee uninterrupted services and we are not liable for disputes or issues that may arise between users in connection with products or transactions. Users are solely responsible for verifying the authenticity of sellers, buyers, and products.<br /><br />
                Your privacy is important to us. Information you provide during signup, such as your name, email address, or other account details, will only be used to grant you access to the platform and improve your experience. We will never sell or misuse your personal data.
                These Terms of Service may be updated from time to time, and continued use of the platform means you accept any revisions made. Should you have any questions, concerns, or suggestions, you may reach us at  <b>growlokal.team@gmail.com. </b>
                By proceeding with signup, you acknowledge that you have read, understood, and agreed to these Terms of Service.</p>
            </div>

            <div className="modal-footer">
              <button className="decline-btn" onClick={() => setShowTermsModal(false)}>
                Decline
              </button>
              <button
                className="accept-btn"
                onClick={() => {
                  setAgreeToTerms(true);
                  setShowTermsModal(false);
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
