"use client";

/**
 * QuickActionBar
 * Fixed quick-access row of emergency action buttons:
 * 1. SOS 112 — opens native dialer with a safety confirmation step
 * 2. Share Trip — builds a WhatsApp deep-link sharing current GPS coordinates
 * 3. Add Note — proxy shortcut to open the CreateNote dialog
 */

import { useState, useCallback } from "react";

interface QuickActionBarProps {
  /** Current user GPS latitude (or Delhi default if simulated) */
  latitude: number;
  /** Current user GPS longitude (or Delhi default if simulated) */
  longitude: number;
  /** Called when the "Add Note" button is tapped */
  onAddNote: () => void;
  /** Whether the bar should appear above the bottom HUD card */
  isAboveHud?: boolean;
}

export default function QuickActionBar({
  latitude,
  longitude,
  onAddNote,
  isAboveHud = false,
}: QuickActionBarProps) {
  const [showSosConfirm, setShowSosConfirm] = useState(false);

  // Build WhatsApp trip-sharing link with current coordinates
  const buildWhatsAppShareLink = useCallback(() => {
    const mapsUrl = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const message = encodeURIComponent(
      `🛡️ SafeCity Delhi — I'm sharing my live location with you.\n📍 ${mapsUrl}\n\nPlease check on me if you don't hear from me soon.`
    );
    return `https://wa.me/?text=${message}`;
  }, [latitude, longitude]);

  const handleSosClick = useCallback(() => {
    // Show a brief confirmation step to prevent accidental dials
    setShowSosConfirm(true);
    // Auto-dismiss confirmation after 6 seconds if user doesn't confirm
    setTimeout(() => setShowSosConfirm(false), 6000);
  }, []);

  const handleSosConfirm = useCallback(() => {
    setShowSosConfirm(false);
    window.location.href = "tel:112";
  }, []);

  const bottomOffset = isAboveHud ? "calc(160px + env(safe-area-inset-bottom, 0px))" : "calc(24px + env(safe-area-inset-bottom, 0px))";

  return (
    <>
      {/* ── SOS Confirmation Dialog ── */}
      {showSosConfirm && (
        <div
          id="safecity-sos-confirm-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm SOS call to 112"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(10, 13, 20, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setShowSosConfirm(false)}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #1a0a0a 0%, #200d0d 100%)",
              border: "1px solid rgba(255, 45, 85, 0.35)",
              borderRadius: "24px",
              padding: "32px 28px",
              maxWidth: "320px",
              width: "100%",
              textAlign: "center",
              boxShadow:
                "0 0 60px rgba(255, 45, 85, 0.25), 0 16px 40px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pulsing SOS icon */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 45, 85, 0.15)",
                border: "2px solid rgba(255, 45, 85, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                margin: "0 auto 20px",
                animation: "pulse 1.2s ease-in-out infinite",
              }}
              aria-hidden="true"
            >
              🆘
            </div>

            <h2
              style={{
                fontSize: "22px",
                fontWeight: "900",
                color: "#ff2d55",
                marginBottom: "8px",
                letterSpacing: "-0.3px",
              }}
            >
              Call 112 Now?
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                lineHeight: "1.5",
                marginBottom: "28px",
              }}
            >
              This will open your phone dialer to call the National Emergency
              Number.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href="tel:112"
                id="safecity-sos-confirm-btn"
                onClick={handleSosConfirm}
                style={{
                  display: "block",
                  padding: "15px",
                  backgroundColor: "#ff2d55",
                  color: "#fff",
                  borderRadius: "14px",
                  fontWeight: "900",
                  fontSize: "16px",
                  textDecoration: "none",
                  letterSpacing: "0.3px",
                  boxShadow: "0 4px 20px rgba(255, 45, 85, 0.5)",
                }}
              >
                📞 Call 112 — Emergency
              </a>

              <button
                id="safecity-sos-cancel-btn"
                onClick={() => setShowSosConfirm(false)}
                style={{
                  padding: "13px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "14px",
                  color: "#94a3b8",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Action Bar ── */}
      <div
        id="safecity-quick-action-bar"
        role="toolbar"
        aria-label="Emergency quick actions"
        style={{
          position: "fixed",
          bottom: bottomOffset,
          left: "16px",
          right: "16px",
          maxWidth: "500px",
          margin: "0 auto",
          zIndex: 895,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          transition: "bottom 0.25s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        {/* SOS 112 Button */}
        <button
          id="safecity-sos-btn"
          aria-label="SOS — Call Emergency 112"
          onClick={handleSosClick}
          style={{
            flex: "0 0 auto",
            height: "52px",
            padding: "0 20px",
            backgroundColor: "#ff2d55",
            border: "none",
            borderRadius: "16px",
            color: "#fff",
            fontWeight: "900",
            fontSize: "14px",
            letterSpacing: "0.3px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            boxShadow:
              "0 4px 20px rgba(255, 45, 85, 0.55), 0 0 0 1px rgba(255, 45, 85, 0.3)",
            WebkitTapHighlightColor: "transparent",
            transition: "transform 0.12s ease, box-shadow 0.2s ease",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
          onTouchStart={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
          }}
          onTouchEnd={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          <span style={{ fontSize: "18px" }} aria-hidden="true">🆘</span>
          SOS 112
        </button>

        {/* Share Trip via WhatsApp */}
        <a
          href={buildWhatsAppShareLink()}
          target="_blank"
          rel="noopener noreferrer"
          id="safecity-share-trip-btn"
          aria-label="Share live location via WhatsApp"
          style={{
            flex: 1,
            height: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            backgroundColor: "rgba(37, 211, 102, 0.12)",
            border: "1px solid rgba(37, 211, 102, 0.25)",
            borderRadius: "16px",
            color: "#25d366",
            fontWeight: "700",
            fontSize: "13px",
            textDecoration: "none",
            WebkitTapHighlightColor: "transparent",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              "rgba(37, 211, 102, 0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
              "rgba(37, 211, 102, 0.12)";
          }}
        >
          <span aria-hidden="true" style={{ fontSize: "18px" }}>💬</span>
          Share Trip
        </a>

        {/* Add Note shortcut */}
        <button
          id="safecity-quickbar-add-note-btn"
          aria-label="Add safety note or community alert"
          onClick={onAddNote}
          style={{
            flex: "0 0 52px",
            height: "52px",
            backgroundColor: "rgba(20, 25, 35, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            color: "#f1f5f9",
            fontSize: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            WebkitTapHighlightColor: "transparent",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(30, 36, 52, 0.95)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(20, 25, 35, 0.9)";
          }}
          title="Add Note or Alert"
        >
          📝
        </button>
      </div>
    </>
  );
}
