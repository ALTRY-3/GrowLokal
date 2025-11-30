'use client';

import { useState, useEffect } from 'react';

/**
 * React hook to fetch and manage CSRF tokens
 * Automatically fetches a fresh token on mount
 */
export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      setCsrfToken(data.csrfToken);
    } catch (err: any) {
      console.error('Error fetching CSRF token:', err);
      setError(err.message || 'Failed to fetch CSRF token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  return {
    csrfToken,
    loading,
    error,
    refetch: fetchToken, // Allow manual refresh if needed
  };
}

/**
 * Helper function to add CSRF token to fetch headers
 * Usage: fetch(url, getCsrfHeaders(csrfToken, { method: 'POST', ... }))
 */
export function getCsrfHeaders(csrfToken: string, options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      'x-csrf-token': csrfToken,
    },
  };
}
