"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { NoteWithMeta } from "@/hooks/useLocationNotes";
import { HAZARD_CATEGORY_META, HazardCategory } from "@/types/note";
import ReactDOM from "react-dom/client";
import NoteDetailCard from "@/components/notes/NoteDetailCard";

// =======================================================================
// CommunityNotesLayer — renders community alert & private pin markers
// on the Leaflet map canvas.  Must be rendered inside <MapContainer>.
// SSR-safe: only imported via next/dynamic with { ssr: false }.
// =======================================================================

interface CommunityNotesLayerProps {
  notes: NoteWithMeta[];
  onDelete: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  onVote: (noteId: string, isUpvote: boolean) => Promise<{ success: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// SVG icon builders
// ---------------------------------------------------------------------------

function buildCommunityIcon(hazardCategory: string): L.DivIcon {
  const meta = HAZARD_CATEGORY_META[hazardCategory as HazardCategory] ?? {
    icon: "📍",
    color: "#94a3b8",
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
      <defs>
        <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${meta.color}" flood-opacity="0.5"/>
        </filter>
      </defs>
      <!-- Pin body -->
      <path d="M18 2 C10.27 2 4 8.27 4 16 C4 26 18 40 18 40 C18 40 32 26 32 16 C32 8.27 25.73 2 18 2Z"
            fill="${meta.color}" filter="url(#shadow)" />
      <!-- Inner circle -->
      <circle cx="18" cy="16" r="9" fill="rgba(0,0,0,0.35)" />
      <!-- Emoji -->
      <text x="18" y="20" text-anchor="middle" font-size="11" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${meta.icon}</text>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -44],
  });
}

function buildPrivateIcon(): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="38" viewBox="0 0 32 38">
      <defs>
        <filter id="ps" x="-40%" y="-30%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#818cf8" flood-opacity="0.6"/>
        </filter>
      </defs>
      <path d="M16 1 C9.37 1 4 6.37 4 13 C4 22 16 37 16 37 C16 37 28 22 28 13 C28 6.37 22.63 1 16 1Z"
            fill="#818cf8" filter="url(#ps)" />
      <circle cx="16" cy="13" r="8" fill="rgba(0,0,0,0.35)" />
      <text x="16" y="17" text-anchor="middle" font-size="10" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">🔒</text>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -40],
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommunityNotesLayer({
  notes,
  onDelete,
  onVote,
}: CommunityNotesLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  // Keep a stable ref to callbacks to avoid re-rendering markers on every vote
  const onDeleteRef = useRef(onDelete);
  const onVoteRef = useRef(onVote);
  onDeleteRef.current = onDelete;
  onVoteRef.current = onVote;

  useEffect(() => {
    // Initialise layer group
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }

    const layer = layerRef.current;
    layer.clearLayers();

    notes.forEach((note) => {
      const icon =
        note.noteType === "PRIVATE_PIN"
          ? buildPrivateIcon()
          : buildCommunityIcon(note.hazardCategory);

      const marker = L.marker([note.latitude, note.longitude], { icon });

      // Build a popup container — React renders NoteDetailCard into it
      const container = document.createElement("div");
      container.style.cssText = "min-width:240px;max-width:300px;";

      // Lazy-render the React tree when popup opens to keep map performance high
      marker.bindPopup(container, {
        maxWidth: 320,
        className: "safecity-note-popup",
        closeButton: true,
      });

      let root: ReturnType<typeof ReactDOM.createRoot> | null = null;

      marker.on("popupopen", () => {
        root = ReactDOM.createRoot(container);
        root.render(
          <NoteDetailCard
            note={note}
            onDelete={onDeleteRef.current}
            onVote={onVoteRef.current}
            onClose={() => marker.closePopup()}
          />
        );
      });

      marker.on("popupclose", () => {
        // Unmount after animation to avoid React warnings
        setTimeout(() => {
          root?.unmount();
          root = null;
        }, 300);
      });

      layer.addLayer(marker);
    });

    return () => {
      if (layerRef.current) {
        layerRef.current.clearLayers();
      }
    };
  }, [notes, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null; // Pure imperative Leaflet layer — no JSX rendered
}
