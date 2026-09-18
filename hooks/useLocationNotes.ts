"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { LocationNote, CreateNoteInput } from "@/types/note";
import { encryptNote } from "@/lib/crypto";

// =======================================================================
// useLocationNotes — fetches + mutates community alerts and private pins
// for the currently visible map viewport.
// =======================================================================

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Wire response shape from /api/notes GET */
interface ApiNote {
  id: string;
  noteType: string;
  hazardCategory: string;
  latitude: number;
  longitude: number;
  content: string;
  isEncrypted: boolean;
  encryptionIv: string | null;
  upvotesCount: number;
  downvotesCount: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  authorPseudonym: string;
  isOwn: boolean;
}

export interface NoteWithMeta extends LocationNote {
  authorPseudonym: string;
  isOwn: boolean;
  /** Decrypted content (populated client-side for private pins). */
  decryptedContent?: string;
}

interface UseLocationNotesProps {
  bounds: MapBounds | null;
  /** Whether to actually fetch. Pass false when map is not ready. */
  enabled?: boolean;
}

interface UseLocationNotesReturn {
  notes: NoteWithMeta[];
  communityNotes: NoteWithMeta[];
  privateNotes: NoteWithMeta[];
  isLoading: boolean;
  error: string | null;
  createNote: (input: CreateNoteInput) => Promise<{ success: boolean; error?: string }>;
  deleteNote: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  voteOnNote: (
    noteId: string,
    isUpvote: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  refetch: () => void;
}

const FETCH_DEBOUNCE_MS = 400; // Debounce rapid bounds changes (map pan/zoom)

export function useLocationNotes({
  bounds,
  enabled = true,
}: UseLocationNotesProps): UseLocationNotesReturn {
  const { user, isSignedIn } = useUser();
  const [notes, setNotes] = useState<NoteWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundsRef = useRef<MapBounds | null>(null);

  // Keep latest bounds in a ref to use inside the debounced callback
  boundsRef.current = bounds;

  // ── Fetch notes for current bounds ────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    const currentBounds = boundsRef.current;
    if (!enabled || !currentBounds) return;

    // Cancel any pending request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const q = new URLSearchParams({
        minLat: currentBounds.minLat.toString(),
        maxLat: currentBounds.maxLat.toString(),
        minLng: currentBounds.minLng.toString(),
        maxLng: currentBounds.maxLng.toString(),
      });

      const res = await fetch(`/api/notes?${q}`, {
        signal: controller.signal,
        credentials: "include", // send session cookie so private pins are returned
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.notes)) {
        throw new Error("Malformed response from notes API");
      }

      // Shape API response into NoteWithMeta
      const shaped: NoteWithMeta[] = (data.notes as ApiNote[]).map((n) => ({
        id: n.id,
        userId: "",            // not exposed on the client for privacy
        authorPseudonym: n.authorPseudonym,
        noteType: n.noteType as LocationNote["noteType"],
        hazardCategory: n.hazardCategory as LocationNote["hazardCategory"],
        latitude: n.latitude,
        longitude: n.longitude,
        content: n.content,   // ciphertext for private, plaintext for community
        isEncrypted: n.isEncrypted,
        encryptionIv: n.encryptionIv ?? undefined,
        upvotesCount: n.upvotesCount,
        downvotesCount: n.downvotesCount,
        status: n.status as LocationNote["status"],
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : new Date(0),
        createdAt: new Date(n.createdAt),
        isOwn: n.isOwn,
        decryptedContent: undefined,
      }));

      setNotes(shaped);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[useLocationNotes] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, [enabled]); // bounds are read from ref so not a dep

  // Debounced bounds change handler
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchNotes, FETCH_DEBOUNCE_MS);
  }, [fetchNotes]);

  // Refetch whenever bounds change
  useEffect(() => {
    debouncedFetch();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [bounds, debouncedFetch]);

  // ── Create note ────────────────────────────────────────────────────────────
  const createNote = useCallback(
    async (input: CreateNoteInput): Promise<{ success: boolean; error?: string }> => {
      if (!isSignedIn || !user) {
        return { success: false, error: "You must be signed in to add notes" };
      }

      try {
        let content = "";
        let encryptionIv: string | undefined;

        if (input.noteType === "PRIVATE_PIN") {
          // Encrypt content client-side before sending to server
          const { ciphertext, iv } = await encryptNote(
            input.content,
            user.id
          );
          content = ciphertext;
          encryptionIv = iv;
        } else {
          content = input.content;
        }

        const body: Record<string, unknown> = {
          noteType: input.noteType,
          latitude: input.latitude,
          longitude: input.longitude,
          content,
          ...(input.noteType === "COMMUNITY_ALERT" && {
            hazardCategory: input.hazardCategory,
          }),
          ...(encryptionIv && { encryptionIv }),
        };

        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error ?? "Failed to create note" };

        // Optimistically add to local state so it appears on the map immediately
        if (data.success && data.note) {
          const optimistic: NoteWithMeta = {
            id: data.note.id,
            userId: "",
            authorPseudonym: data.note.authorPseudonym,
            noteType: data.note.noteType,
            hazardCategory: data.note.hazardCategory,
            latitude: input.latitude,
            longitude: input.longitude,
            content,
            isEncrypted: data.note.isEncrypted,
            upvotesCount: 0,
            downvotesCount: 0,
            status: "ACTIVE",
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            isOwn: true,
            // For private pins, show the original plaintext locally
            decryptedContent:
              input.noteType === "PRIVATE_PIN" ? input.content : undefined,
          };
          setNotes((prev) => [optimistic, ...prev]);
        }

        return { success: true };
      } catch (err: unknown) {
        console.error("[useLocationNotes] createNote error:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to create note",
        };
      }
    },
    [isSignedIn, user]
  );

  // ── Delete note ────────────────────────────────────────────────────────────
  const deleteNote = useCallback(
    async (noteId: string): Promise<{ success: boolean; error?: string }> => {
      if (!isSignedIn) {
        return { success: false, error: "Authentication required" };
      }
      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error ?? "Failed to delete note" };

        // Remove optimistically from local state
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        return { success: true };
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to delete note",
        };
      }
    },
    [isSignedIn]
  );

  // ── Vote on note ───────────────────────────────────────────────────────────
  const voteOnNote = useCallback(
    async (
      noteId: string,
      isUpvote: boolean
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isSignedIn) {
        return { success: false, error: "Authentication required to vote" };
      }
      try {
        const res = await fetch(`/api/notes/${noteId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isUpvote }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error ?? "Failed to cast vote" };

        // Optimistically update vote counts and status in local state
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  upvotesCount: data.upvotesCount,
                  downvotesCount: data.downvotesCount,
                  status: data.status,
                }
              : n
          )
        );

        return { success: true };
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to cast vote",
        };
      }
    },
    [isSignedIn]
  );

  // ── Derived state ──────────────────────────────────────────────────────────
  const communityNotes = notes.filter((n) => n.noteType === "COMMUNITY_ALERT");
  const privateNotes = notes.filter((n) => n.noteType === "PRIVATE_PIN");

  return {
    notes,
    communityNotes,
    privateNotes,
    isLoading,
    error,
    createNote,
    deleteNote,
    voteOnNote,
    refetch: fetchNotes,
  };
}
