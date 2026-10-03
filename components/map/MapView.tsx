"use client";

// =======================================================================
// MapView.tsx — Phase 2 + 3 (PLANv2)
// Full Google Maps dark-mode map using @vis.gl/react-google-maps.
//
// Phase 2: <Map> component + AdvancedMarker layers for GPS dot,
//          place markers, and community hazard notes.
// Phase 3: SafetyHeatmapLayer uses google.maps.visualization.HeatmapLayer
//          fed by useHeatmapGrid → /api/heatmap on every map idle event.
// =======================================================================

import { useEffect, useCallback, useRef, useState } from "react";
import {
  Map,
  useMap,
  MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import { LatLng, DELHI_NCR_MAP_CONFIG } from "@/types/map";
import { SafetyPlace } from "@/types/place";
import { LocationNote } from "@/types/note";
import { NoteWithMeta, MapBounds } from "@/hooks/useLocationNotes";
import UserLocationMarker from "./UserLocationMarker";
import PlaceMarkersLayer from "./PlaceMarkersLayer";
import CommunityNotesLayer from "./CommunityNotesLayer";
import SafetyHeatmapLayer from "./SafetyHeatmapLayer";

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

// ── Inner component that can use useMap() (must be inside <Map>) ──────────────
function MapInner({
  userLocation,
  accuracy,
  isSimulated,
  places,
  selectedPlace,
  onSelectPlace,
  onRequestLocation,
  showHeatmap = true,
  hazardNotes = [],
  notes = [],
  onDeleteNote,
  onVoteNote,
}: MapViewProps) {
  const map = useMap();
  const hasInitialized = useRef(false);

  // Pan map to user location when it becomes known
  useEffect(() => {
    if (!map) return;
    if (!hasInitialized.current) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      hasInitialized.current = true;
    }
  }, [map, userLocation]);

  // Pan to selected place when user taps a marker
  useEffect(() => {
    if (!map || !selectedPlace) return;
    map.panTo({ lat: selectedPlace.latitude, lng: selectedPlace.longitude });
  }, [map, selectedPlace]);

  const handleLocateMe = useCallback(() => {
    if (onRequestLocation) onRequestLocation();
    if (map) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(16);
    }
  }, [map, userLocation, onRequestLocation]);

  // Community notes (public hazard alerts)
  const communityNotes = notes.filter((n) => n.noteType === "COMMUNITY_ALERT");

  return (
    <>
      {/* User pulsing GPS dot */}
      <UserLocationMarker
        position={userLocation}
        accuracy={accuracy}
        isSimulated={isSimulated}
      />

      {/* Safety infrastructure markers */}
      <PlaceMarkersLayer
        places={places}
        onSelectPlace={onSelectPlace}
      />

      {/* Community hazard report markers */}
      <CommunityNotesLayer
        notes={communityNotes}
        onDelete={onDeleteNote ?? (() => Promise.resolve({ success: false }))}
        onVote={onVoteNote ?? (() => Promise.resolve({ success: false }))}
      />

      {/* Safety heatmap overlay — red→amber→green via HeatmapLayer (Phase 3) */}
      <SafetyHeatmapLayer
        places={places}
        hazardNotes={hazardNotes}
        visible={showHeatmap}
      />

      {/* Locate Me FAB */}
      <button
        id="safecity-locate-btn"
        aria-label="Center map on my location"
        onClick={handleLocateMe}
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
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(16, 185, 129, 0.2)",
          transition: "all 0.2s ease",
          zIndex: 10,
        }}
        title="Locate Me"
      >
        🎯
      </button>
    </>
  );
}

// ── Root MapView exported to MapContainer ─────────────────────────────────────
export default function MapView(props: MapViewProps) {
  const { userLocation, onBoundsChange } = props;

  // Emit initial bounds before any camera event fires
  const emittedInitial = useRef(false);

  const handleCameraChanged = useCallback(
    (ev: MapCameraChangedEvent) => {
      if (!onBoundsChange) return;
      const b = ev.detail.bounds;
      if (!b) return;
      onBoundsChange({
        minLat: b.south,
        maxLat: b.north,
        minLng: b.west,
        maxLng: b.east,
      });
    },
    [onBoundsChange]
  );

  // Emit a default bounding box immediately so dependent hooks initialise
  useEffect(() => {
    if (emittedInitial.current || !onBoundsChange) return;
    emittedInitial.current = true;
    const DELTA = 0.05;
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
      }}
    >
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        defaultCenter={{ lat: userLocation.lat, lng: userLocation.lng }}
        defaultZoom={DELHI_NCR_MAP_CONFIG.defaultZoom}
        minZoom={DELHI_NCR_MAP_CONFIG.minZoom}
        maxZoom={DELHI_NCR_MAP_CONFIG.maxZoom}
        onCameraChanged={handleCameraChanged}
        gestureHandling="greedy"
        disableDefaultUI={true}
        style={{ width: "100%", height: "100%" }}
        colorScheme="DARK"
      >
        <MapInner {...props} />
      </Map>
    </div>
  );
}
