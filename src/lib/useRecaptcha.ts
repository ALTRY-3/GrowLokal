"use client";

import { useEffect, useState } from 'react';
import { executeRecaptcha } from '@/lib/recaptcha';

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    
    if (!siteKey) {
      console.warn('reCAPTCHA site key not configured - bypassing in development');
      setIsLoaded(true);
      return;
    }

    // Check if reCAPTCHA is already loaded
    const checkLoaded = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).grecaptcha?.ready) {
        console.log('reCAPTCHA detected as loaded');
        setIsLoaded(true);
        setError(null);
        clearInterval(checkLoaded);
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkLoaded);
      if (!isLoaded) {
        console.warn('reCAPTCHA load timeout - continuing anyway');
        setIsLoaded(true); // Allow bypass
      }
    }, 10000);

    return () => {
      clearInterval(checkLoaded);
      clearTimeout(timeout);
    };
  }, []);

  const getToken = async (action: string): Promise<string | null> => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    
    if (!siteKey) {
      console.warn('reCAPTCHA site key not configured - returning null token');
      return null;
    }

    try {
      if (!isLoaded) {
        console.warn('reCAPTCHA not loaded yet, waiting...');
        // Wait a bit for it to load
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Getting reCAPTCHA token for action: ${action}`);
      const token = await executeRecaptcha(action);
      console.log('Token obtained successfully');
      setError(null);
      return token;
    } catch (err: any) {
      console.error('Failed to execute reCAPTCHA:', err);
      const errorMessage = err?.message || 'Security verification failed';
      setError(errorMessage);
      
      // In development, allow bypass
      if (process.env.NODE_ENV === 'development') {
        console.warn('Development mode: bypassing reCAPTCHA error');
        return null;
      }
      
      return null;
    }
  };

  return {
    isLoaded,
    error,
    getToken,
  };
}
