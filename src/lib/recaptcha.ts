/**
 * Google reCAPTCHA v3 integration utilities
 * 
 * Setup instructions:
 * 1. Get your reCAPTCHA v3 keys from: https://www.google.com/recaptcha/admin
 * 2. Add to .env.local:
 *    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
 *    RECAPTCHA_SECRET_KEY=your_secret_key
 */

export interface RecaptchaVerifyResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

/**
 * Verify reCAPTCHA token on the server
 * @param token - The reCAPTCHA token from the client
 * @param action - The action name (should match the client-side action)
 * @param minimumScore - Minimum score required (0.0 - 1.0), default 0.5
 */
export async function verifyRecaptcha(
  token: string,
  action: string,
  minimumScore: number = 0.5
): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY not configured');
      // In development, allow bypass if not configured
      if (process.env.NODE_ENV === 'development') {
        return { success: true, score: 1.0 };
      }
      return { success: false, error: 'reCAPTCHA not configured' };
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    if (!response.ok) {
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    const data: RecaptchaVerifyResponse = await response.json();

    if (!data.success) {
      return { 
        success: false, 
        error: `reCAPTCHA verification failed: ${data['error-codes']?.join(', ')}` 
      };
    }

    // Check if action matches
    if (data.action !== action) {
      return { 
        success: false, 
        error: 'reCAPTCHA action mismatch' 
      };
    }

    // Check score
    if (data.score < minimumScore) {
      return { 
        success: false, 
        score: data.score,
        error: `reCAPTCHA score too low: ${data.score}` 
      };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'reCAPTCHA verification exception' };
  }
}

/**
 * Client-side function to load reCAPTCHA script
 * Call this in your app's root or layout component
 */
export function loadRecaptchaScript(siteKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('reCAPTCHA can only be loaded in the browser'));
      return;
    }

    // Check if already loaded
    if ((window as any).grecaptcha?.ready) {
      console.log('reCAPTCHA already loaded');
      resolve();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
    if (existingScript) {
      console.log('reCAPTCHA script already in DOM, waiting for ready...');
      const checkReady = setInterval(() => {
        if ((window as any).grecaptcha?.ready) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkReady);
        reject(new Error('reCAPTCHA script timeout'));
      }, 10000);
      return;
    }

    console.log('Loading reCAPTCHA script with site key:', siteKey);
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('reCAPTCHA script loaded successfully');
      // Wait for grecaptcha.ready to be available
      const checkReady = setInterval(() => {
        if ((window as any).grecaptcha?.ready) {
          clearInterval(checkReady);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkReady);
        resolve(); // Resolve anyway after timeout
      }, 5000);
    };
    script.onerror = (error) => {
      console.error('Failed to load reCAPTCHA script:', error);
      reject(new Error('Failed to load reCAPTCHA script'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA and get token
 * @param action - Action name (e.g., 'login', 'signup', 'forgot_password')
 */
export async function executeRecaptcha(action: string): Promise<string> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  if (!siteKey) {
    console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY not configured');
    return 'development-bypass-token';
  }

  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA can only be executed in the browser');
  }

  if (!(window as any).grecaptcha) {
    console.error('grecaptcha object not found on window');
    throw new Error('reCAPTCHA not loaded');
  }

  if (!(window as any).grecaptcha.ready) {
    console.error('grecaptcha.ready not available');
    throw new Error('reCAPTCHA not fully initialized');
  }

  console.log(`Executing reCAPTCHA for action: ${action}`);

  return new Promise((resolve, reject) => {
    try {
      (window as any).grecaptcha.ready(() => {
        console.log('reCAPTCHA ready, executing...');
        (window as any).grecaptcha
          .execute(siteKey, { action })
          .then((token: string) => {
            console.log(`reCAPTCHA token obtained for ${action}:`, token.substring(0, 20) + '...');
            resolve(token);
          })
          .catch((error: any) => {
            console.error('reCAPTCHA execute error:', error);
            reject(error);
          });
      });
    } catch (error) {
      console.error('reCAPTCHA ready error:', error);
      reject(error);
    }
  });
}
