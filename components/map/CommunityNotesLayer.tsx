"use client";

// =======================================================================
// CommunityNotesLayer.tsx — Phase 1 stub (PLANv2)
// Leaflet removed. Will be replaced with AdvancedMarker + InfoWindow
// from @vis.gl/react-google-maps in Phase 2.
// =======================================================================

import { NoteWithMeta } from "@/hooks/useLocationNotes";

interface CommunityNotesLayerProps {
  notes: NoteWithMeta[];
  onDelete: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  onVote: (noteId: string, isUpvote: boolean) => Promise<{ success: boolean; error?: string }>;
}

// No-op — Phase 2 will render Google AdvancedMarkers with React portals
export default function CommunityNotesLayer(_props: CommunityNotesLayerProps) {
  return null;
}
