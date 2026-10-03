"use client";

// =======================================================================
// CommunityNotesLayer.tsx — Phase 2 (PLANv2)
// Replaces the Phase 1 no-op stub. Renders an <AdvancedMarker> +
// <InfoWindow> for every community hazard alert note using
// @vis.gl/react-google-maps.
//
// Each marker shows the hazard icon and severity colour.
// The InfoWindow displays content, vote counts, and upvote/downvote
// actions. Users can also delete their own notes from here.
// =======================================================================

import { useState, useCallback } from "react";
import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { NoteWithMeta } from "@/hooks/useLocationNotes";
import { HAZARD_CATEGORY_META } from "@/types/note";

interface CommunityNotesLayerProps {
  notes: NoteWithMeta[];
  onDelete: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  onVote: (noteId: string, isUpvote: boolean) => Promise<{ success: boolean; error?: string }>;
}

// ── Hazard marker pin ─────────────────────────────────────────────────────────
function HazardPin({ note }: { note: NoteWithMeta }) {
  const meta = HAZARD_CATEGORY_META[note.hazardCategory];
  const color = meta?.color ?? "#ef4444";
  const icon = meta?.icon ?? "⚠️";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Hazard badge */}
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          backgroundColor: `${color}22`,
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          boxShadow: `0 0 12px ${color}60, 0 2px 8px rgba(0,0,0,0.6)`,
          animation: "safecity-hazard-glow 2.5s ease-in-out infinite alternate",
        }}
      >
        {icon}
      </div>
      {/* Dot anchor */}
      <div
        style={{
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          backgroundColor: color,
          marginTop: "1px",
        }}
      />
      <style>{`
        @keyframes safecity-hazard-glow {
          from { box-shadow: 0 0 8px ${color}40, 0 2px 6px rgba(0,0,0,0.5); }
          to   { box-shadow: 0 0 20px ${color}90, 0 2px 10px rgba(0,0,0,0.7); }
        }
      `}</style>
    </div>
  );
}

// ── InfoWindow content ────────────────────────────────────────────────────────
interface NoteInfoContentProps {
  note: NoteWithMeta;
  onVote: (isUpvote: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
  isVoting: boolean;
}

function NoteInfoContent({
  note,
  onVote,
  onDelete,
  isDeleting,
  isVoting,
}: NoteInfoContentProps) {
  const meta = HAZARD_CATEGORY_META[note.hazardCategory];
  const color = meta?.color ?? "#ef4444";

  const timeAgo = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    if (diffH < 1) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  };

  return (
    <div
      style={{
        minWidth: "210px",
        maxWidth: "270px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "4px 2px",
      }}
    >
      {/* Category badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "12px",
          backgroundColor: `${color}22`,
          border: `1px solid ${color}66`,
          marginBottom: "6px",
        }}
      >
        <span style={{ fontSize: "12px" }}>{meta?.icon}</span>
        <span style={{ fontSize: "11px", fontWeight: "700", color }}>
          {meta?.label ?? note.hazardCategory}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          fontSize: "13px",
          color: "#1e293b",
          marginBottom: "6px",
          lineHeight: 1.4,
        }}
      >
        {note.content}
      </div>

      {/* Author + time */}
      <div
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          marginBottom: "8px",
        }}
      >
        {note.authorPseudonym} · {timeAgo(note.createdAt)}
      </div>

      {/* Vote row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onVote(true)}
          disabled={isVoting}
          title="Still an issue"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(16,185,129,0.4)",
            backgroundColor: "rgba(16,185,129,0.1)",
            color: "#10b981",
            fontSize: "12px",
            fontWeight: "600",
            cursor: isVoting ? "not-allowed" : "pointer",
            opacity: isVoting ? 0.6 : 1,
          }}
        >
          👍 {note.upvotesCount}
        </button>

        <button
          onClick={() => onVote(false)}
          disabled={isVoting}
          title="Resolved / Inaccurate"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(239,68,68,0.4)",
            backgroundColor: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            fontSize: "12px",
            fontWeight: "600",
            cursor: isVoting ? "not-allowed" : "pointer",
            opacity: isVoting ? 0.6 : 1,
          }}
        >
          👎 {note.downvotesCount}
        </button>

        {/* Delete — only for note author */}
        {note.isOwn && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            title="Delete note"
            style={{
              marginLeft: "auto",
              padding: "4px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(239,68,68,0.3)",
              backgroundColor: "transparent",
              color: "#ef4444",
              fontSize: "11px",
              fontWeight: "600",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            {isDeleting ? "…" : "🗑 Delete"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main layer component ──────────────────────────────────────────────────────
export default function CommunityNotesLayer({
  notes,
  onDelete,
  onVote,
}: CommunityNotesLayerProps) {
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  const handleMarkerClick = useCallback((noteId: string) => {
    setOpenNoteId((prev) => (prev === noteId ? null : noteId));
  }, []);

  const handleDelete = useCallback(
    async (noteId: string) => {
      setDeletingId(noteId);
      await onDelete(noteId);
      setDeletingId(null);
      setOpenNoteId(null);
    },
    [onDelete]
  );

  const handleVote = useCallback(
    async (noteId: string, isUpvote: boolean) => {
      setVotingId(noteId);
      await onVote(noteId, isUpvote);
      setVotingId(null);
    },
    [onVote]
  );

  return (
    <>
      {notes.map((note) => (
        <AdvancedMarker
          key={note.id}
          position={{ lat: note.latitude, lng: note.longitude }}
          onClick={() => handleMarkerClick(note.id)}
          zIndex={openNoteId === note.id ? 800 : 400}
          title={`${HAZARD_CATEGORY_META[note.hazardCategory]?.label ?? "Hazard"}: ${note.content.slice(0, 60)}`}
        >
          <HazardPin note={note} />
        </AdvancedMarker>
      ))}

      {/* InfoWindow for the currently open note */}
      {openNoteId && (() => {
        const note = notes.find((n) => n.id === openNoteId);
        if (!note) return null;
        return (
          <InfoWindow
            position={{ lat: note.latitude, lng: note.longitude }}
            onCloseClick={() => setOpenNoteId(null)}
            pixelOffset={[0, -42]}
          >
            <NoteInfoContent
              note={note}
              onVote={(isUpvote) => handleVote(note.id, isUpvote)}
              onDelete={() => handleDelete(note.id)}
              isDeleting={deletingId === note.id}
              isVoting={votingId === note.id}
            />
          </InfoWindow>
        );
      })()}
    </>
  );
}
