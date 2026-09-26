# SafeCity PLANv2 � Phase-Wise Upgrade Plan
## From: Leaflet + Seeded DB ? Google Maps + Real-World API Safety Scoring

> **Based on existing codebase audit at `d:\Safecity\women-safety`**
> Written: 2026-09-26

---

## Existing Codebase Inventory

### Keep As-Is (No Changes Needed)
| File | Reason |
|---|---|
| `app/layout.tsx` | Root layout with ClerkProvider is fine |
| `app/(auth)/` | Clerk sign-in/sign-up pages work |
| `app/directory/page.tsx` | Offline helplines page is complete |
| `app/api/webhooks/clerk/route.ts` | Clerk user sync is correct |
| `app/api/notes/route.ts` | Notes API is complete |
| `app/api/notes/[id]/route.ts` | Note CRUD is complete |
| `app/api/notes/[id]/vote/route.ts` | Voting system is complete |
| `lib/crypto.ts` | AES-256-GCM encryption is correct |
| `lib/haversine.ts` | Distance math � reused everywhere |
| `lib/prisma.ts` | Neon client � unchanged |
| `lib/offlineStorage.ts` | IndexedDB helper � unchanged |
| `lib/delhiHelplines.ts` | Static directory � unchanged |
| `hooks/useGeolocation.ts` | GPS tracking � unchanged |
| `hooks/useLocationNotes.ts` | Notes CRUD hook � unchanged |
| `hooks/useOfflineSync.ts` | Offline cache hook � unchanged |
| `components/notes/` (all 3 files) | Note dialogs � unchanged |
| `components/hud/StealthDisguiseModal.tsx` | Calculator disguise � unchanged |
| `components/hud/QuickActionBar.tsx` | SOS + share � unchanged |
| `middleware.ts` | Route guards � unchanged |
| `prisma/schema.prisma` | Needs 1 change only: remove SafetyPlace model |
| `types/` (all files) | Keep, extend as needed |

### Modify (Significant Changes)
| File | What Changes |
|---|---|
| `package.json` | Add @vis.gl/react-google-maps, @upstash/redis, ngeohash; remove leaflet, react-leaflet |
| `.env` | Add 4 new API keys |
| `app/page.tsx` | Remove Leaflet props, add Google Maps props |
| `app/api/safety-score/route.ts` | Add OSM + weather + Upstash cache |
| `app/api/places/nearby/route.ts` | Add Google Places as primary source |
| `lib/safetyScorer.ts` | Add weather + OSM lighting factors |
| `components/map/MapContainer.tsx` | Replace Leaflet dynamic import with Google Maps APIProvider |
| `components/map/MapView.tsx` | Replace MapContainer/TileLayer with Map from @vis.gl |
| `components/map/SafetyHeatmapLayer.tsx` | Replace Leaflet circles with Google HeatmapLayer |
| `components/map/PlaceMarkersLayer.tsx` | Replace L.marker with AdvancedMarker |
| `components/map/CommunityNotesLayer.tsx` | Replace Leaflet markers with Google AdvancedMarker |
| `components/map/UserLocationMarker.tsx` | Replace Leaflet circle with Google AdvancedMarker |
| `components/hud/BottomSheetHUD.tsx` | Add Google Distance Matrix walk time |
| `components/hud/ZoneSafetyBadge.tsx` | Add score breakdown drawer |
| `hooks/useNearbyPlaces.ts` | Consume new merged Places API response |
| `hooks/useSafetyScore.ts` | Consume new enriched score response |

### Create From Scratch
| File | Purpose |
|---|---|
| `lib/google-maps.ts` | Server-side Google Maps API client helper |
| `lib/overpass.ts` | OSM Overpass query builder (lamps, CCTV) |
| `lib/openweather.ts` | OpenWeatherMap API client |
| `lib/upstash.ts` | Redis cache get/set/invalidate wrapper |
| `app/api/heatmap/route.ts` | Geohash grid score endpoint for HeatmapLayer |
| `app/api/walk-time/route.ts` | Distance Matrix walk time endpoint |
| `hooks/useHeatmapGrid.ts` | Fetches heatmap grid on map move |
| `components/map/SafeRoutePolyline.tsx` | Draw walking route on map |
| `components/hud/ScoreBreakdownDrawer.tsx` | Expandable factor breakdown UI |

---

## Phase 0: Get API Keys First (No Code)

Before writing any code, create these accounts:

| Service | URL | Action |
|---|---|---|
| Google Cloud Console | console.cloud.google.com | Create project, enable 5 APIs, create 2 keys |
| Upstash | console.upstash.com | Create Redis DB, copy REST URL + Token |
| OpenWeatherMap | openweathermap.org/api | Sign up, copy free API key |

### Enable in Google Cloud Console:
- Maps JavaScript API
- Places API (New)
- Distance Matrix API
- Geocoding API
- Maps Static API

### Create 2 API Keys:
1. Browser key � restrict to HTTP referrers: localhost:3000/*, yourdomain.com/*
2. Server key � restrict to IP or API-level (Places, Distance Matrix, Geocoding)

### Create Dark Map Style:
- Google Maps Platform > Map Styles > Create Map ID > Select Dark theme
- Copy the Map ID to .env as NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID

---

## Phase 1: Dependencies + Environment Setup
**Time: 30 minutes | Risk: Low**

### 1.1 Add to .env
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID="your-map-id"
GOOGLE_MAPS_SERVER_KEY="AIza..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="AXxx..."
OPENWEATHER_API_KEY="your-key-here"
```

### 1.2 Install / Uninstall Packages
```bash
npm install @vis.gl/react-google-maps @upstash/redis ngeohash
npm install -D @types/ngeohash
npm uninstall leaflet react-leaflet @types/leaflet
```

### 1.3 Update prisma/schema.prisma
Remove SafetyPlace model and PlaceCategory enum (POIs come from Google Places now, not DB).
Keep: User, LocationNote, NoteVote � unchanged.

```bash
npx prisma migrate dev --name remove_safety_place_use_google_api
npx prisma generate
```

### 1.4 Create lib/upstash.ts
Redis cache wrapper with getCached() and setCached() � silent-fail on errors.

### 1.5 Create lib/google-maps.ts
Server-side helper with:
- fetchNearbyPlaces(lat, lng, type, radius) � calls Google Places API
- getWalkingTime(fromLat, fromLng, toLat, toLng) � calls Distance Matrix API

### 1.6 Create lib/openweather.ts
Returns WeatherData { condition, visibility, multiplier } where multiplier is 0.80�1.00
applied to the safety score (rain/fog lowers score).

### 1.7 Create lib/overpass.ts
OSM Overpass query builder (free, no API key):
- getLightingScore(lat, lng) � counts street lamps within 400m ? 0 to 1.5 pts
- getCCTVScore(lat, lng) � counts surveillance cameras within 300m ? 0 to 0.5 pts

Done when: npm run dev compiles with 0 errors after removing Leaflet.

---

## Phase 2: Replace Map Engine (Leaflet ? Google Maps)
**Time: 2�3 hours | Risk: Medium**

### 2.1 Rewrite components/map/MapContainer.tsx
Wrap with APIProvider from @vis.gl/react-google-maps.
Pass libraries={["visualization"]} for HeatmapLayer support.
Keep the MapLoadingSkeleton component � it works fine.

### 2.2 Rewrite components/map/MapView.tsx
Replace <MapContainer> + <TileLayer> (Leaflet) with <Map> from @vis.gl/react-google-maps.
- defaultCenter: { lat: 28.6139, lng: 77.2090 }
- defaultZoom: 14
- mapId: NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID (dark style)
- onCameraChanged event replaces Leaflet moveend � updates mapBounds in page.tsx

### 2.3 Rewrite components/map/UserLocationMarker.tsx
Replace Leaflet CircleMarker with <AdvancedMarker> containing the existing pulsing dot CSS.

### 2.4 Rewrite components/map/PlaceMarkersLayer.tsx
Replace L.marker with <AdvancedMarker> + <InfoWindow>.
Custom SVG pin icons stay the same � just rendered inside AdvancedMarker children.

### 2.5 Rewrite components/map/CommunityNotesLayer.tsx
Same pattern � swap L.marker for <AdvancedMarker>.

Done when: Map renders on localhost:3000 with Google dark tiles, GPS dot shows, place markers clickable.

---

## Phase 3: Replace Safety Heatmap
**Time: 1�2 hours | Risk: Low**

### 3.1 Create app/api/heatmap/route.ts
Generates a 5x5 grid of score points for the visible map viewport.
Uses existing computeHeatmapScore() from lib/safetyScorer.ts � no changes needed there.
Results cached in Upstash Redis with 15-min TTL.

### 3.2 Rewrite components/map/SafetyHeatmapLayer.tsx
Replace Leaflet Circle overlays with google.maps.visualization.HeatmapLayer.
Gradient: red (unsafe) ? amber ? green (safe).
Radius: 80px per point.

### 3.3 Create hooks/useHeatmapGrid.ts
Listens to Google Maps "idle" event.
Fetches /api/heatmap with current map bounds on each pan/zoom.

Done when: A red?amber?green heatmap renders across Delhi neighborhoods.

---

## Phase 4: Upgrade Safety Scoring Engine (WSI 2.0)
**Time: 2�3 hours | Risk: Low (additive changes only)**

### 4.1 Upgrade app/api/safety-score/route.ts
Add Upstash Redis cache (15-min TTL per lat/lng/hour combination).
Add fan-out parallel fetch using Promise.allSettled():
  - Google Places nearby (police, hospital, metro) � replaces Neon SafetyPlace query
  - getLightingScore() from lib/overpass.ts
  - getCCTVScore() from lib/overpass.ts
  - fetchWeather() from lib/openweather.ts
  - Neon activeHazards query � keep as-is

Apply weather multiplier on top of existing computeSafetyScore() result.
Add new fields to response: weatherCondition, weatherMultiplier, lightingScore, cctvScore.

### 4.2 Upgrade app/api/places/nearby/route.ts
Replace Neon prisma.safetyPlace.findMany() with parallel Google Places API calls:
- fetchNearbyPlaces(lat, lng, "police", radius)
- fetchNearbyPlaces(lat, lng, "hospital", radius)
- fetchNearbyPlaces(lat, lng, "subway_station", radius)
- fetchNearbyPlaces(lat, lng, "pharmacy", radius)

Merge results, add distanceKm via haversineDistance(), sort nearest first.
Cache result in Upstash Redis with 6-hour TTL.

Done when: GET /api/safety-score?lat=28.6139&lng=77.2090 returns JSON with weatherCondition, lightingScore, cctvScore fields.

---

## Phase 5: Walk Times (Google Distance Matrix)
**Time: 1 hour | Risk: Low**

### 5.1 Create app/api/walk-time/route.ts
Calls getWalkingTime() from lib/google-maps.ts.
Returns { distanceText: "320 m", durationText: "4 mins" }.

### 5.2 Update components/hud/BottomSheetHUD.tsx
When a place is selected, fetch walk time from /api/walk-time.
Show under place name: "4 min walk (320m)".

Done when: Tapping any place marker shows walking time in the bottom sheet.

---

## Phase 6: Score Breakdown Drawer
**Time: 1�1.5 hours | Risk: Low (UI only)**

### 6.1 Create components/hud/ScoreBreakdownDrawer.tsx
Slide-up drawer showing WHY an area scored X/10:
- Infrastructure anchors (police, metro) with distances and points
- Street lighting score
- CCTV score
- Community hazard reports (penalties)
- Weather multiplier
- Time-of-day multiplier

### 6.2 Update components/hud/ZoneSafetyBadge.tsx
Wire badge tap to open ScoreBreakdownDrawer.
Pass the enriched score object (with all factor fields) from useSafetyScore hook.

Done when: Tapping the safety badge slides up a detailed breakdown drawer.

---

## Phase 7: Type Updates + Polish
**Time: 1�2 hours | Risk: Low**

### 7.1 Update types/place.ts
Add GooglePlace type. Update SafetyPlace to match new API response shape.
Remove fields that no longer exist (createdAt, region, landmark from old DB model).
Add new fields: isOpen, placeId.

### 7.2 Update hooks/useNearbyPlaces.ts
Response shape from /api/places/nearby changed slightly.
Update type mapping to new GooglePlace-based response.

### 7.3 Update hooks/useSafetyScore.ts
Consume new fields from enriched score: weatherCondition, lightingScore, cctvScore.
Pass these to ZoneSafetyBadge for the breakdown drawer.

### 7.4 Run Full Feature Checklist
- Map loads with dark Google Maps tiles
- User GPS dot appears and pulses
- Police/hospital/metro markers load from Google Places API
- Clicking marker shows InfoWindow + walk time
- Safety score badge shows correct score
- Tapping badge shows score breakdown drawer
- Red-to-green heatmap renders across viewport
- Report Hazard dialog opens and saves to Neon DB
- Community reports appear as red markers
- Upvote/downvote on reports works
- Private notes (encrypted) save and visible to author only
- SOS 112 button opens phone dialer
- WhatsApp share sends location link
- Triple-tap logo activates Stealth Calculator
- Offline mode shows cached emergency helplines
- Clerk phone OTP sign-in works
- Clerk Google OAuth sign-in works

---

## Phase 8: Deployment
**Time: 30 minutes | Risk: Low**

### 8.1 Add to Vercel Environment Variables
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
GOOGLE_MAPS_SERVER_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
OPENWEATHER_API_KEY

Keep existing: DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_CLERK_*, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET

### 8.2 Update Google API Key Restrictions
Browser key: add https://yourapp.vercel.app/* to HTTP referrers
Server key: restrict to Places API, Distance Matrix API, Geocoding API only

### 8.3 Set Billing Alert
Google Cloud Console > Billing > Budgets & Alerts
Create budget: $5/month with email alert at 50%

### 8.4 Deploy
```bash
git add .
git commit -m "feat: Google Maps + multi-API safety scoring (PLANv2)"
git push origin main
```
Vercel auto-deploys on push to main.

Done when: https://yourapp.vercel.app loads on mobile, GPS works, score appears within 3 seconds.

---

## Phase Summary

| Phase | Deliverable | Time |
|---|---|---|
| Phase 0 | All API keys obtained | 1 hr |
| Phase 1 | New packages, Redis/Weather/OSM clients, schema cleaned | 30 min |
| Phase 2 | Google Maps renders with dark tiles, markers, user dot | 2�3 hrs |
| Phase 3 | Red-to-green heatmap across Delhi viewport | 1�2 hrs |
| Phase 4 | WSI score from Google Places + OSM lamps + weather | 2�3 hrs |
| Phase 5 | Walk time shown in bottom sheet for nearest place | 1 hr |
| Phase 6 | Score breakdown drawer explains the score | 1�1.5 hrs |
| Phase 7 | Types updated, all features tested end-to-end | 1�2 hrs |
| Phase 8 | Live on Vercel with correct API restrictions | 30 min |
| **TOTAL** | **Full upgrade: Leaflet to Google Maps + real data** | **~12�15 hrs** |

---

## File Change Summary

| Action | Count |
|---|---|
| Keep unchanged | 18 files |
| Modify | 16 files |
| Create new | 9 files |
| Delete | 0 files |
