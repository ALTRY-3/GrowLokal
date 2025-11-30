"use client";

import { useState } from "react";
import "./otp-verification.css";

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState<string[]>(new Array(4).fill(""));

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    let newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value !== "" && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("OTP entered:", otp.join(""));
    // Example: redirect to reset-password
    window.location.href = "/reset-password";
  };

  return (
    <div className="forgot-app-container">
      <div className="right-panel">
        <div className="forgot-container">
          <div className="forgot-header">
            <i className="fa-solid fa-shield"></i>
            <h2>OTP Verification</h2>
            <p>Enter the 4-digit verification code we sent to your email.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="otp-inputs">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  className="otp-box"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>

            <button
              type="button"
              className="resend-button"
              onClick={() => alert("OTP code resent!")}
            >
              Resend Code
            </button>

            <button type="submit" className="forgot-button">
              VERIFY
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
