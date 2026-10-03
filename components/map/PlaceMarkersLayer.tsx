"use client";

// =======================================================================
// PlaceMarkersLayer.tsx — Phase 2 (PLANv2)
// Replaces the Phase 1 no-op stub. Renders an <AdvancedMarker> + <InfoWindow>
// for every SafetyPlace in the visible viewport using @vis.gl/react-google-maps.
//
// Custom SVG pin icons are drawn inside the AdvancedMarker's children so
// the visual appearance is identical to the original Leaflet markers.
// =======================================================================

import { useState, useCallback } from "react";
import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { SafetyPlace, PLACE_CATEGORY_META } from "@/types/place";

interface PlaceMarkersLayerProps {
  places: SafetyPlace[];
  onSelectPlace?: (place: SafetyPlace) => void;
}

// ── Custom pin rendered inside AdvancedMarker ─────────────────────────────────
function PlacePin({ place }: { place: SafetyPlace }) {
  const meta = PLACE_CATEGORY_META[place.category];
  const color = meta?.color ?? "#6366f1";

  const categoryIcons: Record<string, string> = {
    PINK_BOOTH: "💗",
    POLICE_STATION: "🚔",
    METRO_STATION: "🚇",
    HOSPITAL_247: "🏥",
    SAFE_HAVEN_STORE: "🏪",
  };
  const icon = categoryIcons[place.category] ?? "📍";

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Pin head */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50% 50% 50% 0",
          transform: "rotate(-45deg)",
          backgroundColor: color,
          border: "2.5px solid rgba(255,255,255,0.9)",
          boxShadow: `0 4px 14px ${color}80, 0 2px 6px rgba(0,0,0,0.6)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <span style={{ transform: "rotate(45deg)", lineHeight: 1 }}>{icon}</span>
      </div>
      {/* Pin tail */}
      <div
        style={{
          width: "4px",
          height: "8px",
          backgroundColor: color,
          borderRadius: "0 0 3px 3px",
          marginTop: "-1px",
        }}
      />
    </div>
  );
}

// ── InfoWindow content ────────────────────────────────────────────────────────
function PlaceInfoContent({ place }: { place: SafetyPlace }) {
  const meta = PLACE_CATEGORY_META[place.category];
  const color = meta?.color ?? "#6366f1";

  return (
    <div
      style={{
        minWidth: "200px",
        maxWidth: "260px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "4px 2px",
      }}
    >
      {/* Category badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "12px",
          backgroundColor: `${color}22`,
          border: `1px solid ${color}66`,
          marginBottom: "6px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: "700", color }}>
          {meta?.label ?? place.category}
        </span>
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: "700",
          color: "#1e293b",
          marginBottom: "4px",
          lineHeight: 1.3,
        }}
      >
        {place.name}
      </div>

      {/* Address */}
      {place.address && (
        <div
          style={{
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "6px",
            lineHeight: 1.4,
          }}
        >
          {place.address}
        </div>
      )}

      {/* Distance */}
      {place.distanceKm !== undefined && (
        <div
          style={{
            fontSize: "12px",
            color: "#10b981",
            fontWeight: "600",
            marginBottom: "4px",
          }}
        >
          📍 {place.distanceKm < 1
            ? `${Math.round(place.distanceKm * 1000)}m away`
            : `${place.distanceKm.toFixed(1)}km away`}
        </div>
      )}

      {/* Emergency number */}
      {meta?.emergencyNumber && (
        <a
          href={`tel:${meta.emergencyNumber}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "4px",
            padding: "4px 10px",
            borderRadius: "8px",
            backgroundColor: color,
            color: "#fff",
            fontSize: "12px",
            fontWeight: "700",
            textDecoration: "none",
            boxShadow: `0 2px 8px ${color}60`,
          }}
        >
          📞 {meta.emergencyNumber}
        </a>
      )}
    </div>
  );
}

// ── Main layer component ──────────────────────────────────────────────────────
export default function PlaceMarkersLayer({
  places,
  onSelectPlace,
}: PlaceMarkersLayerProps) {
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null);

  const handleMarkerClick = useCallback(
    (place: SafetyPlace) => {
      setOpenPlaceId((prev) => (prev === place.id ? null : place.id));
      onSelectPlace?.(place);
    },
    [onSelectPlace]
  );

  const handleInfoClose = useCallback(() => {
    setOpenPlaceId(null);
  }, []);

  return (
    <>
      {places.map((place, idx) => (
        <AdvancedMarker
          key={`place-${place.id || place.name}-${place.latitude}-${place.longitude}-${idx}`}
          position={{ lat: place.latitude, lng: place.longitude }}
          onClick={() => handleMarkerClick(place)}
          zIndex={openPlaceId === place.id ? 900 : 500}
          title={place.name}
        >
          <PlacePin place={place} />
        </AdvancedMarker>
      ))}

      {/* InfoWindow for the currently open marker */}
      {openPlaceId && (() => {
        const place = places.find((p) => p.id === openPlaceId);
        if (!place) return null;
        return (
          <InfoWindow
            position={{ lat: place.latitude, lng: place.longitude }}
            onCloseClick={handleInfoClose}
            pixelOffset={[0, -48]}
          >
            <PlaceInfoContent place={place} />
          </InfoWindow>
        );
      })()}
    </>
  );
}
