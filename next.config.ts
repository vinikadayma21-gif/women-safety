import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Next.js 16 uses Turbopack by default.
  // Leaflet's browser-only dependencies (window, navigator) are handled via
  // dynamic imports with { ssr: false } in the component layer — no custom
  // bundler config is needed here.
  turbopack: {},

  // HTTP security & PWA-friendly headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Legacy XSS filter
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict geolocation to self only (PWA requirement)
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()",
          },
        ],
      },
      {
        // Short cache for nearby-places API (real-time data)
        source: "/api/places/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
