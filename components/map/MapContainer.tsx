"use client";

import dynamic from "next/dynamic";
import { LatLng } from "@/types/map";
import { SafetyPlace } from "@/types/place";
import { LocationNote } from "@/types/note";

// Sleek dark loading skeleton displayed during SSR and client Leaflet module resolution
function MapLoadingSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0a0d14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
          animation: "glow-pulse 2s infinite ease-in-out",
        }}
      />

      {/* Radar ripple indicator */}
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "2px solid #10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "1.5px solid rgba(16, 185, 129, 0.6)",
            animation: "pulse-radar 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
          }}
        />
        <span style={{ fontSize: "24px" }}>🗺️</span>
      </div>

      <div style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9", letterSpacing: "0.5px" }}>
        Loading SafeCity Map...
      </div>
      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
        Connecting to Delhi NCR infrastructure
      </div>
    </div>
  );
}

// Dynamically import MapView strictly on the client (Leaflet requires window and document)
const DynamicMapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

interface MapContainerProps {
  userLocation: LatLng;
  accuracy?: number | null;
  isSimulated?: boolean;
  places: SafetyPlace[];
  selectedPlace?: SafetyPlace | null;
  onSelectPlace?: (place: SafetyPlace) => void;
  onRequestLocation?: () => void;
  showHeatmap?: boolean;
  hazardNotes?: LocationNote[];
}

export default function MapContainer(props: MapContainerProps) {
  return <DynamicMapView {...props} />;
}
