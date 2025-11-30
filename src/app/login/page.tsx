"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import ImageCarousel from "@/components/ImageCarousel";
import ResendVerification from "@/components/ResendVerification";
import { getFriendlyErrorMessage, isVerificationError } from "@/lib/authErrors";
import "./login.css";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect authenticated users to marketplace
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/marketplace");
    }
  }, [status, router]);

  useEffect(() => {
    const reset = searchParams?.get("reset");
    const verified = searchParams?.get("verified");
    const urlError = searchParams?.get("error");

    if (reset === "true") {
      setSuccessMessage(
        "Password reset successful! You can now log in with your new password."
      );
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } else if (verified === "true") {
      setSuccessMessage("Email verified successfully! You can now log in.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } else if (urlError) {
      // Handle NextAuth errors from URL parameters
      setError(getFriendlyErrorMessage(urlError));
    }
  }, [searchParams]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <i
            className="fas fa-spinner fa-spin"
            style={{ fontSize: "48px", color: "#4CAF50" }}
          ></i>
          <p style={{ marginTop: "20px" }}>Loading...</p>
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
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        rememberMe: rememberMe,
        redirect: false,
      });

      if (result?.error) {
        // Use friendly error messages
        const friendlyError = getFriendlyErrorMessage(result.error);
        setError(friendlyError);

        // Show resend verification if it's a verification error
        if (isVerificationError(result.error)) {
          setShowResendVerification(true);
        }
      } else if (result?.ok) {
        // Redirect to home on success
        window.location.href = "/home";
      }
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error?.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    if (socialLoading || isLoading) return; // Prevent double submit

    setSocialLoading(provider);
    setError(""); // Clear previous errors
    try {
      const result = await signIn(provider, {
        callbackUrl: "/home",
        redirect: false,
      });

      if (result?.error) {
        setError(getFriendlyErrorMessage(result.error));
        setSocialLoading(null);
      } else if (result?.ok) {
        window.location.href = "/home";
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
                width={48}
                height={48}
              />
            </div>
            <span className="logo-text">GROWLOKAL</span>
          </div>

          <div className="hero-section">
            <h1 className="hero-title">
              Discover Olongapo's heart in every craft.
            </h1>
            <p className="hero-subtitle">
              Experience the stories behind every handmade creation.
            </p>
          </div>

          <ImageCarousel autoSlide={true} slideInterval={2000} />
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="login-container">
          <div className="login-header">
            <h2>Login</h2>
            <p>
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="signup-link">
                Signup
              </Link>
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                {successMessage}
              </div>
            )}

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
                {showResendVerification && formData.email && (
                  <div style={{ marginTop: "10px" }}>
                    <ResendVerification
                      email={formData.email}
                      onSuccess={(message, devLink) => {
                        setSuccessMessage(message);
                        setShowResendVerification(false);
                        if (devLink) {
                          console.log(
                            "Development verification link:",
                            devLink
                          );
                        }
                      }}
                      onError={(err) => setError(err)}
                      className="resend-btn"
                    />
                  </div>
                )}
              </div>
            )}

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
                required
              />
              <i
                className={`fas ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                } input-icon password-toggle`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link href="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading || socialLoading !== null}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  LOGGING IN...
                </>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>

          <div className="divider">
            <span>OR LOGIN WITH</span>
          </div>

          <div className="social-login">
            <button
              className="social-button facebook"
              onClick={() => handleSocialLogin("facebook")}
              type="button"
              disabled={isLoading || socialLoading !== null}
              style={{
                opacity:
                  socialLoading === "facebook" ||
                  (socialLoading && socialLoading !== "facebook")
                    ? 0.6
                    : 1,
              }}
            >
              {socialLoading === "facebook" ? (
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
              onClick={() => handleSocialLogin("google")}
              type="button"
              disabled={isLoading || socialLoading !== null}
              style={{
                opacity:
                  socialLoading === "google" ||
                  (socialLoading && socialLoading !== "google")
                    ? 0.6
                    : 1,
              }}
            >
              {socialLoading === "google" ? (
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
    </div>
  );
}
