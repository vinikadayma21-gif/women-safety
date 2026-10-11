"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { SafetyScore, SAFETY_TIER_DISPLAY } from "@/types/safety";
import ScoreBreakdownDrawer from "./ScoreBreakdownDrawer";

// =======================================================================
// components/hud/ZoneSafetyBadge.tsx — Phase 6 (PLANv2)
//
// Floating pill badge in the top-right corner that displays the live WSI score.
// Tapping the badge opens the ScoreBreakdownDrawer for detailed multi-factor
// breakdown (anchors, lighting, CCTV, hazards, weather, time).
// =======================================================================

interface ZoneSafetyBadgeProps {
  score: SafetyScore | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function ZoneSafetyBadge({
  score,
  isLoading = false,
  error = null,
}: ZoneSafetyBadgeProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const tier = score ? SAFETY_TIER_DISPLAY[score.tier] : null;

  return (
    <>
      {/* ── Floating Badge Pill ──────────────────────────────────────── */}
      <button
        id="safecity-safety-badge"
        aria-label={
          score
            ? `Safety score: ${score.label}. Tap to see detailed breakdown.`
            : "Loading safety score"
        }
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
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
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
            <AlertTriangle size={12} color="#f59e0b" />
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
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.9,
              }}
            >
              {score.tier === "HIGH" && <ShieldCheck size={13} color={tier.color} />}
              {score.tier === "MEDIUM" && <AlertTriangle size={13} color={tier.color} />}
              {score.tier === "LOW" && <ShieldAlert size={13} color={tier.color} />}
            </span>
          </>
        )}
      </button>

      {/* ── Slide-up Score Breakdown Drawer (Phase 6) ────────────────── */}
      <ScoreBreakdownDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        score={score}
      />
    </>
  );
}
