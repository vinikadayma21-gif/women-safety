import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SafeCity Delhi NCR — Women's Safety Map",
  description:
    "Real-time interactive women's safety map for Delhi NCR. Locate Pink Booths, Police Stations, Metro Stations, and 24/7 Hospitals instantly. One-tap SOS 112. Works offline.",
  keywords: [
    "women safety Delhi",
    "Pink Booth Delhi",
    "women helpline Delhi NCR",
    "safe places Delhi",
    "112 emergency India",
    "SafeCity",
    "Delhi police women helpline",
  ],
  authors: [{ name: "SafeCity Delhi NCR" }],
  creator: "SafeCity Delhi NCR",
  applicationName: "SafeCity Delhi NCR",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SafeCity",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: "website",
    siteName: "SafeCity Delhi NCR",
    title: "SafeCity Delhi NCR — Women's Safety Map",
    description:
      "Real-time women's safety map. Locate Pink Booths, Police Stations, and 24/7 safe places in Delhi NCR.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "SafeCity Delhi NCR — Women's Safety Map",
    description: "Real-time women's safety map for Delhi NCR. Find safe spots, call for help.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
  colorScheme: "dark",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en-IN" className={`${inter.variable} dark`} style={{ colorScheme: "dark" }}>
      <head>
        {/* PWA Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        {/* Preconnect for CartoDB Dark Matter tiles */}
        <link rel="preconnect" href="https://a.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://b.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://c.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://d.basemaps.cartocdn.com" />
        {/* Preconnect for Google Fonts (Inter) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        style={{
          fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)",
          backgroundColor: "#0a0d14",
          color: "#f1f5f9",
          minHeight: "100dvh",
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
