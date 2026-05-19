// v1.2.0
// Root layout for the OpsFluency app. Loads brand fonts, injects the
// pre-paint theme script so dark mode applies before React hydrates,
// wires Clerk, and renders the global skip link required for WCAG.

import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";

import { themeScript } from "@/components/theme/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsFluency: Frontline Knowledge for Multilingual Teams",
  description:
    "Bilingual SOP publishing, QR-triggered learning, and departmental communication for warehouse and manufacturing facilities.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14B8A6",
};

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${chakraPetch.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <ClerkProvider>
        <body className="min-h-screen flex flex-col antialiased bg-dc-bg text-dc-text">
          <a href="#main" className="skip-link">
            Skip to main content
          </a>
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
