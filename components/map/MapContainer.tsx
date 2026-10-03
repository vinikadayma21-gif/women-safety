"use client";

// =======================================================================
// MapContainer.tsx — Phase 2 (PLANv2)
// Wraps MapView with APIProvider from @vis.gl/react-google-maps so that
// every child (Map, AdvancedMarker, HeatmapLayer) can consume the Maps SDK.
//
// libraries=["visualization"] is required for HeatmapLayer (Phase 3).
// The component is still dynamically imported (ssr: false) because Google
// Maps uses window and document internally.
// =======================================================================

import dynamic from "next/dynamic";
import { APIProvider } from "@vis.gl/react-google-maps";
import { LatLng } from "@/types/map";
import { SafetyPlace } from "@/types/place";
import { LocationNote } from "@/types/note";
import { NoteWithMeta, MapBounds } from "@/hooks/useLocationNotes";

// Sleek dark loading skeleton displayed during SSR and client module resolution
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

// Dynamically import MapView strictly on the client
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
  notes?: NoteWithMeta[];
  onBoundsChange?: (bounds: MapBounds) => void;
  onDeleteNote?: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  onVoteNote?: (noteId: string, isUpvote: boolean) => Promise<{ success: boolean; error?: string }>;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function MapContainer(props: MapContainerProps) {
  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={["visualization"]}
    >
      <DynamicMapView {...props} />
    </APIProvider>
  );
}
