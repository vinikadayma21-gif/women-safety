import { SignIn } from "@clerk/nextjs";

// =======================================================================
// SafeCity Delhi NCR — Sign-In Page (Phase 3)
// Clerk's <SignIn /> handles phone OTP, Google OAuth, and email magic links.
// Styled to match the OLED dark theme.
// =======================================================================

export default function SignInPage() {
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
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Brand header */}
      <div style={{ textAlign: "center", marginBottom: "32px", position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "28px",
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.35)",
          }}
        >
          🛡️
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "#f1f5f9",
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          Safe<span style={{ color: "#10b981" }}>City</span>
        </h1>
        <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
          Sign in to report hazards &amp; save private notes
        </p>
      </div>

      {/* Clerk SignIn component */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#10b981",
              colorBackground: "#141923",
              colorInputBackground: "#1e2737",
              colorInputText: "#f1f5f9",
              borderRadius: "12px",
              fontFamily: "Inter, system-ui, sans-serif",
            },
            elements: {
              card: {
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 4px 40px rgba(0,0,0,0.6)",
                backgroundColor: "#141923",
              },
              headerTitle: { color: "#f1f5f9" },
              headerSubtitle: { color: "#94a3b8" },
              formButtonPrimary: {
                backgroundColor: "#10b981",
                fontWeight: "700",
              },
              footerActionLink: { color: "#10b981" },
              identityPreviewText: { color: "#f1f5f9" },
            },
          }}
        />
      </div>
    </main>
  );
}
