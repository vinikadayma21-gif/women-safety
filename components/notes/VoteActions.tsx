"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";

// =======================================================================
// VoteActions — "Still an Issue 👍" / "Resolved ✅" voting buttons
// Displayed inside NoteDetailCard for COMMUNITY_ALERT notes.
// =======================================================================

interface VoteActionsProps {
  noteId: string;
  upvotesCount: number;
  downvotesCount: number;
  isAuthenticated: boolean;
  onVote: (noteId: string, isUpvote: boolean) => Promise<{ success: boolean; error?: string }>;
}

export default function VoteActions({
  noteId,
  upvotesCount,
  downvotesCount,
  isAuthenticated,
  onVote,
}: VoteActionsProps) {
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { openSignIn } = useSignIn();

  const handleVote = async (isUpvote: boolean) => {
    if (!isAuthenticated) {
      openSignIn?.();
      return;
    }
    if (hasVoted || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    const result = await onVote(noteId, isUpvote);

    if (result.success) {
      setHasVoted(true);
      setFeedback(isUpvote ? "Marked as still active" : "Marked as resolved");
    } else {
      setFeedback(result.error ?? "Failed to submit vote");
    }

    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "10px",
        paddingTop: "10px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "10px",
          fontWeight: "700",
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        Community Verification
      </p>

      <div style={{ display: "flex", gap: "8px" }}>
        {/* Still an Issue */}
        <button
          id={`vote-up-${noteId}`}
          aria-label="Still an issue — upvote"
          disabled={hasVoted || isSubmitting}
          onClick={() => handleVote(true)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "7px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            backgroundColor: hasVoted ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.12)",
            color: "#ef4444",
            fontSize: "11px",
            fontWeight: "700",
            cursor: hasVoted || isSubmitting ? "not-allowed" : "pointer",
            opacity: hasVoted || isSubmitting ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <span>🚨</span>
          <span>Still Active</span>
          <span
            style={{
              marginLeft: "2px",
              backgroundColor: "rgba(239,68,68,0.25)",
              borderRadius: "4px",
              padding: "1px 5px",
              fontSize: "10px",
            }}
          >
            {upvotesCount}
          </span>
        </button>

        {/* Resolved / False Report */}
        <button
          id={`vote-down-${noteId}`}
          aria-label="Resolved — downvote"
          disabled={hasVoted || isSubmitting}
          onClick={() => handleVote(false)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "7px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            backgroundColor: hasVoted ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.12)",
            color: "#10b981",
            fontSize: "11px",
            fontWeight: "700",
            cursor: hasVoted || isSubmitting ? "not-allowed" : "pointer",
            opacity: hasVoted || isSubmitting ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <span>✅</span>
          <span>Resolved</span>
          <span
            style={{
              marginLeft: "2px",
              backgroundColor: "rgba(16,185,129,0.25)",
              borderRadius: "4px",
              padding: "1px 5px",
              fontSize: "10px",
            }}
          >
            {downvotesCount}
          </span>
        </button>
      </div>

      {/* Feedback message */}
      {feedback && (
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            color: hasVoted ? "#10b981" : "#f87171",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {feedback}
        </p>
      )}

      {/* Sign-in prompt for unauthenticated users */}
      {!isAuthenticated && (
        <p
          style={{
            margin: 0,
            fontSize: "10px",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          Sign in to verify this report
        </p>
      )}
    </div>
  );
}
