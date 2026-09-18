"use client";

import Link from "next/link";
import { useRef, useCallback } from "react";
import { useAuth, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

// =======================================================================
// SafeCity Delhi NCR — TopAppBar (Phase 3)
// Displays branding + Clerk auth buttons (SignIn / SignUp / UserButton).
// Phase 4 will add the quick search and filter chips below this bar.
// =======================================================================

interface TopAppBarProps {
  /** Optional callback for the triple-tap stealth disguise trigger (Phase 7). */
  onLogoBrandTripleTap?: () => void;
}

export default function TopAppBar({ onLogoBrandTripleTap }: TopAppBarProps) {
  const { isSignedIn } = useAuth();

  // Triple-tap detection: three taps within 500 ms triggers stealth mode
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoBrandTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      onLogoBrandTripleTap?.();
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 500);
  }, [onLogoBrandTripleTap]);

  return (
    <header
      id="safecity-top-bar"
      role="banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: "60px",
        backgroundColor: "rgba(10, 13, 20, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "0 2px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* ── Brand Logo (triple-tap triggers stealth mode) ── */}
      <button
        id="safecity-logo-btn"
        aria-label="SafeCity Delhi NCR — Triple-tap to activate stealth mode"
        onClick={handleLogoBrandTap}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Shield icon */}
        <div
          aria-hidden="true"
          style={{
            width: "34px",
            height: "34px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            boxShadow: "0 0 12px rgba(16, 185, 129, 0.35)",
            flexShrink: 0,
          }}
        >
          🛡️
        </div>

        {/* Brand text */}
        <span
          style={{
            fontSize: "17px",
            fontWeight: "800",
            color: "#f1f5f9",
            letterSpacing: "-0.3px",
            lineHeight: 1,
          }}
        >
          Safe<span style={{ color: "#10b981" }}>City</span>
        </span>

        {/* Delhi NCR badge */}
        <span
          style={{
            fontSize: "10px",
            fontWeight: "600",
            color: "#64748b",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            padding: "3px 7px",
            borderRadius: "6px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Delhi NCR
        </span>
      </button>

      {/* ── Right side: Auth buttons ── */}
      <nav
        id="safecity-auth-nav"
        aria-label="Authentication navigation"
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        {/* ── Signed OUT: Show Sign In + Sign Up ── */}
        {isSignedIn === false && (
          <>
            <SignInButton mode="modal">
              <button
                id="safecity-signin-btn"
                aria-label="Sign in to SafeCity"
                style={{
                  padding: "8px 14px",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  color: "#94a3b8",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.2px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(16, 185, 129, 0.4)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#10b981";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255, 255, 255, 0.12)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                }}
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                id="safecity-signup-btn"
                aria-label="Create a SafeCity account"
                style={{
                  padding: "8px 14px",
                  backgroundColor: "#10b981",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 0 12px rgba(16, 185, 129, 0.25)",
                  letterSpacing: "0.2px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#059669";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 16px rgba(16, 185, 129, 0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#10b981";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 12px rgba(16, 185, 129, 0.25)";
                }}
              >
                Join Anonymously
              </button>
            </SignUpButton>
          </>
        )}

        {/* ── Signed IN: Show directory link + UserButton ── */}
        {isSignedIn === true && (
          <>
            <Link
              href="/directory"
              id="safecity-directory-link"
              aria-label="View emergency directory"
              style={{
                padding: "8px 12px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                color: "#94a3b8",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span aria-hidden="true">📞</span> Helplines
            </Link>

            {/* Clerk UserButton — shows avatar, account management, sign out */}
            <UserButton
              appearance={{
                variables: {
                  colorPrimary: "#10b981",
                  colorBackground: "#141923",
                  colorText: "#f1f5f9",
                  colorTextSecondary: "#94a3b8",
                  borderRadius: "10px",
                  fontFamily: "Inter, system-ui, sans-serif",
                },
                elements: {
                  avatarBox: {
                    width: "36px",
                    height: "36px",
                    border: "2px solid rgba(16, 185, 129, 0.4)",
                    borderRadius: "10px",
                  },
                  userButtonPopoverCard: {
                    backgroundColor: "#141923",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
                  },
                  userButtonPopoverActionButton: { color: "#f1f5f9" },
                  userButtonPopoverActionButtonText: { color: "#94a3b8" },
                },
              }}
            />
          </>
        )}
      </nav>
    </header>
  );
}
