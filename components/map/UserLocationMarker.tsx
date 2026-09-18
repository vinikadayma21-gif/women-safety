"use client";

import { useMemo } from "react";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { LatLng } from "@/types/map";

interface UserLocationMarkerProps {
  position: LatLng;
  accuracy?: number | null;
  isSimulated?: boolean;
}

export default function UserLocationMarker({
  position,
  accuracy,
  isSimulated = false,
}: UserLocationMarkerProps) {
  // Custom Leaflet DivIcon with pulsing radar waves
  const radarIcon = useMemo(() => {
    return L.divIcon({
      className: "safecity-radar-marker-container",
      html: `
        <div class="radar-wrapper" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div class="radar-pulse-outer" style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); animation: pulse-radar 2s cubic-bezier(0.2, 0.6, 0.4, 1) infinite;"></div>
          <div class="radar-pulse-inner" style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: pulse-radar 2s cubic-bezier(0.2, 0.6, 0.4, 1) 0.5s infinite;"></div>
          <div class="radar-core" style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #10b981;"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }, []);

  return (
    <>
      {/* Accuracy circle if accuracy is known and reasonable (< 500m) */}
      {accuracy && accuracy < 500 && (
        <Circle
          center={[position.lat, position.lng]}
          radius={accuracy}
          pathOptions={{
            color: "#10b981",
            fillColor: "#10b981",
            fillOpacity: 0.08,
            weight: 1,
            dashArray: "3 3",
          }}
        />
      )}

      <Marker position={[position.lat, position.lng]} icon={radarIcon}>
        <Popup className="safecity-user-popup">
          <div style={{ padding: "6px 4px", minWidth: "160px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px" }}>🎯</span>
              <strong style={{ fontSize: "13px", color: "#f1f5f9" }}>
                {isSimulated ? "Default Location" : "Your Live Position"}
              </strong>
            </div>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
              {isSimulated
                ? "Connaught Place (Central Delhi)"
                : `Accuracy: ±${Math.round(accuracy || 15)} meters`}
            </p>
            <div style={{ marginTop: "6px", fontSize: "10px", color: "#10b981", fontWeight: 600 }}>
              ● GPS Tracking Active
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
