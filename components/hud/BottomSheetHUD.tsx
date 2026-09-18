"use client";

/**
 * BottomSheetHUD
 * An expandable bottom-sheet drawer that shows the nearest safe infrastructure
 * and key emergency action buttons. Surfaces the most critical information
 * within thumb reach at all times.
 */

import { useState } from "react";
import Link from "next/link";
import { SafetyPlace, PLACE_CATEGORY_META } from "@/types/place";
import { formatDistance } from "@/lib/haversine";

interface BottomSheetHUDProps {
  /** The active spotlight: a user-selected place or the auto-nearest place */
  place: SafetyPlace;
  /** True when the user selected this place manually (vs. auto-nearest) */
  isUserSelected: boolean;
  /** Called when the user wants to dismiss / close the HUD */
  onDismiss: () => void;
  /** Called when the "Drop Safety Note" button is pressed */
  onDropNote: () => void;
}

export default function BottomSheetHUD({
  place,
  isUserSelected,
  onDismiss,
  onDropNote,
}: BottomSheetHUDProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const meta = PLACE_CATEGORY_META[place.category] ?? {
    label: "Safe Spot",
    color: "#10b981",
    icon: "📍",
  };

  const accentColor = meta.color;
  const accentAlpha20 = `${accentColor}20`;
  const accentAlpha50 = `${accentColor}50`;
  const accentAlpha40 = `${accentColor}40`;
  const mapsDirectionUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

  return (
    <aside
      id="safecity-bottom-sheet-hud"
      aria-label="Nearest Safe Infrastructure Panel"
      aria-expanded={!isCollapsed}
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        maxWidth: "500px",
        margin: "0 auto",
        zIndex: 900,
        backgroundColor: "rgba(14, 18, 28, 0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${accentAlpha50}`,
        borderRadius: "20px",
        padding: isCollapsed ? "12px 16px" : "16px 20px 18px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.75), 0 0 24px ${accentAlpha20}`,
        transition: "all 0.25s cubic-bezier(0.33, 1, 0.68, 1)",
      }}
    >
      {/* ── Header row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isCollapsed ? 0 : "10px",
          cursor: "pointer",
        }}
        onClick={() => setIsCollapsed((c) => !c)}
        role="button"
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand safe spot details" : "Collapse safe spot details"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsCollapsed((c) => !c);
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Category badge */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: "800",
              color: accentColor,
              backgroundColor: accentAlpha20,
              border: `1px solid ${accentAlpha50}`,
              padding: "3px 9px",
              borderRadius: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {isUserSelected ? "Selected Place" : "Nearest Safe Haven"}
          </span>

          {/* Distance pill */}
          {typeof place.distanceKm === "number" && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              📍 {formatDistance(place.distanceKm)}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Dismiss (×) — only when user selected manually */}
          {isUserSelected && (
            <button
              aria-label="Dismiss selected place"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#475569",
                fontSize: "16px",
                cursor: "pointer",
                padding: "2px 6px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
          {/* Collapse / expand toggle */}
          <button
            aria-label={isCollapsed ? "Expand HUD" : "Collapse HUD"}
            style={{
              background: "none",
              border: "none",
              color: "#475569",
              fontSize: "13px",
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            {isCollapsed ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* ── Place name & address ── */}
      <div
        style={{
          display: isCollapsed ? "flex" : "block",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <h2
          style={{
            fontSize: isCollapsed ? "14px" : "17px",
            fontWeight: "800",
            color: "#f1f5f9",
            lineHeight: 1.2,
            margin: 0,
            letterSpacing: "-0.2px",
          }}
        >
          {place.name}
        </h2>

        {!isCollapsed && place.address && (
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
              marginBottom: 0,
              lineHeight: 1.4,
            }}
          >
            {place.landmark && (
              <span style={{ color: "#94a3b8", fontWeight: "600" }}>
                {place.landmark} ·{" "}
              </span>
            )}
            {place.address}
          </p>
        )}
      </div>

      {/* ── Action Buttons ── */}
      {!isCollapsed && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: place.contactNumber ? "1fr 1fr" : "1fr",
            gap: "10px",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Direct call button */}
          {place.contactNumber && (
            <a
              href={`tel:${place.contactNumber}`}
              id="safecity-hud-call-btn"
              aria-label={`Call ${place.name} at ${place.contactNumber}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                backgroundColor: accentColor,
                color: "#fff",
                borderRadius: "12px",
                fontWeight: "800",
                fontSize: "13px",
                textDecoration: "none",
                boxShadow: `0 0 16px ${accentAlpha40}`,
                transition: "transform 0.12s ease",
              }}
            >
              <span aria-hidden="true">📞</span>
              Call ({place.contactNumber})
            </a>
          )}

          {/* Navigation button */}
          <a
            href={mapsDirectionUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="safecity-hud-directions-btn"
            aria-label="Get turn-by-turn directions"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "12px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#f1f5f9",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "13px",
              textDecoration: "none",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "rgba(255, 255, 255, 0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "rgba(255, 255, 255, 0.07)";
            }}
          >
            <span aria-hidden="true">↗</span> Directions
          </a>
        </div>
      )}

      {/* ── Footer: Drop Note + Helplines link + SOS ── */}
      {!isCollapsed && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            fontSize: "11px",
            gap: "8px",
          }}
        >
          <button
            id="safecity-hud-drop-note-btn"
            aria-label="Drop a safety note at this location"
            onClick={onDropNote}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontWeight: "600",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: 0,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
            }}
          >
            <span aria-hidden="true">📌</span> Drop Safety Note
          </button>

          <Link
            href="/directory"
            id="safecity-directory-footer-link"
            style={{
              color: "#64748b",
              textDecoration: "none",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
            }}
          >
            <span aria-hidden="true">📖</span> Helplines
          </Link>

          <a
            href="tel:112"
            id="safecity-hud-sos-footer"
            style={{
              color: "#ff2d55",
              textDecoration: "none",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "rgba(255, 45, 85, 0.12)",
              border: "1px solid rgba(255, 45, 85, 0.2)",
              padding: "3px 9px",
              borderRadius: "6px",
            }}
          >
            <span aria-hidden="true">🆘</span> SOS 112
          </a>
        </div>
      )}
    </aside>
  );
}
