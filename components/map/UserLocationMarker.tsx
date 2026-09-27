"use client";

// =======================================================================
// UserLocationMarker.tsx — Phase 1 stub (PLANv2)
// Leaflet removed. Will be replaced with AdvancedMarker in Phase 2.
// This stub is a no-op component so MapView can reference it without error.
// =======================================================================

import { LatLng } from "@/types/map";

interface UserLocationMarkerProps {
  position: LatLng;
  accuracy?: number | null;
  isSimulated?: boolean;
}

// No-op — rendering is handled directly in MapView stub
export default function UserLocationMarker(_props: UserLocationMarkerProps) {
  return null;
}
