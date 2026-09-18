/**
 * safetyScorer.ts — Women's Safety Index (WSI) Scoring Engine
 *
 * Computes a dynamic safety score (0.0–10.0) for any lat/lng in Delhi NCR.
 *
 * Score formula:
 *   rawScore  = anchorScore + hazardPenalty    (clamped to [0, 10])
 *   finalScore = rawScore × timeMultiplier     (clamped to [0, 10])
 *
 * Components:
 *   anchorScore   — +0 to +7.5 pts from nearby safety infrastructure
 *   hazardPenalty — -0 to -4.0 pts from active community hazard reports
 *   timeMultiplier — 1.0 (day), 0.9 (evening), 0.75 (night)
 */

import { haversineDistance } from "./haversine";
import {
  SafetyScore,
  AnchorFactor,
  HazardFactor,
  TimeOfDay,
  scoreToTier,
} from "@/types/safety";
import { PlaceCategory } from "@/types/place";

// ---------------------------------------------------------------------------
// Anchor scoring configuration per place category
// ---------------------------------------------------------------------------

interface AnchorConfig {
  maxPoints: number;  // Maximum score contribution at distance = 0
  radiusKm: number;   // Distance at which score falls to ~37% (1/e) of max
}

const ANCHOR_CONFIG: Record<PlaceCategory, AnchorConfig> = {
  PINK_BOOTH:       { maxPoints: 2.5, radiusKm: 0.8  }, // Women-specific help point
  POLICE_STATION:   { maxPoints: 2.0, radiusKm: 1.0  }, // Full police station
  METRO_STATION:    { maxPoints: 1.5, radiusKm: 0.6  }, // CCTV, CISF guards, footfall
  HOSPITAL_247:     { maxPoints: 1.0, radiusKm: 1.2  }, // 24/7 presence
  SAFE_HAVEN_STORE: { maxPoints: 0.5, radiusKm: 0.3  }, // Commercial safe spot
};

/** Maximum aggregate anchor score before multiplier */
const MAX_ANCHOR_SCORE = 7.5;

// ---------------------------------------------------------------------------
// Hazard penalty configuration per hazard category
// ---------------------------------------------------------------------------

/** Base penalty (negative) for each hazard category — from schema comments */
const HAZARD_BASE_PENALTY: Record<string, number> = {
  HARASSMENT_SPOT: -3.0,
  DESERTED_AREA:   -2.0,
  POOR_LIGHTING:   -1.5,
  GENERAL_TIP:      0.0,  // Neutral tips do not penalize
  SAFE_ZONE:        0.0,  // SAFE_ZONE notes don't subtract
};

/** Effective radius (km) within which a hazard fully penalizes */
const HAZARD_RADIUS_KM = 0.8;

/** Maximum aggregate hazard penalty */
const MAX_HAZARD_PENALTY = -4.0;

// ---------------------------------------------------------------------------
// Time-of-day helpers (Delhi IST = UTC+05:30)
// ---------------------------------------------------------------------------

/** IST offset in minutes */
const IST_OFFSET_MINUTES = 330; // 5h 30m

/**
 * Derive the current time-of-day period using the Delhi IST clock.
 * Optionally accepts a Date for testing overrides.
 */
export function getTimeOfDay(now: Date = new Date()): TimeOfDay {
  // Convert to IST by offsetting UTC time
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + IST_OFFSET_MINUTES * 60_000;
  const istDate = new Date(istMs);

  const hour = istDate.getHours();
  const minute = istDate.getMinutes();
  const totalMinutes = hour * 60 + minute;

  // DAY:     06:00 → 18:59  (360 – 1139)
  // EVENING: 19:00 → 22:29  (1140 – 1349)
  // NIGHT:   22:30 → 05:59  (1350 – 1439 and 0 – 359)
  if (totalMinutes >= 360 && totalMinutes < 1140) return "DAY";
  if (totalMinutes >= 1140 && totalMinutes < 1350) return "EVENING";
  return "NIGHT";
}

/** IST time string for display (e.g. "21:45 IST") */
export function getISTTimeString(now: Date = new Date()): string {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + IST_OFFSET_MINUTES * 60_000;
  const istDate = new Date(istMs);
  return istDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " IST";
}

const TIME_MULTIPLIER_MAP: Record<TimeOfDay, number> = {
  DAY:     1.00,
  EVENING: 0.90,
  NIGHT:   0.75,
};

// ---------------------------------------------------------------------------
// Anchor scoring
// ---------------------------------------------------------------------------

/** Score input anchor: nearby SafetyPlace with computed Haversine distance */
export interface ScoringAnchor {
  placeId: string;
  placeName: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
}

/** Score input hazard: active community note with vote metadata */
export interface ScoringHazard {
  noteId: string;
  hazardCategory: string;
  latitude: number;
  longitude: number;
  upvotesCount: number;
  downvotesCount: number;
}

/**
 * Compute score contribution from a single safety anchor using
 * exponential proximity falloff: points = maxPoints × e^(-dist / radius).
 */
function scoreAnchor(distanceKm: number, category: PlaceCategory): number {
  const config = ANCHOR_CONFIG[category];
  if (!config) return 0;
  const points = config.maxPoints * Math.exp(-distanceKm / config.radiusKm);
  return Math.max(0, points);
}

/**
 * Compute the penalty from a single active community hazard.
 * Amplified by net upvotes (credibility) and decays beyond HAZARD_RADIUS_KM.
 */
function scoreHazard(
  distanceKm: number,
  hazardCategory: string,
  upvotesCount: number,
  downvotesCount: number
): number {
  if (distanceKm > HAZARD_RADIUS_KM * 2) return 0; // No effect beyond 2× radius

  const basePenalty = HAZARD_BASE_PENALTY[hazardCategory] ?? 0;
  if (basePenalty === 0) return 0;

  // Credibility multiplier: scale 0.5 (no votes) → 1.5 (many verified upvotes)
  const netVotes = upvotesCount - downvotesCount;
  const credibility = Math.min(1.5, 0.5 + netVotes * 0.1);

  // Exponential falloff
  const distanceDecay = Math.exp(-distanceKm / HAZARD_RADIUS_KM);
  const penalty = basePenalty * credibility * distanceDecay;

  return Math.min(0, penalty); // Always non-positive
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

/**
 * Compute the full WSI safety score for a geographic coordinate.
 *
 * @param lat      Target latitude (user's location)
 * @param lng      Target longitude
 * @param anchors  Nearby verified safe places (pre-filtered within ~2km)
 * @param hazards  Active community hazard notes (pre-filtered within ~1.5km)
 * @param now      Override current time for testing
 */
export function computeSafetyScore(
  lat: number,
  lng: number,
  anchors: ScoringAnchor[],
  hazards: ScoringHazard[],
  now: Date = new Date()
): SafetyScore {
  const calculatedAt = now.toISOString();

  // ── 1. Time-of-day multiplier ──────────────────────────────────────────
  const timeOfDay = getTimeOfDay(now);
  const timeMultiplier = TIME_MULTIPLIER_MAP[timeOfDay];

  // ── 2. Anchor score contributions ─────────────────────────────────────
  const anchorFactors: AnchorFactor[] = [];
  let rawAnchorScore = 0;

  for (const anchor of anchors) {
    const distanceKm = haversineDistance(lat, lng, anchor.latitude, anchor.longitude);
    const config = ANCHOR_CONFIG[anchor.category];
    if (!config) continue;
    // Only score anchors within 2× their influence radius
    if (distanceKm > config.radiusKm * 2.5) continue;

    const points = scoreAnchor(distanceKm, anchor.category);
    if (points < 0.01) continue; // Skip negligible contributions

    rawAnchorScore += points;
    anchorFactors.push({
      placeId: anchor.placeId,
      placeName: anchor.placeName,
      category: anchor.category,
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      pointsAdded: Math.round(points * 100) / 100,
    });
  }

  // Cap raw anchor score
  rawAnchorScore = Math.min(rawAnchorScore, MAX_ANCHOR_SCORE);

  // ── 3. Hazard penalty contributions ───────────────────────────────────
  const hazardFactors: HazardFactor[] = [];
  let rawHazardPenalty = 0;

  for (const hazard of hazards) {
    const distanceKm = haversineDistance(lat, lng, hazard.latitude, hazard.longitude);
    const penalty = scoreHazard(
      distanceKm,
      hazard.hazardCategory,
      hazard.upvotesCount,
      hazard.downvotesCount
    );
    if (penalty >= 0) continue; // No effect

    rawHazardPenalty += penalty;
    hazardFactors.push({
      noteId: hazard.noteId,
      hazardCategory: hazard.hazardCategory,
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      upvotesCount: hazard.upvotesCount,
      pointsDeducted: Math.round(penalty * 100) / 100,
    });
  }

  // Cap hazard penalty
  rawHazardPenalty = Math.max(rawHazardPenalty, MAX_HAZARD_PENALTY);

  // ── 4. Final composite score ───────────────────────────────────────────
  const rawScore = Math.max(0, rawAnchorScore + rawHazardPenalty);
  const finalScore = Math.min(10, Math.max(0, rawScore * timeMultiplier));
  const score = Math.round(finalScore * 10) / 10; // 1 decimal place

  const tier = scoreToTier(score);

  const tierLabel: Record<typeof tier, string> = {
    HIGH:   "High Safety",
    MEDIUM: "Moderate Safety",
    LOW:    "Low Safety",
  };
  const label = `${score.toFixed(1)} / 10 — ${tierLabel[tier]}`;

  return {
    score,
    tier,
    label,
    anchorScore: Math.round(rawAnchorScore * 100) / 100,
    hazardPenalty: Math.round(rawHazardPenalty * 100) / 100,
    timeOfDay,
    timeMultiplier,
    anchors: anchorFactors.sort((a, b) => b.pointsAdded - a.pointsAdded),
    hazards: hazardFactors.sort((a, b) => a.pointsDeducted - b.pointsDeducted),
    calculatedAt,
  };
}

/**
 * Compute a simplified heatmap-friendly score (0–10) for a grid of points.
 * Uses anchor data only (no hazards) for performance.
 */
export function computeHeatmapScore(
  lat: number,
  lng: number,
  anchors: ScoringAnchor[],
  now: Date = new Date()
): number {
  const timeMultiplier = TIME_MULTIPLIER_MAP[getTimeOfDay(now)];
  let rawScore = 0;

  for (const anchor of anchors) {
    const distanceKm = haversineDistance(lat, lng, anchor.latitude, anchor.longitude);
    rawScore += scoreAnchor(distanceKm, anchor.category);
  }

  rawScore = Math.min(rawScore, MAX_ANCHOR_SCORE);
  return Math.min(10, Math.max(0, rawScore * timeMultiplier));
}
