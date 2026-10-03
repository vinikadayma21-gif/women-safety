"use client";

// =======================================================================
// UserLocationMarker.tsx — Phase 2 (PLANv2)
// Replaces the Leaflet CircleMarker with an <AdvancedMarker> from
// @vis.gl/react-google-maps that renders the same pulsing dot CSS.
//
// The "accuracy" radius halo is drawn as a semi-transparent circle
// rendered inside the AdvancedMarker's content div.
// =======================================================================

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { LatLng } from "@/types/map";

interface UserLocationMarkerProps {
  position: LatLng;
  accuracy?: number | null;
  isSimulated?: boolean;
}

export default function UserLocationMarker({
  position,
  isSimulated = false,
}: UserLocationMarkerProps) {
  const dotColor = isSimulated ? "#f59e0b" : "#10b981";
  const glowColor = isSimulated
    ? "rgba(245, 158, 11, 0.35)"
    : "rgba(16, 185, 129, 0.35)";

  return (
    <AdvancedMarker
      position={{ lat: position.lat, lng: position.lng }}
      zIndex={1000}
      title={isSimulated ? "Central Delhi (Simulated)" : "Your Location"}
    >
      {/* Outer pulsing ring */}
      <div
        style={{
          position: "relative",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Animated pulse halo */}
        <div
          style={{
            position: "absolute",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: glowColor,
            animation: "safecity-user-pulse 2s ease-out infinite",
          }}
        />
        {/* Static accuracy ring */}
        <div
          style={{
            position: "absolute",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: "transparent",
            border: `2px solid ${dotColor}`,
            opacity: 0.5,
          }}
        />
        {/* Core GPS dot */}
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            backgroundColor: dotColor,
            border: "2.5px solid #fff",
            boxShadow: `0 0 12px ${dotColor}, 0 2px 8px rgba(0,0,0,0.6)`,
            position: "relative",
            zIndex: 2,
          }}
        />
      </div>

      {/* CSS keyframes injected inline so the component is self-contained */}
      <style>{`
        @keyframes safecity-user-pulse {
          0%   { transform: scale(0.6); opacity: 0.8; }
          70%  { transform: scale(2.2); opacity: 0;   }
          100% { transform: scale(0.6); opacity: 0;   }
        }
      `}</style>
    </AdvancedMarker>
  );
}
