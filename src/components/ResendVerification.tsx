import { useState, useEffect } from 'react';
import { useCsrfToken, getCsrfHeaders } from '@/lib/useCsrfToken';

interface ResendVerificationProps {
  email: string;
  onSuccess?: (message: string, devLink?: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function ResendVerification({ 
  email, 
  onSuccess, 
  onError,
  className = '' 
}: ResendVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { csrfToken } = useCsrfToken();

  // Countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (isResending || cooldown > 0 || !email) return;

    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', getCsrfHeaders(csrfToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }));

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.cooldown) {
          setCooldown(data.cooldown);
        }
        throw new Error(data.error || 'Failed to resend verification email');
      }

      // Success - set cooldown to 60 seconds
      setCooldown(60);
      
      if (onSuccess) {
        onSuccess(data.message, data.developmentLink);
      }

    } catch (error: any) {
      if (onError) {
        onError(error.message || 'Failed to resend verification email');
      }
    } finally {
      setIsResending(false);
    }
  };

  const isDisabled = isResending || cooldown > 0;

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={isDisabled}
      className={className}
      style={{
        opacity: isDisabled ? 0.6 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      {isResending ? (
        <>
          <i className="fas fa-spinner fa-spin"></i> Sending...
        </>
      ) : cooldown > 0 ? (
        <>
          <i className="fas fa-clock"></i> Resend in {cooldown}s
        </>
      ) : (
        <>
          <i className="fas fa-envelope"></i> Resend Verification Email
        </>
      )}
    </button>
  );
}
