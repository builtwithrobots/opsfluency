import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Chakra_Petch, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsFluency — Frontline Knowledge for Multilingual Teams",
  description:
    "Bilingual SOP publishing, QR-triggered learning, and departmental communication for warehouse and manufacturing facilities.",
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
    >
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
