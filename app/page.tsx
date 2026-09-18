"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyPlaces } from "@/hooks/useNearbyPlaces";
import { useSafetyScore } from "@/hooks/useSafetyScore";
import { useLocationNotes, MapBounds } from "@/hooks/useLocationNotes";
import { FilterCategory } from "@/components/map/FilterChipsBar";
import { SafetyPlace, PLACE_CATEGORY_META } from "@/types/place";
import { formatDistance } from "@/lib/haversine";

// Dynamic imports to ensure client-side rendering with zero SSR window/document issues
const TopAppBar = dynamic(() => import("@/components/hud/TopAppBar"), { ssr: false });
const FilterChipsBar = dynamic(() => import("@/components/map/FilterChipsBar"), { ssr: false });
const MapContainer = dynamic(() => import("@/components/map/MapContainer"), { ssr: false });
const ZoneSafetyBadge = dynamic(() => import("@/components/hud/ZoneSafetyBadge"), { ssr: false });
const CreateNoteDialog = dynamic(() => import("@/components/notes/CreateNoteDialog"), { ssr: false });

export default function SafeCityMapPage() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const [selectedPlace, setSelectedPlace] = useState<SafetyPlace | null>(null);
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [showHeatmap] = useState<boolean>(true); // Heatmap is always on by default
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState<boolean>(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Default drop-pin coordinate: map center (Delhi). Overwritten by the actual map bounds center.
  const dropPinLat = mapBounds ? (mapBounds.minLat + mapBounds.maxLat) / 2 : 28.6139;
  const dropPinLng = mapBounds ? (mapBounds.minLng + mapBounds.maxLng) / 2 : 77.2090;

  // 1. Live commuter GPS tracking
  const {
    location,
    accuracy,
    isSimulated,
    isLoading: isGpsLoading,
    permissionStatus,
    requestLocation,
  } = useGeolocation();

  // 2. Fetch nearby safe spots within 8km radius based on user location
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

  // 3. Fetch real-time WSI safety score for user's current position
  const {
    score: safetyScore,
    isLoading: isScoreLoading,
    error: scoreError,
  } = useSafetyScore({
    lat: location.lat,
    lng: location.lng,
    enabled: !isGpsLoading,
  });

  // 4. Fetch viewport-scoped community notes and private pins
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

  // Stable callbacks to avoid re-creating map layers on each render
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

  // Current active spotlight place: explicitly tapped place or closest nearby safe place
  const activeSpotlight = useMemo(() => {
    return selectedPlace || nearestPlace;
  }, [selectedPlace, nearestPlace]);

  // Spotlight category styling
  const spotlightMeta = activeSpotlight
    ? PLACE_CATEGORY_META[activeSpotlight.category] || {
        label: "Safe Spot",
        color: "#10b981",
      }
    : null;

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
      {/* ── 1. Top Navigation Bar with Clerk Auth ── */}
      <TopAppBar />

      {/* ── 2. Top Filter Chips Bar (Floating below TopAppBar) ── */}
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

      {/* ── 3. Full-Screen Interactive Leaflet Map Canvas ── */}
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
            setIsHudCollapsed(false);
          }}
          onRequestLocation={requestLocation}
        />
      </main>

      {/* ── 4. Floating GPS & Status Pill (Top-Left under filters) ── */}
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

      {/* ── 5. Zone Safety Score Badge ── */}
      <ZoneSafetyBadge
        score={safetyScore}
        isLoading={isScoreLoading}
        error={scoreError}
      />

      {/* ── 6. Floating Add Note FAB ── */}
      <button
        id="safecity-add-note-fab"
        aria-label="Add a community alert or private note"
        onClick={() => setIsNoteDialogOpen(true)}
        style={{
          position: "fixed",
          bottom: activeSpotlight ? "170px" : "24px",
          right: "16px",
          zIndex: 910,
          width: "52px",
          height: "52px",
          borderRadius: "16px",
          backgroundColor: "#ef4444",
          border: "none",
          color: "#fff",
          fontSize: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(239,68,68,0.5), 0 0 0 1px rgba(239,68,68,0.3)",
          transition: "bottom 0.25s cubic-bezier(0.33,1,0.68,1), transform 0.15s ease",
        }}
        title="Add Note or Alert"
      >
        ＋
      </button>

      {/* ── 6. Bottom Safe Spot HUD & Emergency Action Drawer ── */}
      {activeSpotlight && (
        <aside
          id="safecity-bottom-hud"
          aria-label="Nearest Safe Infrastructure"
          style={{
            position: "fixed",
            bottom: "16px",
            left: "16px",
            right: "16px",
            maxWidth: "500px",
            margin: "0 auto",
            zIndex: 900,
            backgroundColor: "rgba(20, 25, 35, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${spotlightMeta?.color ? `${spotlightMeta.color}40` : "rgba(255, 255, 255, 0.12)"}`,
            borderRadius: "20px",
            padding: isHudCollapsed ? "12px 16px" : "16px 20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 0, 0, 0.5)",
            transition: "all 0.25s cubic-bezier(0.33, 1, 0.68, 1)",
          }}
        >
          {/* Header Row: Category Badge + Distance + Collapse Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: isHudCollapsed ? 0 : "10px",
              cursor: "pointer",
            }}
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  color: spotlightMeta?.color || "#10b981",
                  backgroundColor: `${spotlightMeta?.color || "#10b981"}20`,
                  border: `1px solid ${spotlightMeta?.color || "#10b981"}50`,
                  padding: "3px 9px",
                  borderRadius: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {selectedPlace ? "Selected Place" : "Nearest Safe Haven"}
              </span>

              {typeof activeSpotlight.distanceKm === "number" && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  📍 {formatDistance(activeSpotlight.distanceKm)}
                </span>
              )}
            </div>

            {/* Minimize / expand arrow button */}
            <button
              aria-label={isHudCollapsed ? "Expand HUD" : "Collapse HUD"}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "14px",
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              {isHudCollapsed ? "▲" : "▼"}
            </button>
          </div>

          {/* Place Name and details */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: isHudCollapsed ? 0 : "8px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: isHudCollapsed ? "14px" : "16px",
                  fontWeight: "800",
                  color: "#f1f5f9",
                  lineHeight: "1.2",
                  margin: 0,
                  letterSpacing: "-0.2px",
                }}
              >
                {activeSpotlight.name}
              </h2>

              {!isHudCollapsed && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    lineHeight: "1.4",
                    marginTop: "4px",
                    marginBottom: 0,
                  }}
                >
                  {activeSpotlight.landmark ? (
                    <span style={{ color: "#cbd5e1", fontWeight: "600" }}>
                      {activeSpotlight.landmark} •{" "}
                    </span>
                  ) : null}
                  {activeSpotlight.address}
                </p>
              )}
            </div>
          </div>

          {/* Expanded Action Buttons (Direct Call, Turn-by-turn Navigation, Directory) */}
          {!isHudCollapsed && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: activeSpotlight.contactNumber ? "1fr 1fr" : "1fr",
                gap: "10px",
                marginTop: "14px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {activeSpotlight.contactNumber && (
                <a
                  href={`tel:${activeSpotlight.contactNumber}`}
                  id="safecity-hud-call-btn"
                  aria-label={`Call ${activeSpotlight.name}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    backgroundColor: spotlightMeta?.color || "#10b981",
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "13px",
                    textDecoration: "none",
                    boxShadow: `0 0 16px ${spotlightMeta?.color || "#10b981"}40`,
                    transition: "transform 0.15s ease",
                  }}
                >
                  <span>📞</span> Call ({activeSpotlight.contactNumber})
                </a>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeSpotlight.latitude},${activeSpotlight.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                id="safecity-hud-route-btn"
                aria-label="Get Turn-by-Turn Directions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "11px 16px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#f1f5f9",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "13px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <span>↗</span> Navigate
              </a>
            </div>
          )}

          {/* Quick SOS & Helpline Footer */}
          {!isHudCollapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "12px",
                paddingTop: "10px",
                borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                fontSize: "11px",
              }}
            >
              <Link
                href="/directory"
                style={{
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>📖</span> All Helplines Directory
              </Link>

              <a
                href="tel:112"
                style={{
                  color: "#ff2d55",
                  textDecoration: "none",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "rgba(255, 45, 85, 0.12)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                <span>🆘</span> SOS 112
              </a>
            </div>
          )}
        </aside>
      )}

      {/* ── 8. Create Note / Alert Dialog ── */}
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
