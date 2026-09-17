/**
 * Safety scoring types for the Women's Safety Index (WSI).
 * Scores range from 0.0 (extreme danger) to 10.0 (maximum safety).
 */

/** Safety tier classification */
export type SafetyTier =
  | "HIGH"    // 8.0 – 10.0 → Emerald green
  | "MEDIUM"  // 5.5 – 7.9  → Amber / yellow
  | "LOW";    // 0.0 – 5.4  → Coral red

/** Time-of-day period for Delhi local time multiplier */
export type TimeOfDay =
  | "DAY"     // 06:00 – 19:00 → multiplier 1.00
  | "EVENING" // 19:00 – 22:30 → multiplier 0.90
  | "NIGHT";  // 22:30 – 05:30 → multiplier 0.75

/** Scoring contribution from a single safety anchor (infrastructure) */
export interface AnchorFactor {
  placeId: string;
  placeName: string;
  category: string;
  distanceKm: number;
  /** Points contributed to the composite score (positive) */
  pointsAdded: number;
}

/** Scoring penalty from an active community hazard note */
export interface HazardFactor {
  noteId: string;
  hazardCategory: string;
  distanceKm: number;
  upvotesCount: number;
  /** Points subtracted from the composite score (negative value) */
  pointsDeducted: number;
}

/**
 * Detailed WSI score breakdown for a geographic coordinate.
 * Returned by the /api/safety-score endpoint.
 */
export interface SafetyScore {
  /** Final clamped score [0.0, 10.0] */
  score: number;
  /** Safety tier derived from score */
  tier: SafetyTier;
  /** User-friendly label: e.g. "8.6 / 10 High Safety" */
  label: string;
  /** Raw anchor score before multiplier [0.0, 6.0] */
  anchorScore: number;
  /** Raw hazard penalty before multiplier [-4.0, 0.0] */
  hazardPenalty: number;
  /** Time-of-day period used */
  timeOfDay: TimeOfDay;
  /** Time multiplier applied (0.75 – 1.0) */
  timeMultiplier: number;
  /** Individual anchor factors that contributed */
  anchors: AnchorFactor[];
  /** Individual hazard factors that contributed */
  hazards: HazardFactor[];
  /** ISO timestamp of when score was calculated */
  calculatedAt: string;
}

/** Display properties derived from a safety score */
export interface SafetyScoreDisplay {
  color: string;       // CSS color value
  glowColor: string;   // CSS rgba for glow effects
  bgClass: string;     // Tailwind/CSS class token
  emoji: string;       // Status emoji for quick visual scan
}

/** Maps a SafetyTier to its display properties */
export const SAFETY_TIER_DISPLAY: Record<SafetyTier, SafetyScoreDisplay> = {
  HIGH: {
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.4)",
    bgClass: "safety-high",
    emoji: "🟢",
  },
  MEDIUM: {
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.4)",
    bgClass: "safety-medium",
    emoji: "🟡",
  },
  LOW: {
    color: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.4)",
    bgClass: "safety-low",
    emoji: "🔴",
  },
};

/** Time-of-day multipliers (mirrors safetyScorer.ts logic) */
export const TIME_MULTIPLIERS: Record<TimeOfDay, number> = {
  DAY: 1.0,
  EVENING: 0.9,
  NIGHT: 0.75,
};

/** Utility: derive SafetyTier from a numeric score */
export function scoreToTier(score: number): SafetyTier {
  if (score >= 8.0) return "HIGH";
  if (score >= 5.5) return "MEDIUM";
  return "LOW";
}
