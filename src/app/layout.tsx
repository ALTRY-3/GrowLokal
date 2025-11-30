import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import Chatbot from "@/components/Chatbot";
import AuthProvider from "@/components/AuthProvider";
import RecaptchaProvider from "@/components/RecaptchaProvider";
import RecaptchaDebug from "@/components/RecaptchaDebug";
import PageIdentifier from "@/components/PageIdentifier";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GrowLokal",
  description:
    "A community marketplace for Olongapo’s artisans and entrepreneurs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* FontAwesome for icons */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={poppins.className}>
        <AuthProvider>
          <RecaptchaProvider>
            <PageIdentifier />
            <RecaptchaDebug />
            {children}
            {/* Chatbot stays on all pages */}
            <Chatbot />
          </RecaptchaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
