"use client";

// =======================================================================
// PlaceMarkersLayer.tsx — Phase 1 stub (PLANv2)
// Leaflet removed. Will be replaced with AdvancedMarker + InfoWindow
// from @vis.gl/react-google-maps in Phase 2.
// =======================================================================

import { SafetyPlace } from "@/types/place";

interface PlaceMarkersLayerProps {
  places: SafetyPlace[];
  onSelectPlace?: (place: SafetyPlace) => void;
}

// No-op — Phase 2 will render Google AdvancedMarkers
export default function PlaceMarkersLayer(_props: PlaceMarkersLayerProps) {
  return null;
}
