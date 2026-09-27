"use client";

// =======================================================================
// SafetyHeatmapLayer.tsx — Phase 1 stub (PLANv2)
// Leaflet removed. Will be replaced with google.maps.visualization.HeatmapLayer
// in Phase 3 via the useHeatmapGrid hook + /api/heatmap endpoint.
// =======================================================================

import { SafetyPlace } from "@/types/place";
import { LocationNote } from "@/types/note";

interface SafetyHeatmapLayerProps {
  places: SafetyPlace[];
  hazardNotes?: LocationNote[];
  visible: boolean;
}

// No-op — Phase 3 will render the Google Maps HeatmapLayer
export default function SafetyHeatmapLayer(_props: SafetyHeatmapLayerProps) {
  return null;
}
