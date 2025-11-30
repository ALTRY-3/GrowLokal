"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider 
      refetchInterval={0} // Disable automatic session refetching
      refetchOnWindowFocus={false} // Don't refetch on window focus
    >
      {children}
    </SessionProvider>
  );
}