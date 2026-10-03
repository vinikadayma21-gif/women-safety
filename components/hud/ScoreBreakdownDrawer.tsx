"use client";

import { useEffect } from "react";
import {
  Landmark,
  Lightbulb,
  Camera,
  AlertTriangle,
  Sun,
  Sunset,
  Moon,
  CloudRain,
  CloudSun,
  HelpCircle,
  Siren,
  HeartHandshake,
  TrainFront,
  Hospital,
  Store,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import { SafetyScore, SAFETY_TIER_DISPLAY } from "@/types/safety";
import { getISTTimeString } from "@/lib/safetyScorer";

// =======================================================================
// components/hud/ScoreBreakdownDrawer.tsx — Phase 6 (PLANv2)
//
// Slide-up drawer displaying the comprehensive WSI 2.0 scoring breakdown:
//   - Final score & safety tier
//   - Scoring formula summary
//   - Infrastructure anchors (police, hospital, metro, safe store)
//   - Street lighting score (OSM Overpass)
//   - CCTV surveillance score (OSM Overpass)
//   - Community hazard penalties
//   - Weather multiplier (OpenWeatherMap)
//   - Time-of-day multiplier (Delhi IST)
// =======================================================================

interface ScoreBreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  score: SafetyScore | null;
}

const TIME_OF_DAY_META = {
  DAY:     { icon: Sun,    label: "Daytime",    multiplierLabel: "1.0×" },
  EVENING: { icon: Sunset, label: "Evening",    multiplierLabel: "0.9×" },
  NIGHT:   { icon: Moon,   label: "Late Night", multiplierLabel: "0.75×" },
};

export default function ScoreBreakdownDrawer({
  isOpen,
  onClose,
  score,
}: ScoreBreakdownDrawerProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !score) return null;

  const tier = SAFETY_TIER_DISPLAY[score.tier];
  const lightingScore = score.lightingScore ?? 0;
  const lightingCount = score.lightingCount ?? 0;
  const cctvScore = score.cctvScore ?? 0;
  const cctvCount = score.cctvCount ?? 0;
  const weatherCond = score.weatherCondition ?? "Normal";
  const weatherMult = score.weatherMultiplier ?? 1.0;

  // Filter out any synthetic anchors from the display list if present
  const displayAnchors = score.anchors.filter(
    (a) => a.placeId !== "osm-lighting" && a.placeId !== "osm-cctv"
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Women's Safety Index 2.0 Score Breakdown"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 960,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {/* Backdrop Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          cursor: "pointer",
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "relative",
          backgroundColor: "rgba(18, 24, 38, 0.98)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: `0 -12px 48px rgba(0, 0, 0, 0.85), 0 0 32px ${tier.glowColor}`,
          border: `1px solid ${tier.color}35`,
          borderBottom: "none",
        }}
      >
        {/* Drag Handle Bar */}
        <div
          onClick={onClose}
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "12px",
            paddingBottom: "6px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.22)",
            }}
          />
        </div>

        {/* ── Top Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 24px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                style={{
                  fontSize: "40px",
                  fontWeight: "900",
                  color: tier.color,
                  letterSpacing: "-1.5px",
                  lineHeight: 1,
                  textShadow: `0 0 20px ${tier.color}60`,
                }}
              >
                {score.score.toFixed(1)}
              </span>
              <span style={{ fontSize: "18px", color: "#64748b", fontWeight: "700" }}>
                / 10
              </span>
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "12px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  backgroundColor: `${tier.color}20`,
                  color: tier.color,
                  border: `1px solid ${tier.color}50`,
                }}
              >
                {tier.emoji} {score.tier} SAFETY
              </span>
            </div>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#94a3b8",
                fontWeight: "500",
              }}
            >
              Women&apos;s Safety Index (WSI 2.0) · Evaluated live for this zone
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close safety score breakdown"
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
              transition: "background 0.15s ease",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div
          style={{
            overflowY: "auto",
            padding: "20px 24px 36px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* 1. Multi-factor Metrics Grid */}
          <div>
            <h3
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                margin: "0 0 10px 0",
              }}
            >
              Scoring Factors Breakdown
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "10px",
              }}
            >
              {/* Infrastructure Anchor Contribution */}
              <MetricBox
                icon={<Landmark size={16} color="#10b981" />}
                label="Infrastructure"
                value={`+${score.anchorScore.toFixed(1)}`}
                sub={`${displayAnchors.length} anchors in 2km`}
                color="#10b981"
              />

              {/* Street Lighting (OSM) */}
              <MetricBox
                icon={<Lightbulb size={16} color={lightingScore > 0 ? "#f59e0b" : "#64748b"} />}
                label="Street Lighting"
                value={lightingScore > 0 ? `+${lightingScore.toFixed(1)}` : "0.0"}
                sub={lightingCount > 0 ? `${lightingCount} OSM lamps` : "No lamp data"}
                color={lightingScore > 0 ? "#f59e0b" : "#64748b"}
              />

              {/* CCTV Surveillance (OSM) */}
              <MetricBox
                icon={<Camera size={16} color={cctvScore > 0 ? "#06b6d4" : "#64748b"} />}
                label="CCTV Coverage"
                value={cctvScore > 0 ? `+${cctvScore.toFixed(2)}` : "0.0"}
                sub={cctvCount > 0 ? `${cctvCount} cameras` : "No camera data"}
                color={cctvScore > 0 ? "#06b6d4" : "#64748b"}
              />

              {/* Community Hazards */}
              <MetricBox
                icon={<AlertTriangle size={16} color={score.hazardPenalty < 0 ? "#ef4444" : "#10b981"} />}
                label="Active Hazards"
                value={score.hazardPenalty === 0 ? "±0.0" : score.hazardPenalty.toFixed(1)}
                sub={`${score.hazards.length} reported`}
                color={score.hazardPenalty < 0 ? "#ef4444" : "#10b981"}
              />

              {/* Time of Day Multiplier */}
              {(() => {
                const TimeIcon = TIME_OF_DAY_META[score.timeOfDay].icon;
                return (
                  <MetricBox
                    icon={<TimeIcon size={16} color="#818cf8" />}
                    label={TIME_OF_DAY_META[score.timeOfDay].label}
                    value={`×${score.timeMultiplier.toFixed(2)}`}
                    sub={`Delhi IST (${getISTTimeString(new Date(score.calculatedAt))})`}
                    color="#818cf8"
                  />
                );
              })()}

              {/* Weather Impact */}
              <MetricBox
                icon={
                  score.weatherIcon ? (
                    <CloudRain size={16} color="#38bdf8" />
                  ) : (
                    <CloudSun size={16} color="#38bdf8" />
                  )
                }
                label={`Weather: ${weatherCond}`}
                value={`×${weatherMult.toFixed(2)}`}
                sub={weatherMult < 1.0 ? "Reduced visibility penalty" : "Optimal conditions"}
                color={weatherMult < 1.0 ? "#f59e0b" : "#38bdf8"}
              />
            </div>
          </div>

          {/* 2. Formula Explanation Banner */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "14px",
              fontSize: "12px",
              color: "#94a3b8",
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "#f1f5f9", marginBottom: "4px" }}>
              <HelpCircle size={15} color="#10b981" />
              How SafeCity Computes This Score:
            </div>
            Base score is determined by nearest police stations, 24/7 hospitals, metro stations,
            street lights, and verified stores, minus penalties for commuter-reported hazard spots.
            The total is scaled by local <strong>time of day</strong> (night damping) and live <strong>weather</strong>.
          </div>

          {/* 3. Nearby Safety Anchors List */}
          {displayAnchors.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <h3
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    margin: 0,
                  }}
                >
                  Nearby Safety Anchors ({displayAnchors.length})
                </h3>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "700" }}>
                  Max 7.5 pts
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {displayAnchors.slice(0, 8).map((anchor) => {
                  const getAnchorIcon = (cat: string) => {
                    switch (cat) {
                      case "POLICE_STATION":
                        return <Siren size={18} color="#6366f1" />;
                      case "PINK_BOOTH":
                        return <HeartHandshake size={18} color="#ec4899" />;
                      case "METRO_STATION":
                        return <TrainFront size={18} color="#10b981" />;
                      case "HOSPITAL_247":
                        return <Hospital size={18} color="#ef4444" />;
                      case "SAFE_HAVEN_STORE":
                        return <Store size={18} color="#f59e0b" />;
                      default:
                        return <MapPin size={18} color="#10b981" />;
                    }
                  };

                  return (
                    <div
                      key={anchor.placeId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "rgba(16, 185, 129, 0.05)",
                        border: "1px solid rgba(16, 185, 129, 0.15)",
                        borderRadius: "12px",
                        padding: "10px 14px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            flexShrink: 0,
                          }}
                        >
                          {getAnchorIcon(anchor.category)}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              fontWeight: "700",
                              color: "#f1f5f9",
                            }}
                          >
                            {anchor.placeName}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                            {anchor.category.replace(/_/g, " ")} ·{" "}
                            {anchor.distanceKm < 1
                              ? `${Math.round(anchor.distanceKm * 1000)} m`
                              : `${anchor.distanceKm.toFixed(2)} km`}{" "}
                            away
                          </p>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "800",
                          color: "#10b981",
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          flexShrink: 0,
                        }}
                      >
                        +{anchor.pointsAdded.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Active Hazard Reports */}
          {score.hazards.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <h3
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    margin: 0,
                  }}
                >
                  Active Community Hazards ({score.hazards.length})
                </h3>
                <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "700" }}>
                  Penalties Deducted
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {score.hazards.map((hazard) => (
                  <div
                    key={hazard.noteId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "rgba(239, 68, 68, 0.05)",
                      border: "1px solid rgba(239, 68, 68, 0.18)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                          flexShrink: 0,
                        }}
                      >
                        <AlertTriangle size={18} color="#ef4444" />
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "#f1f5f9",
                          }}
                        >
                          {hazard.hazardCategory.replace(/_/g, " ")}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                          {Math.round(hazard.distanceKm * 1000)} m away ·{" "}
                          {hazard.upvotesCount} community upvotes
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        color: "#ef4444",
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        flexShrink: 0,
                      }}
                    >
                      {hazard.pointsDeducted.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no anchors and no hazards */}
          {displayAnchors.length === 0 && score.hazards.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "12px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  marginBottom: "8px",
                }}
              >
                <ShieldCheck size={32} color="#64748b" />
              </div>
              <p
                style={{
                  margin: "8px 0 4px",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#94a3b8",
                }}
              >
                Sparse Infrastructure Zone
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                No active police booths, metro stations, or hazard reports within immediate radius.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Compact Metric Card ───────────────────────────────────────────────────
function MetricBox({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: `1px solid ${color}35`,
        borderRadius: "14px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
        <span
          style={{
            fontSize: "15px",
            fontWeight: "900",
            color,
            letterSpacing: "-0.3px",
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ fontSize: "11px", fontWeight: "700", color: "#f1f5f9", marginTop: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "500" }}>
        {sub}
      </div>
    </div>
  );
}
