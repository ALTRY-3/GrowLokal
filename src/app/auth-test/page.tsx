"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function AuthTest() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
  }, [session, status]);

  if (status === "loading") return <p>Loading...</p>;

  if (session) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Signed in as {session.user?.email}</h2>
        <p>User ID: {session.user?.id}</p>
        <p>Name: {session.user?.name}</p>
        <button onClick={() => signOut()}>Sign out</button>
        <br />
        <br />
        <a href="/marketplace">Go to Marketplace</a>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Not signed in</h2>
      <button onClick={() => signIn("google", { callbackUrl: "/marketplace" })}>
        Sign in with Google
      </button>
      <br />
      <br />
      <button onClick={() => signIn("facebook", { callbackUrl: "/marketplace" })}>
        Sign in with Facebook
      </button>
    </div>
  );
}