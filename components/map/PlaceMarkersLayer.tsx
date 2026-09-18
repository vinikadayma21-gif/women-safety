"use client";

import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SafetyPlace, PLACE_CATEGORY_META, PlaceCategory } from "@/types/place";
import { formatDistance } from "@/lib/haversine";

interface PlaceMarkersLayerProps {
  places: SafetyPlace[];
  onSelectPlace?: (place: SafetyPlace) => void;
}

// Category-specific marker icon generator with memoized cache
const iconCache = new Map<string, L.Icon | L.DivIcon>();

function getMarkerIcon(category: PlaceCategory): L.Icon | L.DivIcon {
  if (iconCache.has(category)) {
    return iconCache.get(category)!;
  }

  let icon: L.Icon | L.DivIcon;

  switch (category) {
    case "PINK_BOOTH":
      icon = L.icon({
        iconUrl: "/markers/marker-pink-booth.svg",
        iconSize: [36, 47],
        iconAnchor: [18, 47],
        popupAnchor: [0, -44],
        className: "safecity-marker-pink-booth",
      });
      break;
    case "POLICE_STATION":
      icon = L.icon({
        iconUrl: "/markers/marker-police.svg",
        iconSize: [36, 47],
        iconAnchor: [18, 47],
        popupAnchor: [0, -44],
        className: "safecity-marker-police",
      });
      break;
    case "METRO_STATION":
      icon = L.icon({
        iconUrl: "/markers/marker-metro.svg",
        iconSize: [36, 47],
        iconAnchor: [18, 47],
        popupAnchor: [0, -44],
        className: "safecity-marker-metro",
      });
      break;
    case "HOSPITAL_247":
      icon = L.icon({
        iconUrl: "/markers/marker-hospital.svg",
        iconSize: [36, 47],
        iconAnchor: [18, 47],
        popupAnchor: [0, -44],
        className: "safecity-marker-hospital",
      });
      break;
    case "SAFE_HAVEN_STORE":
    default:
      icon = L.divIcon({
        className: "safecity-marker-store",
        html: `
          <div style="width: 36px; height: 47px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" fill="none" width="36" height="47">
              <ellipse cx="20" cy="50" rx="8" ry="3" fill="rgba(0,0,0,0.35)"/>
              <path d="M20 2C12.268 2 6 8.268 6 16c0 10 14 34 14 34S34 26 34 16C34 8.268 27.732 2 20 2z" fill="#F59E0B" stroke="#FBBF24" stroke-width="1.5"/>
              <circle cx="20" cy="16" r="7" fill="white" opacity="0.95"/>
              <text x="20" y="20" font-size="10" text-anchor="middle" fill="#B45309" font-weight="bold">🏪</text>
            </svg>
          </div>
        `,
        iconSize: [36, 47],
        iconAnchor: [18, 47],
        popupAnchor: [0, -44],
      });
      break;
  }

  iconCache.set(category, icon);
  return icon;
}

export default function PlaceMarkersLayer({
  places,
  onSelectPlace,
}: PlaceMarkersLayerProps) {
  return (
    <>
      {places.map((place) => {
        const meta = PLACE_CATEGORY_META[place.category] || {
          label: "Safe Spot",
          color: "#10b981",
        };
        const icon = getMarkerIcon(place.category);

        return (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectPlace?.(place),
            }}
          >
            <Popup className="safecity-place-popup" maxWidth={320} minWidth={260}>
              <div style={{ padding: "4px 2px" }}>
                {/* Header with category badge & distance */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: meta.color,
                      backgroundColor: `${meta.color}1f`,
                      border: `1px solid ${meta.color}40`,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {meta.label}
                  </span>

                  {typeof place.distanceKm === "number" && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#10b981",
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        padding: "2px 6px",
                        borderRadius: "6px",
                      }}
                    >
                      📍 {formatDistance(place.distanceKm)}
                    </span>
                  )}
                </div>

                {/* Place Name */}
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#f1f5f9",
                    lineHeight: "1.3",
                    marginBottom: "6px",
                  }}
                >
                  {place.name}
                </h3>

                {/* Address & Landmark */}
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    lineHeight: "1.4",
                    marginBottom: "8px",
                  }}
                >
                  {place.landmark ? (
                    <>
                      <span style={{ color: "#cbd5e1", fontWeight: "600" }}>{place.landmark}</span>
                      <br />
                    </>
                  ) : null}
                  {place.address}
                </p>

                {/* 24x7 indicator */}
                {place.is24x7 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "#10b981",
                      marginBottom: "12px",
                      fontWeight: "600",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#10b981",
                        boxShadow: "0 0 6px #10b981",
                      }}
                    />
                    24/7 Verified & Guarded
                  </div>
                )}

                {/* Actions: Direct Call + Directions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  {place.contactNumber && (
                    <a
                      href={`tel:${place.contactNumber}`}
                      aria-label={`Call ${place.name}`}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 10px",
                        backgroundColor: meta.color,
                        color: "#ffffff",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        textDecoration: "none",
                        boxShadow: `0 0 10px ${meta.color}40`,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <span>📞</span> Call ({place.contactNumber})
                    </a>
                  )}

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Get Directions in Google Maps"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#f1f5f9",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    <span>↗</span> Route
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
