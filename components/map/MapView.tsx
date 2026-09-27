"use client";

// =======================================================================
// MapView.tsx — Phase 1 stub (PLANv2)
// Leaflet removed. Google Maps implementation coming in Phase 2.
// This stub preserves the exact prop interface so dependent components
// (app/page.tsx, MapContainer.tsx) compile without changes.
// =======================================================================

import { useEffect, useState, useCallback } from "react";
import { LatLng, DELHI_NCR_MAP_CONFIG } from "@/types/map";
import { SafetyPlace } from "@/types/place";
import { LocationNote } from "@/types/note";
import { NoteWithMeta, MapBounds } from "@/hooks/useLocationNotes";

interface MapViewProps {
  userLocation: LatLng;
  accuracy?: number | null;
  isSimulated?: boolean;
  places: SafetyPlace[];
  selectedPlace?: SafetyPlace | null;
  onSelectPlace?: (place: SafetyPlace) => void;
  onRequestLocation?: () => void;
  showHeatmap?: boolean;
  hazardNotes?: LocationNote[];
  notes?: NoteWithMeta[];
  onBoundsChange?: (bounds: MapBounds) => void;
  onDeleteNote?: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  onVoteNote?: (noteId: string, isUpvote: boolean) => Promise<{ success: boolean; error?: string }>;
}

export default function MapView({
  userLocation,
  onRequestLocation,
  onBoundsChange,
}: MapViewProps) {
  // Emit a default bounding box on mount so dependent hooks initialise
  useEffect(() => {
    if (!onBoundsChange) return;
    const DELTA = 0.05; // ~5 km grid
    onBoundsChange({
      minLat: userLocation.lat - DELTA,
      maxLat: userLocation.lat + DELTA,
      minLng: userLocation.lng - DELTA,
      maxLng: userLocation.lng + DELTA,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id="safecity-map-root"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#0a0d14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Phase 2 placeholder */}
      <div
        style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.4)",
          fontSize: "14px",
          fontFamily: "system-ui, sans-serif",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🗺️</div>
        <div style={{ fontWeight: 700, color: "rgba(16,185,129,0.7)", marginBottom: "4px" }}>
          Google Maps — Phase 2
        </div>
        <div style={{ fontSize: "12px" }}>
          Map engine will render here after Phase 2 is complete.
        </div>
        <div style={{ fontSize: "11px", marginTop: "4px", color: "rgba(255,255,255,0.25)" }}>
          Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </div>
      </div>

      {/* Locate Me button — functional even in stub mode */}
      <button
        id="safecity-locate-btn"
        aria-label="Center map on my location"
        onClick={onRequestLocation}
        style={{
          position: "absolute",
          right: "16px",
          bottom: "100px",
          width: "44px",
          height: "44px",
          borderRadius: "14px",
          backgroundColor: "rgba(20, 25, 35, 0.9)",
          border: "1.5px solid rgba(16, 185, 129, 0.4)",
          color: "#10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(16, 185, 129, 0.2)",
          transition: "all 0.2s ease",
        }}
        title="Locate Me"
      >
        🎯
      </button>
    </div>
  );
}
