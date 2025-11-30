"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function useSessionPersistence() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Store session info in localStorage for persistence across browser sessions
    if (session?.user) {
      localStorage.setItem('growlokal_user', JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        timestamp: Date.now(),
      }));
    }
  }, [session]);

  useEffect(() => {
    // Clean up expired local storage data (older than 30 days)
    const storedUser = localStorage.getItem('growlokal_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        if (Date.now() - userData.timestamp > thirtyDays) {
          localStorage.removeItem('growlokal_user');
        }
      } catch (error) {
        // Remove corrupted data
        localStorage.removeItem('growlokal_user');
      }
    }
  }, []);

  return { session, status };
}

export default useSessionPersistence;