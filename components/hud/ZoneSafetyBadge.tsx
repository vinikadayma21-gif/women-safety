"use client";

import { useState } from "react";
import { SafetyScore, SAFETY_TIER_DISPLAY } from "@/types/safety";
import { getISTTimeString } from "@/lib/safetyScorer";

interface ZoneSafetyBadgeProps {
  score: SafetyScore | null;
  isLoading?: boolean;
  error?: string | null;
}

const TIME_OF_DAY_META = {
  DAY:     { emoji: "🌅", label: "Daytime", multiplierLabel: "1.0×" },
  EVENING: { emoji: "🌆", label: "Evening",  multiplierLabel: "0.9×" },
  NIGHT:   { emoji: "🌙", label: "Late Night", multiplierLabel: "0.75×" },
};

export default function ZoneSafetyBadge({
  score,
  isLoading = false,
  error = null,
}: ZoneSafetyBadgeProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const tier = score ? SAFETY_TIER_DISPLAY[score.tier] : null;

  // ── Badge (pill floating top-right) ──────────────────────────────────────
  const badge = (
    <button
      id="safecity-safety-badge"
      aria-label={score ? `Safety score: ${score.label}. Tap to see breakdown.` : "Loading safety score"}
      onClick={() => score && setIsDrawerOpen(true)}
      style={{
        position: "fixed",
        top: "116px",
        right: "16px",
        zIndex: 820,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        backgroundColor: "rgba(20, 25, 35, 0.92)",
        border: `1.5px solid ${tier ? tier.color + "60" : "rgba(255,255,255,0.12)"}`,
        borderRadius: "22px",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: tier
          ? `0 4px 20px rgba(0,0,0,0.5), 0 0 14px ${tier.glowColor}`
          : "0 4px 12px rgba(0,0,0,0.4)",
        cursor: score ? "pointer" : "default",
        transition: "all 0.2s ease",
        minWidth: "110px",
        justifyContent: "center",
      }}
    >
      {/* Animated loading shimmer */}
      {isLoading && !score && (
        <>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#64748b",
              animation: "pulse-dot 1.4s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
            Scoring zone…
          </span>
        </>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <>
          <span style={{ fontSize: "12px" }}>⚠️</span>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8" }}>
            Score unavailable
          </span>
        </>
      )}

      {/* Score pill */}
      {score && tier && (
        <>
          {/* Pulsing tier dot */}
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: tier.color,
              boxShadow: `0 0 6px ${tier.color}`,
              flexShrink: 0,
              animation: "pulse-dot 2.5s ease-in-out infinite",
            }}
          />
          {/* Score text */}
          <span
            style={{
              fontSize: "13px",
              fontWeight: "800",
              color: tier.color,
              letterSpacing: "-0.3px",
            }}
          >
            {score.score.toFixed(1)}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "500",
              color: "#94a3b8",
            }}
          >
            / 10
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: tier.color,
              opacity: 0.9,
            }}
          >
            {tier.emoji}
          </span>
        </>
      )}
    </button>
  );

  // ── Breakdown Drawer (bottom sheet) ──────────────────────────────────────
  const drawer = score && isDrawerOpen && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Safety Score Breakdown"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 950,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Scrim */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#141923",
          borderRadius: "24px 24px 0 0",
          padding: "0 0 32px 0",
          maxHeight: "80dvh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0, 0, 0, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "12px", paddingBottom: "4px" }}>
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.18)",
            }}
          />
        </div>

        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  color: tier!.color,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {score.score.toFixed(1)}
              </span>
              <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "600" }}>
                / 10
              </span>
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                fontWeight: "700",
                color: tier!.color,
              }}
            >
              {tier!.emoji}{" "}
              {score.tier === "HIGH"
                ? "High Safety Zone"
                : score.tier === "MEDIUM"
                ? "Moderate Safety Zone"
                : "Low Safety Zone"}
            </p>
          </div>

          <button
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close safety breakdown"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              color: "#94a3b8",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Score composition bar ── */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
            Score Composition
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            <CompositionCard
              label="Infrastructure"
              value={`+${score.anchorScore.toFixed(1)}`}
              sub="anchor pts"
              color="#10b981"
            />
            <CompositionCard
              label="Hazard"
              value={score.hazardPenalty === 0 ? "±0.0" : score.hazardPenalty.toFixed(1)}
              sub="community pts"
              color={score.hazardPenalty < 0 ? "#ef4444" : "#64748b"}
            />
            <CompositionCard
              label={TIME_OF_DAY_META[score.timeOfDay].emoji + " " + TIME_OF_DAY_META[score.timeOfDay].label}
              value={`×${score.timeMultiplier.toFixed(2)}`}
              sub="time factor"
              color="#6366f1"
            />
          </div>
        </div>

        {/* ── Time of day ── */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
            Time Context
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>{TIME_OF_DAY_META[score.timeOfDay].emoji}</span>
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#f1f5f9" }}>
                  {TIME_OF_DAY_META[score.timeOfDay].label}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                  Delhi IST — multiplier {TIME_OF_DAY_META[score.timeOfDay].multiplierLabel}
                </p>
              </div>
            </div>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#6366f1", backgroundColor: "rgba(99,102,241,0.12)", padding: "4px 10px", borderRadius: "8px" }}>
              {getISTTimeString(new Date(score.calculatedAt))}
            </span>
          </div>
        </div>

        {/* ── Anchor factors ── */}
        {score.anchors.length > 0 && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
              Safety Anchors Nearby ({score.anchors.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {score.anchors.slice(0, 6).map((anchor) => (
                <div
                  key={anchor.placeId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "rgba(16, 185, 129, 0.06)",
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#e2e8f0" }}>
                      {anchor.placeName}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                      {anchor.category.replace(/_/g, " ")} · {(anchor.distanceKm * 1000).toFixed(0)}m away
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: "#10b981",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    +{anchor.pointsAdded.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Hazard factors ── */}
        {score.hazards.length > 0 && (
          <div style={{ padding: "14px 20px" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
              Active Hazard Reports ({score.hazards.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {score.hazards.map((hazard) => (
                <div
                  key={hazard.noteId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "rgba(239, 68, 68, 0.06)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#e2e8f0" }}>
                      {hazard.hazardCategory.replace(/_/g, " ")}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                      {(hazard.distanceKm * 1000).toFixed(0)}m · {hazard.upvotesCount} confirmed
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "800",
                      color: "#ef4444",
                      backgroundColor: "rgba(239, 68, 68, 0.12)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {hazard.pointsDeducted.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state: no anchors or hazards */}
        {score.anchors.length === 0 && score.hazards.length === 0 && (
          <div style={{ padding: "24px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "32px" }}>📍</span>
            <p style={{ margin: "8px 0 4px", fontSize: "14px", fontWeight: "700", color: "#94a3b8" }}>
              No nearby infrastructure data
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
              Move closer to a Pink Booth, Police Station, or Metro Station.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {badge}
      {drawer}
    </>
  );
}

// ── Sub-component: score composition stat card ────────────────────────────
function CompositionCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: "12px",
        padding: "10px 12px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: "0 0 4px",
          fontSize: "18px",
          fontWeight: "900",
          color,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </p>
      <p style={{ margin: 0, fontSize: "10px", color: "#64748b", fontWeight: "600" }}>
        {sub}
      </p>
      <p style={{ margin: "3px 0 0", fontSize: "9px", color: "#475569", fontWeight: "500" }}>
        {label}
      </p>
    </div>
  );
}
