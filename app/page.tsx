import Link from "next/link";

/**
 * SafeCity Delhi NCR — Landing / Splash Page (Phase 1 Shell)
 * This will be replaced in Phase 4 with the full interactive Leaflet map.
 * For now it serves as a functional dark-mode PWA shell with branding.
 */
export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "#0a0d14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(236, 72, 153, 0.04) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          backgroundColor: "rgba(20, 25, 35, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          padding: "48px 40px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          backdropFilter: "blur(16px)",
          boxShadow: "0 4px 40px rgba(0, 0, 0, 0.6)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Shield icon */}
        <div
          style={{
            width: "72px",
            height: "72px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "36px",
            boxShadow: "0 0 24px rgba(16, 185, 129, 0.4)",
          }}
        >
          🛡️
        </div>

        {/* Brand name */}
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "800",
            color: "#f1f5f9",
            marginBottom: "8px",
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}
        >
          Safe
          <span style={{ color: "#10b981" }}>City</span>
        </h1>
        <p
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "20px",
          }}
        >
          Delhi NCR
        </p>

        {/* Tagline */}
        <p
          style={{
            fontSize: "16px",
            color: "#94a3b8",
            lineHeight: "1.7",
            marginBottom: "32px",
          }}
        >
          Real-time women&apos;s safety map for Delhi NCR. Locate{" "}
          <span style={{ color: "#ec4899", fontWeight: "600" }}>Pink Booths</span>,{" "}
          <span style={{ color: "#6366f1", fontWeight: "600" }}>Police Stations</span>,{" "}
          <span style={{ color: "#10b981", fontWeight: "600" }}>Metro Stations</span>, and{" "}
          <span style={{ color: "#ef4444", fontWeight: "600" }}>24/7 Hospitals</span> — instantly.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link
            href="/directory"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px 24px",
              backgroundColor: "#10b981",
              color: "#fff",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "15px",
              textDecoration: "none",
              transition: "all 0.2s ease",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
            }}
          >
            <span>📞</span> Emergency Helplines
          </Link>

          <a
            href="tel:112"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px 24px",
              backgroundColor: "#ff2d55",
              color: "#fff",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "15px",
              textDecoration: "none",
              transition: "all 0.2s ease",
              boxShadow: "0 0 20px rgba(255, 45, 85, 0.35)",
              letterSpacing: "0.5px",
            }}
          >
            <span>🆘</span> SOS — Call 112
          </a>
        </div>

        {/* Safety stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {[
            { emoji: "🟣", label: "Pink Booths", count: "200+" },
            { emoji: "🚇", label: "Metro Stations", count: "256+" },
            { emoji: "🏥", label: "Hospitals 24/7", count: "50+" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", marginBottom: "4px" }}>{stat.emoji}</div>
              <div
                style={{ fontSize: "18px", fontWeight: "700", color: "#f1f5f9", lineHeight: 1 }}
              >
                {stat.count}
              </div>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p
        style={{
          marginTop: "24px",
          fontSize: "12px",
          color: "#475569",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        🔒 Your location is never stored. Zero-knowledge privacy by design.
      </p>
    </main>
  );
}
