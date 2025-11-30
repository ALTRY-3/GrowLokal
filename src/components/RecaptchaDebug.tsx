"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function RecaptchaDebug() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Only debug reCAPTCHA on login and signup pages
    const shouldLoadRecaptcha = pathname === '/login' || pathname === '/signup';
    
    console.log('=== reCAPTCHA Debug Info ===');
    console.log('Current page:', pathname);
    console.log('Should load reCAPTCHA:', shouldLoadRecaptcha);
    console.log('NEXT_PUBLIC_RECAPTCHA_SITE_KEY:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Window grecaptcha:', typeof window !== 'undefined' ? (window as any).grecaptcha : 'undefined');
    
    if (!shouldLoadRecaptcha) {
      console.log('ℹ️ reCAPTCHA not loaded on this page (only loads on /login and /signup)');
      return;
    }
    
    if (typeof window !== 'undefined') {
      const checkInterval = setInterval(() => {
        if ((window as any).grecaptcha) {
          console.log('✓ grecaptcha object found:', (window as any).grecaptcha);
          console.log('✓ grecaptcha.ready:', typeof (window as any).grecaptcha.ready);
          console.log('✓ grecaptcha.execute:', typeof (window as any).grecaptcha.execute);
          clearInterval(checkInterval);
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!(window as any).grecaptcha) {
          console.error('✗ grecaptcha not loaded after 10 seconds');
        }
      }, 10000);
    }
  }, [pathname]);

  return null;
}
