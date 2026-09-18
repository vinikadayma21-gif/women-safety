"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { NoteWithMeta } from "@/hooks/useLocationNotes";
import { HAZARD_CATEGORY_META } from "@/types/note";
import { decryptNote } from "@/lib/crypto";
import VoteActions from "./VoteActions";

// =======================================================================
// NoteDetailCard — Popup card for a community alert or private pin.
// Shown inside a Leaflet popup or a bottom sheet modal.
// =======================================================================

interface NoteDetailCardProps {
  note: NoteWithMeta;
  onDelete?: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  onVote?: (noteId: string, isUpvote: boolean) => Promise<{ success: boolean; error?: string }>;
  onClose?: () => void;
}

/** Human-readable relative time (e.g. "2 hours ago") */
function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NoteDetailCard({
  note,
  onDelete,
  onVote,
  onClose,
}: NoteDetailCardProps) {
  const { user, isSignedIn } = useUser();
  const [decryptedText, setDecryptedText] = useState<string | null>(
    note.decryptedContent ?? null
  );
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isPrivate = note.noteType === "PRIVATE_PIN";
  const meta = isPrivate
    ? { label: "Private Pin", icon: "🔒", color: "#818cf8" }
    : HAZARD_CATEGORY_META[note.hazardCategory] ?? {
        label: note.hazardCategory,
        icon: "📍",
        color: "#94a3b8",
      };

  // ── Decrypt private note content on mount if not already decrypted ────────
  useEffect(() => {
    if (!isPrivate || !note.isEncrypted || !note.encryptionIv || decryptedText) return;
    if (!isSignedIn || !user) return;

    setIsDecrypting(true);
    decryptNote(note.content, note.encryptionIv as string, user.id)
      .then((text) => setDecryptedText(text))
      .catch(() => setDecryptError("Unable to decrypt — was this created on a different account?"))
      .finally(() => setIsDecrypting(false));
  }, [isPrivate, note.isEncrypted, note.encryptionIv, note.content, isSignedIn, user, decryptedText]);

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    const result = await onDelete(note.id);
    if (!result.success) {
      setDeleteError(result.error ?? "Failed to delete");
      setIsDeleting(false);
    }
    // On success, parent will remove note from state and unmount this card
  };

  const displayContent = isPrivate
    ? isDecrypting
      ? "🔓 Decrypting…"
      : decryptError
      ? decryptError
      : decryptedText ?? "No content"
    : note.content;

  return (
    <div
      id={`note-card-${note.id}`}
      style={{
        backgroundColor: "#141923",
        border: `1px solid ${meta.color}30`,
        borderRadius: "14px",
        padding: "14px 16px",
        minWidth: "240px",
        maxWidth: "300px",
        fontFamily: "inherit",
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
      }}
    >
      {/* ── Header Row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        {/* Category badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>{meta.icon}</span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "800",
              color: meta.color,
              backgroundColor: `${meta.color}18`,
              border: `1px solid ${meta.color}30`,
              padding: "2px 8px",
              borderRadius: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
            }}
          >
            {meta.label}
          </span>
        </div>

        {/* Close button (when rendered in a panel, not a popup) */}
        {onClose && (
          <button
            aria-label="Close note card"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: "16px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "2px 4px",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* ── Note content ────────────────────────────────────────────────── */}
      <p
        style={{
          margin: "0 0 10px 0",
          fontSize: "13px",
          color: isDecrypting || decryptError ? "#64748b" : "#e2e8f0",
          lineHeight: "1.5",
          fontStyle: isDecrypting ? "italic" : "normal",
        }}
      >
        {displayContent}
      </p>

      {/* ── Meta: author + time ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "#475569",
          fontWeight: "600",
        }}
      >
        <span>👤 {note.authorPseudonym}</span>
        <span>{relativeTime(note.createdAt)}</span>
      </div>

      {/* ── Vote actions (community alerts only) ────────────────────────── */}
      {!isPrivate && onVote && (
        <VoteActions
          noteId={note.id}
          upvotesCount={note.upvotesCount}
          downvotesCount={note.downvotesCount}
          isAuthenticated={!!isSignedIn}
          onVote={onVote}
        />
      )}

      {/* ── Delete (author only) ────────────────────────────────────────── */}
      {note.isOwn && onDelete && (
        <div style={{ marginTop: "10px" }}>
          {deleteError && (
            <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#f87171" }}>
              {deleteError}
            </p>
          )}
          <button
            id={`delete-note-${note.id}`}
            aria-label="Delete this note"
            disabled={isDeleting}
            onClick={handleDelete}
            style={{
              width: "100%",
              padding: "7px",
              borderRadius: "8px",
              border: "1px solid rgba(239,68,68,0.25)",
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#f87171",
              fontSize: "11px",
              fontWeight: "700",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
          >
            {isDeleting ? "Deleting…" : "🗑 Delete Report"}
          </button>
        </div>
      )}
    </div>
  );
}
