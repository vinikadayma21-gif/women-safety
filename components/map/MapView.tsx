"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { LatLng, DELHI_NCR_MAP_CONFIG } from "@/types/map";
import { SafetyPlace } from "@/types/place";
import UserLocationMarker from "./UserLocationMarker";
import PlaceMarkersLayer from "./PlaceMarkersLayer";
import SafetyHeatmapLayer from "./SafetyHeatmapLayer";
import CommunityNotesLayer from "./CommunityNotesLayer";
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
  /** Whether to show the safety heatmap influence circles */
  showHeatmap?: boolean;
  /** Active hazard notes to display as warning circles on the heatmap */
  hazardNotes?: LocationNote[];
  /** Community alert + private pin note markers to render */
  notes?: NoteWithMeta[];
  /** Fires whenever the visible map bounding box changes (used to query viewport-scoped notes) */
  onBoundsChange?: (bounds: MapBounds) => void;
  onDeleteNote?: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  onVoteNote?: (noteId: string, isUpvote: boolean) => Promise<{ success: boolean; error?: string }>;
}

/** Controller to fly the map camera smoothly to new coordinates */
function CameraController({
  target,
  zoom,
}: {
  target: LatLng | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], zoom ?? map.getZoom(), {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [target, zoom, map]);

  return null;
}

/** Fires onBoundsChange whenever the map viewport changes */
function BoundsWatcher({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: MapBounds) => void;
}) {
  const reportBounds = useCallback(
    (map: ReturnType<typeof useMap>) => {
      if (!onBoundsChange) return;
      const b = map.getBounds();
      onBoundsChange({
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      });
    },
    [onBoundsChange]
  );

  const map = useMapEvents({
    moveend: () => reportBounds(map),
    zoomend: () => reportBounds(map),
    load:    () => reportBounds(map),
  });

  // Fire once on initial mount so notes load immediately
  useEffect(() => {
    reportBounds(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function MapView({
  userLocation,
  accuracy,
  isSimulated = false,
  places,
  selectedPlace,
  onSelectPlace,
  onRequestLocation,
  showHeatmap = true,
  hazardNotes = [],
  notes = [],
  onBoundsChange,
  onDeleteNote,
  onVoteNote,
}: MapViewProps) {
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const [targetZoom, setTargetZoom] = useState<number | undefined>(undefined);

  // Recenter to user's location
  const handleLocateMe = useCallback(() => {
    onRequestLocation?.();
    setFlyTarget({ ...userLocation });
    setTargetZoom(15);
  }, [onRequestLocation, userLocation]);

  // When a place is selected from outside (e.g. bottom sheet), fly to it
  useEffect(() => {
    if (selectedPlace) {
      setFlyTarget({ lat: selectedPlace.latitude, lng: selectedPlace.longitude });
      setTargetZoom(16);
    }
  }, [selectedPlace]);

  return (
    <div
      id="safecity-map-root"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#0a0d14",
      }}
    >
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={DELHI_NCR_MAP_CONFIG.defaultZoom}
        minZoom={DELHI_NCR_MAP_CONFIG.minZoom}
        maxZoom={DELHI_NCR_MAP_CONFIG.maxZoom}
        zoomControl={false} // We provide custom styled high-contrast zoom controls
        style={{ width: "100%", height: "100%", background: "#0a0d14" }}
      >
        {/* CartoDB Dark Matter tiles */}
        <TileLayer
          url={DELHI_NCR_MAP_CONFIG.tileLayer.url}
          attribution={DELHI_NCR_MAP_CONFIG.tileLayer.attribution}
          maxZoom={DELHI_NCR_MAP_CONFIG.tileLayer.maxZoom}
          subdomains={["a", "b", "c", "d"]}
        />

        {/* Camera animation controller */}
        <CameraController target={flyTarget} zoom={targetZoom} />

        {/* Viewport bounds watcher — feeds useLocationNotes hook */}
        <BoundsWatcher onBoundsChange={onBoundsChange} />

        {/* Live commuter location marker */}
        <UserLocationMarker
          position={userLocation}
          accuracy={accuracy}
          isSimulated={isSimulated}
        />

        {/* Safety influence heatmap circles */}
        <SafetyHeatmapLayer
          places={places}
          hazardNotes={hazardNotes}
          visible={showHeatmap}
        />

        {/* Verified Delhi NCR safe places */}
        <PlaceMarkersLayer
          places={places}
          onSelectPlace={onSelectPlace}
        />

        {/* Community alerts + private pin markers */}
        {notes.length > 0 && onDeleteNote && onVoteNote && (
          <CommunityNotesLayer
            notes={notes}
            onDelete={onDeleteNote}
            onVote={onVoteNote}
          />
        )}
      </MapContainer>

      {/* ── Floating Map Quick Actions (Locate Me & Zoom) ── */}
      <div
        id="safecity-map-controls"
        style={{
          position: "absolute",
          right: "16px",
          bottom: "100px", // clearance above bottom drawer HUD
          zIndex: 800,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Locate Me button */}
        <button
          id="safecity-locate-btn"
          aria-label="Center map on my location"
          onClick={handleLocateMe}
          style={{
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
    </div>
  );
}
