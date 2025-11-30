"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SimpleAuthTest() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("User authenticated, redirecting to marketplace...");
      router.push("/marketplace");
    }
  }, [status, session, router]);

  const handleGoogleSignIn = () => {
    signIn("google", { 
      callbackUrl: "/marketplace",
      redirect: false 
    }).then((result) => {
      console.log("SignIn result:", result);
      if (result?.ok) {
        router.push("/marketplace");
      }
    });
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "authenticated") {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Authenticated! Redirecting to marketplace...</h2>
        <p>Email: {session?.user?.email}</p>
        <button onClick={() => router.push("/marketplace")}>
          Go to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Simple Auth Test</h1>
      <button 
        onClick={handleGoogleSignIn}
        style={{ 
          padding: "10px 20px", 
          fontSize: "16px", 
          backgroundColor: "#4285f4", 
          color: "white", 
          border: "none", 
          borderRadius: "4px" 
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}