"use client";

import { useState, useEffect } from "react";
import { useUser, useSignIn } from "@clerk/nextjs";
import { CreateNoteInput, HAZARD_CATEGORY_META, HazardCategory } from "@/types/note";
import { isWebCryptoAvailable } from "@/lib/crypto";

// =======================================================================
// CreateNoteDialog — modal for dropping a community alert or private pin
// at a specific set of coordinates.
// =======================================================================

interface CreateNoteDialogProps {
  isOpen: boolean;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onCreate: (input: CreateNoteInput) => Promise<{ success: boolean; error?: string }>;
}

type NoteMode = "COMMUNITY_ALERT" | "PRIVATE_PIN";

const HAZARD_OPTIONS: HazardCategory[] = [
  "POOR_LIGHTING",
  "DESERTED_AREA",
  "HARASSMENT_SPOT",
  "SAFE_ZONE",
  "GENERAL_TIP",
];

// Metadata entry for GENERAL_TIP (not in the imported constant)
const GENERAL_TIP_META = {
  label: "General Tip",
  description: "Useful safety info for other commuters",
  icon: "💬",
  penaltyPts: 0,
  color: "#60a5fa",
};

export default function CreateNoteDialog({
  isOpen,
  latitude,
  longitude,
  onClose,
  onCreate,
}: CreateNoteDialogProps) {
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useSignIn();

  const [mode, setMode] = useState<NoteMode>("COMMUNITY_ALERT");
  const [hazardCategory, setHazardCategory] = useState<HazardCategory>("GENERAL_TIP");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const cryptoAvailable = isWebCryptoAvailable();

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMode("COMMUNITY_ALERT");
      setHazardCategory("GENERAL_TIP");
      setContent("");
      setError(null);
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div style={overlayStyle}>
        <div style={dialogStyle}>
          <div style={headerStyle}>
            <h2 style={titleStyle}>Sign In Required</h2>
            <button style={closeButtonStyle} aria-label="Close" onClick={onClose}>×</button>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
            You must be signed in to add community alerts or private pins to the map.
          </p>
          <button
            id="create-note-signin-btn"
            style={primaryButtonStyle}
            onClick={() => { onClose(); openSignIn?.(); }}
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={overlayStyle}>
        <div style={dialogStyle}>
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div style={{ fontSize: "44px", marginBottom: "14px" }}>
              {mode === "PRIVATE_PIN" ? "🔒" : "✅"}
            </div>
            <h2 style={{ ...titleStyle, textAlign: "center" }}>
              {mode === "PRIVATE_PIN" ? "Private Pin Saved" : "Report Submitted"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, margin: "8px 0 20px" }}>
              {mode === "PRIVATE_PIN"
                ? "Your note is encrypted and only visible to you."
                : "Thank you! Your report is now visible to all commuters."}
            </p>
            <button style={primaryButtonStyle} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Please enter a description.");
      return;
    }
    if (content.length > 500) {
      setError("Description must be 500 characters or fewer.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const input: CreateNoteInput =
      mode === "PRIVATE_PIN"
        ? {
            noteType: "PRIVATE_PIN",
            latitude,
            longitude,
            content: content.trim(),
            encryptionIv: "", // populated by hook
          }
        : {
            noteType: "COMMUNITY_ALERT",
            hazardCategory,
            latitude,
            longitude,
            content: content.trim(),
          };

    const result = await onCreate(input);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error ?? "Failed to save note. Please try again.");
    }

    setIsSubmitting(false);
  };

  const getMeta = (cat: HazardCategory) =>
    cat === "GENERAL_TIP" ? GENERAL_TIP_META : HAZARD_CATEGORY_META[cat];

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dialogStyle}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>Drop a Pin</h2>
          <button style={closeButtonStyle} aria-label="Close dialog" onClick={onClose}>×</button>
        </div>

        {/* ── Coordinates ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            marginBottom: "16px",
            padding: "7px 10px",
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span style={{ fontSize: "12px" }}>📍</span>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#334155", fontWeight: "700" }}>
            Delhi NCR
          </span>
        </div>

        {/* ── Mode toggle ─────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: "10px",
            padding: "3px",
            marginBottom: "18px",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {(["COMMUNITY_ALERT", "PRIVATE_PIN"] as NoteMode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                id={`note-mode-${m.toLowerCase()}`}
                onClick={() => setMode(m)}
                disabled={m === "PRIVATE_PIN" && !cryptoAvailable}
                title={m === "PRIVATE_PIN" && !cryptoAvailable ? "Web Crypto API not available in this browser" : undefined}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: active
                    ? m === "PRIVATE_PIN"
                      ? "#818cf8"
                      : "#ef4444"
                    : "transparent",
                  color: active ? "#fff" : "#64748b",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: m === "PRIVATE_PIN" && !cryptoAvailable ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: m === "PRIVATE_PIN" && !cryptoAvailable ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                }}
              >
                <span>{m === "PRIVATE_PIN" ? "🔒" : "📢"}</span>
                <span>{m === "PRIVATE_PIN" ? "Private Note" : "Community Alert"}</span>
              </button>
            );
          })}
        </div>

        {/* ── Hazard category picker (community only) ─────────────────── */}
        {mode === "COMMUNITY_ALERT" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Report Type</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {HAZARD_OPTIONS.map((cat) => {
                const m = getMeta(cat);
                const selected = hazardCategory === cat;
                return (
                  <button
                    key={cat}
                    id={`hazard-cat-${cat.toLowerCase()}`}
                    onClick={() => setHazardCategory(cat)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      borderRadius: "8px",
                      border: `1px solid ${selected ? m.color : "rgba(255,255,255,0.1)"}`,
                      backgroundColor: selected ? `${m.color}20` : "rgba(255,255,255,0.04)",
                      color: selected ? m.color : "#64748b",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
            {hazardCategory && (
              <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#475569" }}>
                {getMeta(hazardCategory).description}
              </p>
            )}
          </div>
        )}

        {/* ── Private pin info banner ─────────────────────────────────── */}
        {mode === "PRIVATE_PIN" && (
          <div
            style={{
              marginBottom: "14px",
              padding: "10px 12px",
              backgroundColor: "rgba(129,140,248,0.08)",
              border: "1px solid rgba(129,140,248,0.25)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#a5b4fc",
              lineHeight: 1.5,
            }}
          >
            🔐 <strong>Zero-Knowledge:</strong> Your note is encrypted in your browser before
            being sent. Only you can read it — even the server cannot.
          </div>
        )}

        {/* ── Content textarea ────────────────────────────────────────── */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="note-content" style={labelStyle}>
            {mode === "PRIVATE_PIN" ? "Your Private Note" : "Describe the Situation"}
          </label>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            placeholder={
              mode === "PRIVATE_PIN"
                ? "Personal safety observation for this location…"
                : "e.g. Street lights are broken near the underpass, feels unsafe at night…"
            }
            maxLength={500}
            rows={4}
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
              borderRadius: "10px",
              color: "#e2e8f0",
              fontSize: "13px",
              lineHeight: "1.5",
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              transition: "border-color 0.15s ease",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "4px",
              fontSize: "10px",
              color: "#475569",
            }}
          >
            <span>{error && <span style={{ color: "#f87171" }}>{error}</span>}</span>
            <span style={{ color: content.length > 450 ? "#f59e0b" : "#475569" }}>
              {content.length}/500
            </span>
          </div>
        </div>

        {/* ── Submitting as ────────────────────────────────────────────── */}
        <p style={{ margin: "0 0 14px 0", fontSize: "11px", color: "#475569" }}>
          Posting as{" "}
          <strong style={{ color: "#64748b" }}>
            {(user as { publicMetadata?: { pseudonym?: string } })?.publicMetadata?.pseudonym ?? "NCR_Commuter"}
          </strong>{" "}
          · {mode === "COMMUNITY_ALERT" ? "Visible to all commuters" : "Only visible to you"}
        </p>

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            style={{
              ...primaryButtonStyle,
              flex: 1,
              backgroundColor:
                mode === "PRIVATE_PIN"
                  ? isSubmitting ? "#6366f1" : "#818cf8"
                  : isSubmitting ? "#dc2626" : "#ef4444",
              opacity: isSubmitting ? 0.8 : 1,
            }}
            id="create-note-submit-btn"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting
              ? mode === "PRIVATE_PIN"
                ? "🔐 Encrypting…"
                : "📤 Submitting…"
              : mode === "PRIVATE_PIN"
              ? "🔒 Save Private Pin"
              : "📢 Submit Alert"}
          </button>
          <button
            style={cancelButtonStyle}
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared style objects
// ---------------------------------------------------------------------------

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1100,
  backgroundColor: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: "0",
};

const dialogStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  backgroundColor: "#141923",
  borderRadius: "20px 20px 0 0",
  border: "1px solid rgba(255,255,255,0.08)",
  borderBottom: "none",
  padding: "20px 20px 32px",
  boxShadow: "0 -8px 40px rgba(0,0,0,0.7)",
  maxHeight: "90dvh",
  overflowY: "auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "800",
  color: "#f1f5f9",
  letterSpacing: "-0.3px",
};

const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#64748b",
  fontSize: "22px",
  cursor: "pointer",
  lineHeight: 1,
  padding: "2px 6px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: "800",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  marginBottom: "8px",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "12px 20px",
  borderRadius: "12px",
  border: "none",
  backgroundColor: "#ef4444",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  transition: "all 0.2s ease",
  width: "100%",
};

const cancelButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.05)",
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
};
