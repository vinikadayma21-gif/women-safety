"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyPlaces } from "@/hooks/useNearbyPlaces";
import { useSafetyScore } from "@/hooks/useSafetyScore";
import { useLocationNotes, MapBounds } from "@/hooks/useLocationNotes";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { FilterCategory } from "@/components/map/FilterChipsBar";
import { SafetyPlace, PLACE_CATEGORY_META } from "@/types/place";

// Dynamic imports — all client-only components
const TopAppBar = dynamic(() => import("@/components/hud/TopAppBar"), { ssr: false });
const FilterChipsBar = dynamic(() => import("@/components/map/FilterChipsBar"), { ssr: false });
const MapContainer = dynamic(() => import("@/components/map/MapContainer"), { ssr: false });
const ZoneSafetyBadge = dynamic(() => import("@/components/hud/ZoneSafetyBadge"), { ssr: false });
const CreateNoteDialog = dynamic(() => import("@/components/notes/CreateNoteDialog"), { ssr: false });
const BottomSheetHUD = dynamic(() => import("@/components/hud/BottomSheetHUD"), { ssr: false });
const QuickActionBar = dynamic(() => import("@/components/hud/QuickActionBar"), { ssr: false });
const StealthDisguiseModal = dynamic(() => import("@/components/hud/StealthDisguiseModal"), { ssr: false });

export default function SafeCityMapPage() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const [selectedPlace, setSelectedPlace] = useState<SafetyPlace | null>(null);
  const [showHeatmap] = useState<boolean>(true);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState<boolean>(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [isStealthActive, setIsStealthActive] = useState<boolean>(false);

  // Offline sync: seeds helplines into IndexedDB on first load
  const { isOnline } = useOfflineSync();

  // Default drop-pin coordinate: map center (Delhi). Overwritten by the actual map bounds center.
  const dropPinLat = mapBounds ? (mapBounds.minLat + mapBounds.maxLat) / 2 : 28.6139;
  const dropPinLng = mapBounds ? (mapBounds.minLng + mapBounds.maxLng) / 2 : 77.209;

  // 1. Live commuter GPS tracking
  const {
    location,
    accuracy,
    isSimulated,
    isLoading: isGpsLoading,
    requestLocation,
  } = useGeolocation();

  // 2. Fetch nearby safe spots within 8 km radius
  const {
    places,
    nearestPlace,
    isLoading: isPlacesLoading,
  } = useNearbyPlaces({
    lat: location.lat,
    lng: location.lng,
    radiusKm: 8.0,
    category: activeCategory === "ALL" ? undefined : activeCategory,
  });

  // 3. Real-time WSI safety score for user position
  const {
    score: safetyScore,
    isLoading: isScoreLoading,
    error: scoreError,
  } = useSafetyScore({
    lat: location.lat,
    lng: location.lng,
    enabled: !isGpsLoading,
  });

  // 4. Viewport-scoped community notes and private pins
  const {
    notes,
    communityNotes,
    createNote,
    deleteNote,
    voteOnNote,
  } = useLocationNotes({
    bounds: mapBounds,
    enabled: true,
  });

  // Stable callbacks
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  const handleDeleteNote = useCallback(
    (noteId: string) => deleteNote(noteId),
    [deleteNote]
  );

  const handleVoteNote = useCallback(
    (noteId: string, isUpvote: boolean) => voteOnNote(noteId, isUpvote),
    [voteOnNote]
  );

  // Active spotlight: user-selected place or closest nearby safe place
  const activeSpotlight = useMemo(() => {
    return selectedPlace || nearestPlace;
  }, [selectedPlace, nearestPlace]);

  const isUserSelected = !!selectedPlace;

  const openNoteDialog = useCallback(() => setIsNoteDialogOpen(true), []);

  return (
    <div
      id="safecity-app-viewport"
      style={{
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#0a0d14",
      }}
    >
      {/* ── 1. Stealth Calculator Disguise (Phase 7) ── */}
      <StealthDisguiseModal
        isActive={isStealthActive}
        onExit={() => setIsStealthActive(false)}
      />

      {/* ── 2. Top Navigation Bar with triple-tap stealth trigger ── */}
      <TopAppBar onLogoBrandTripleTap={() => setIsStealthActive(true)} />

      {/* ── 3. Filter Chips Bar (below TopAppBar) ── */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          zIndex: 850,
          backgroundColor: "rgba(10, 13, 20, 0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
        }}
      >
        <FilterChipsBar
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setSelectedPlace(null);
          }}
          places={places}
        />
      </div>

      {/* ── 4. Full-Screen Interactive Leaflet Map Canvas ── */}
      <main
        role="main"
        aria-label="SafeCity Delhi NCR Interactive Map"
        style={{
          width: "100%",
          height: "100%",
          paddingTop: "108px", // 60px TopAppBar + 48px FilterBar
          position: "relative",
        }}
      >
        <MapContainer
          userLocation={location}
          accuracy={accuracy}
          isSimulated={isSimulated}
          places={places}
          selectedPlace={selectedPlace}
          showHeatmap={showHeatmap}
          notes={activeCategory === "COMMUNITY_ALERTS" ? communityNotes : notes}
          onBoundsChange={handleBoundsChange}
          onDeleteNote={handleDeleteNote}
          onVoteNote={handleVoteNote}
          onSelectPlace={(place) => {
            setSelectedPlace(place);
          }}
          onRequestLocation={requestLocation}
        />
      </main>

      {/* ── 5. Floating GPS & Status Pill (Top-Left under filters) ── */}
      <div
        id="safecity-gps-pill"
        style={{
          position: "fixed",
          top: "116px",
          left: "16px",
          zIndex: 820,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "5px 10px",
          backgroundColor: "rgba(20, 25, 35, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "600",
          color: isSimulated ? "#f59e0b" : "#10b981",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: isSimulated ? "#f59e0b" : "#10b981",
            boxShadow: `0 0 8px ${isSimulated ? "#f59e0b" : "#10b981"}`,
          }}
        />
        <span>
          {isGpsLoading
            ? "Acquiring GPS..."
            : isSimulated
            ? "Central Delhi (Default)"
            : `GPS Active (±${Math.round(accuracy || 15)}m)`}
        </span>
      </div>

      {/* ── 6. Offline indicator (Top-Right) ── */}
      {!isOnline && (
        <div
          id="safecity-offline-pill"
          style={{
            position: "fixed",
            top: "116px",
            right: "16px",
            zIndex: 820,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#ef4444",
            backdropFilter: "blur(10px)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              boxShadow: "0 0 6px #ef4444",
            }}
          />
          Offline
        </div>
      )}

      {/* ── 7. Zone Safety Score Badge ── */}
      <ZoneSafetyBadge
        score={safetyScore}
        isLoading={isScoreLoading}
        error={scoreError}
      />

      {/* ── 8. Quick Action Bar (SOS, Share, Add Note) — Phase 7 ── */}
      <QuickActionBar
        latitude={location.lat}
        longitude={location.lng}
        onAddNote={openNoteDialog}
        isAboveHud={!!activeSpotlight}
      />

      {/* ── 9. Bottom Sheet HUD (Nearest Safe Place) — Phase 7 ── */}
      {activeSpotlight && (
        <BottomSheetHUD
          place={activeSpotlight}
          isUserSelected={isUserSelected}
          onDismiss={() => setSelectedPlace(null)}
          onDropNote={openNoteDialog}
        />
      )}

      {/* ── 10. Create Note / Alert Dialog ── */}
      <CreateNoteDialog
        isOpen={isNoteDialogOpen}
        latitude={dropPinLat}
        longitude={dropPinLng}
        onClose={() => setIsNoteDialogOpen(false)}
        onCreate={createNote}
      />
    </div>
  );
}
