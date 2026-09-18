/**
 * LocationNote types — Community Alerts and Private Pins
 * submitted by authenticated Delhi NCR commuters.
 */

/** Note classification: public crowd-sourced vs. private encrypted */
export type NoteType = "COMMUNITY_ALERT" | "PRIVATE_PIN";

/**
 * Hazard category for community alerts.
 * Maps to specific WSI safety score penalties (see safetyScorer.ts).
 */
export type HazardCategory =
  | "POOR_LIGHTING"     // Broken or absent street lighting (-1.5 pts)
  | "DESERTED_AREA"     // Isolated street / no footfall (-2.0 pts)
  | "HARASSMENT_SPOT"   // Reported catcalling / eve-teasing area (-3.0 pts)
  | "SAFE_ZONE";        // Verified community safe spot (+1.0 pts)

/** Lifecycle status of a community note */
export type NoteStatus = "ACTIVE" | "RESOLVED" | "FLAGGED" | "EXPIRED";

/**
 * A location-tagged note — either a public community hazard alert
 * or an AES-256-GCM encrypted private safety pin.
 */
export interface LocationNote {
  id: string;
  userId: string;
  /** Anonymous display alias (e.g. "NCR_Commuter_7381") — never real name */
  authorPseudonym: string;
  noteType: NoteType;
  hazardCategory: HazardCategory;
  latitude: number;
  longitude: number;
  /** Plaintext content (community) or AES-GCM ciphertext (private) */
  content: string;
  /** True if content is client-encrypted — server cannot read it */
  isEncrypted: boolean;
  /** Base64-encoded 96-bit IV used for AES-256-GCM (null for community alerts) */
  encryptionIv?: string | null;
  upvotesCount: number;
  downvotesCount: number;
  status: NoteStatus;
  expiresAt: Date;
  createdAt: Date;
}

/** Vote cast by a commuter on a community alert */
export interface NoteVote {
  id: string;
  noteId: string;
  userId: string;
  /** true = "Still an Issue" / false = "Resolved / Inaccurate" */
  isUpvote: boolean;
  createdAt: Date;
}

/** Payload for creating a new community alert */
export interface CreateCommunityAlertInput {
  noteType: "COMMUNITY_ALERT";
  hazardCategory: HazardCategory;
  latitude: number;
  longitude: number;
  content: string;
}

/** Payload for creating an encrypted private pin */
export interface CreatePrivatePinInput {
  noteType: "PRIVATE_PIN";
  latitude: number;
  longitude: number;
  /** AES-256-GCM ciphertext (encrypted in browser before transmission) */
  content: string;
  /** Base64-encoded 96-bit IV used for encryption */
  encryptionIv: string;
}

export type CreateNoteInput = CreateCommunityAlertInput | CreatePrivatePinInput;

/** Display metadata for each hazard category */
export interface HazardCategoryMeta {
  label: string;
  description: string;
  icon: string;
  penaltyPts: number;
  color: string;
}

export const HAZARD_CATEGORY_META: Record<HazardCategory, HazardCategoryMeta> = {
  POOR_LIGHTING: {
    label: "Poor Lighting",
    description: "Broken or missing street lights",
    icon: "💡",
    penaltyPts: -1.5,
    color: "#f59e0b",
  },
  DESERTED_AREA: {
    label: "Deserted Area",
    description: "Isolated road with no pedestrian footfall",
    icon: "🚶",
    penaltyPts: -2.0,
    color: "#f97316",
  },
  HARASSMENT_SPOT: {
    label: "Harassment Spot",
    description: "Reported catcalling or eve-teasing",
    icon: "⚠️",
    penaltyPts: -3.0,
    color: "#ef4444",
  },
  SAFE_ZONE: {
    label: "Safe Zone",
    description: "Community-verified safe gathering spot",
    icon: "✅",
    penaltyPts: 1.0,
    color: "#10b981",
  },
};
