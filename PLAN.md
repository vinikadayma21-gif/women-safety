# SafeCity Delhi NCR: Phase-Wise Engineering Plan & Folder Structure
## Production-Grade Implementation Blueprint

---

## 1. Project Overview & Technology Stack

| Category | Technology | Purpose / Configuration |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14+ (App Router)** | Full-stack monolith: React 18 frontend, PWA shell, API routes. |
| **Language** | **TypeScript 5.x** | Strict end-to-end type safety. |
| **Styling** | **Tailwind CSS + Lucide Icons** | Mobile-first, dark mode default (OLED black `--bg: #0A0D14`). |
| **Mapping Engine**| **Leaflet.js + React-Leaflet** | Lightweight (~40KB), 100% free, CartoDB Dark Matter / OSM tiles. |
| **Database** | **Neon Serverless PostgreSQL** | Autoscaling Postgres with connection pooling (`@prisma/client`). |
| **ORM** | **Prisma ORM** | Type-safe schema, migrations, and automated query building. |
| **Authentication**| **Clerk (`@clerk/nextjs`)** | Passwordless SMS OTP, WhatsApp, Google OAuth, session cookies. |
| **Offline / PWA** | **next-pwa / Workbox + IndexedDB** | Service worker caching for tiles and Delhi emergency directory. |
| **Encryption** | **Web Crypto API (Client-side)** | AES-256-GCM for zero-knowledge private safety notes. |

---

## 2. Complete Folder & File Structure

```
d:\WomenSafety/
├── .env.example                       # Template for Clerk, Neon & Next.js environment keys
├── .env.local                         # Local environment variables (gitignored)
├── .gitignore                         # Node, Next.js, Prisma, and build artifact exclusions
├── package.json                       # Dependencies, scripts, and engine specifications
├── tsconfig.json                      # Strict TypeScript compiler options
├── next.config.mjs                    # Next.js configuration with PWA service worker wrapper
├── postcss.config.js                  # PostCSS plugin configuration for Tailwind CSS
├── tailwind.config.ts                 # Tailwind design tokens, colors, and night theme
│
├── prisma/
│   ├── schema.prisma                  # Prisma data models (User, SafetyPlace, LocationNote, NoteVote)
│   ├── migrations/                    # SQL migration history
│   └── seed.ts                        # Curated Delhi NCR seed script (Pink Booths, Metro, ERs)
│
├── public/
│   ├── favicon.ico                    # Favicon
│   ├── manifest.json                  # PWA Web App Manifest (standalone, icons, colors)
│   ├── icons/                         # PWA home screen icons (192x192, 512x512, maskable)
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon-maskable.png
│   └── markers/                       # Custom high-contrast SVG map pins
│       ├── marker-pink-booth.svg      # Delhi Police Pink Booths
│       ├── marker-police.svg          # Police Stations
│       ├── marker-metro.svg           # DMRC Metro Stations
│       ├── marker-hospital.svg        # 24/7 Hospitals
│       ├── marker-hazard.svg          # Community Alert / Broken Light
│       └── marker-private-lock.svg    # Encrypted Private Pin
│
├── src/
│   ├── middleware.ts                  # Clerk route guard (public map vs protected note creation)
│   │
│   ├── app/                           # Next.js 14 App Router
│   │   ├── layout.tsx                 # Root layout with ClerkProvider, font, and metadata
│   │   ├── page.tsx                   # Main SafeCity view (interactive map + bottom HUD)
│   │   ├── globals.css                # Global CSS variables, Leaflet overrides, animations
│   │   │
│   │   ├── (auth)/                    # Auth route group
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx   # Clerk SignIn modal/page
│   │   │   └── sign-up/[[...sign-up]]/page.tsx   # Clerk SignUp modal/page
│   │   │
│   │   ├── directory/                 # Offline-friendly emergency directory
│   │   │   └── page.tsx               # Click-to-call helpline numbers by jurisdiction
│   │   │
│   │   ├── notes/                     # User notes & community alerts
│   │   │   ├── page.tsx               # List of user's private pins and reported alerts
│   │   │   └── new/page.tsx           # Drop-a-pin modal & note creator
│   │   │
│   │   └── api/                       # Backend API routes
│   │       ├── webhooks/
│   │       │   └── clerk/route.ts     # Clerk webhook handler (syncs user to Neon DB)
│   │       ├── places/
│   │       │   └── nearby/route.ts    # Geospatial search for nearby safe spots (Haversine)
│   │       ├── safety-score/
│   │       │   └── route.ts           # Dynamic safety calculation (0.0-10.0) for coordinates
│   │       └── notes/
│   │           ├── route.ts           # GET (viewport query) & POST (create note)
│   │           └── [id]/
│   │               ├── route.ts       # PATCH (edit note) & DELETE (remove note)
│   │               └── vote/route.ts  # POST (upvote/downvote community alert)
│   │
│   ├── components/                    # Modular React components
│   │   ├── map/                       # Mapping & Leaflet components (dynamic SSR: false)
│   │   │   ├── MapContainer.tsx       # Dynamic wrapper loading Leaflet on client only
│   │   │   ├── MapView.tsx            # Leaflet map canvas, tile layers, and camera controller
│   │   │   ├── SafetyHeatmapLayer.tsx # Visual safety influence circles (Green/Yellow/Red)
│   │   │   ├── PlaceMarkersLayer.tsx  # Pins for Pink Booths, Police, Metro, Hospitals
│   │   │   ├── CommunityNotesLayer.tsx# Clustered community hazard and safe pins
│   │   │   └── UserLocationMarker.tsx # Animated pulsing radar dot for live GPS position
│   │   │
│   │   ├── hud/                       # Heads-Up Display & Bottom Sheet overlays
│   │   │   ├── TopAppBar.tsx          # Branding, quick search, disguise button, Clerk UserButton
│   │   │   ├── BottomSheetHUD.tsx     # Expandable bottom drawer for nearest safe spot & details
│   │   │   ├── ZoneSafetyBadge.tsx    # Live safety score badge (e.g. "8.6/10 High Safety")
│   │   │   ├── NearestPlaceCard.tsx   # Distance, address, and click-to-call for closest booth
│   │   │   ├── QuickActionBar.tsx     # 1-Tap SOS (112), WhatsApp share, and "Add Note" button
│   │   │   └── StealthDisguiseModal.tsx # Calculator disguise overlay for high-stress situations
│   │   │
│   │   ├── notes/                     # Note creation & voting dialogs
│   │   │   ├── CreateNoteDialog.tsx   # Modal to toggle between Community Alert vs Private Pin
│   │   │   ├── NoteDetailCard.tsx     # Card with verification count, author pseudonym, actions
│   │   │   └── VoteActions.tsx        # "Still an Issue" vs "Resolved" voting buttons
│   │   │
│   │   └── ui/                        # Reusable base UI primitives
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useGeolocation.ts          # Tracks user GPS coordinates, heading, and accuracy
│   │   ├── useNearbyPlaces.ts         # Fetches safe POIs from /api/places/nearby with caching
│   │   ├── useSafetyScore.ts          # Fetches dynamic WSI rating for user coordinates
│   │   ├── useLocationNotes.ts        # Fetches and mutates community & private notes
│   │   └── useOfflineSync.ts          # Monitors online/offline network state & syncs cache
│   │
│   ├── lib/                           # Core utilities, clients & algorithms
│   │   ├── prisma.ts                  # Global Prisma client instance for Neon connection
│   │   ├── haversine.ts               # Mathematical distance calculation in kilometers
│   │   ├── safetyScorer.ts            # WSI algorithm logic (anchors, time-of-day, penalties)
│   │   ├── crypto.ts                  # Web Crypto API wrapper for AES-256-GCM private note encryption
│   │   ├── offlineStorage.ts          # IndexedDB cache helper for emergency directory
│   │   └── delhiHelplines.ts          # Static directory of Delhi NCR emergency numbers
│   │
│   └── types/                         # TypeScript interfaces & types
│       ├── map.ts                     # Coordinates, bounds, and tile configuration
│       ├── place.ts                   # SafetyPlace interface and categories
│       ├── note.ts                    # LocationNote, NoteVote, and hazard types
│       └── safety.ts                  # SafetyScore breakdown and factor interface
```

---

## 3. Phase-Wise Implementation Roadmap

```
+-----------------------------------------------------------------------------------------------+
| PHASE 1: Scaffolding & Dependencies (Next.js 14, Tailwind, Types, PWA Shell)                  |
| PHASE 2: Neon Database & Prisma Setup (Schema, Migration & Delhi NCR Seed Data)               |
| PHASE 3: Clerk Authentication & Webhook Sync (Phone OTP, Pseudonymization, Route Guards)     |
| PHASE 4: Leaflet Map Canvas & Delhi Infrastructure POI Visualization                          |
| PHASE 5: Safety Heatmap Engine & Dynamic Scoring Pipeline                                     |
| PHASE 6: Location Notes System (Community Alerts, Private Client Encryption, Upvoting)        |
| PHASE 7: Emergency Quick-Action HUD, Stealth Calculator Disguise & Offline Fallback           |
| PHASE 8: End-to-End Verification, Performance Optimization & Vercel Deployment               |
+-----------------------------------------------------------------------------------------------+
```

---

### Phase 1: Scaffolding, Dependencies & Environment
- **Objective:** Create the Next.js 14 App Router project with TypeScript, configure Tailwind CSS with night-vision colors, setup base types, and configure PWA manifest.
- **Tasks:**
  1. Initialize Next.js project with `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`.
  2. Install core packages:
     ```bash
     npm install @clerk/nextjs @prisma/client leaflet react-leaflet svix lucide-react
     npm install -D prisma @types/leaflet
     ```
  3. Configure `next.config.mjs` to handle Leaflet dynamic imports and PWA headers.
  4. Setup `globals.css` with dark palette:
     - Primary background: `#0A0D14` (Deep obsidian black for OLED battery preservation).
     - Surface cards: `#141923` (Elevated dark navy).
     - Safety green: `#10B981`, Warning amber: `#F59E0B`, Danger red: `#EF4444`.
  5. Setup `public/manifest.json` with standalone PWA configuration.
- **Deliverable:** Clean compiling Next.js app with Tailwind dark theme and base PWA shell.

---

### Phase 2: Neon Database Layer & Delhi NCR Seeding
- **Objective:** Connect Neon Serverless Postgres via Prisma, create database tables, and seed real-world Delhi NCR safety infrastructure.
- **Tasks:**
  1. Initialize Prisma with `npx prisma init`.
  2. Configure `schema.prisma` with `User`, `SafetyPlace`, `LocationNote`, and `NoteVote` models.
  3. Add Neon connection string to `.env.local` (`DATABASE_URL=postgresql://...?sslmode=require`).
  4. Run initial database migration:
     ```bash
     npx prisma migrate dev --name init_safety_schema
     ```
  5. Author `prisma/seed.ts` containing verified coordinates:
     - Delhi Police Pink Booths (Janpath, North Campus DU, Karol Bagh, Laxmi Nagar).
     - Police Stations (Connaught Place, Hauz Khas, Cyber Hub Gurugram, Sector 20 Noida).
     - DMRC Metro Stations (Rajiv Chowk, Hauz Khas, Kashmere Gate, Botanical Garden).
     - 24/7 Hospital ERs (AIIMS Ansari Nagar, Safdarjung, RML, Fortis Gurugram).
  6. Execute seed: `npx prisma db seed`.
- **Deliverable:** Neon PostgreSQL database running with populated Delhi NCR safety locations.

---

### Phase 3: Clerk Authentication & Webhook Sync
- **Objective:** Integrate Clerk for passwordless phone OTP and Google OAuth, sync accounts to Neon with anonymous pseudonyms, and configure route guards.
- **Tasks:**
  1. Set up Clerk keys in `.env.local`:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `CLERK_WEBHOOK_SECRET`
  2. Wrap application root in `<ClerkProvider>` within `src/app/layout.tsx`.
  3. Create `src/middleware.ts`:
     - Keep `/`, `/api/places(.*)`, `/api/safety-score(.*)`, and `/directory` **100% public**.
     - Protect note creation (`/notes/new`, `POST /api/notes`).
  4. Build `src/app/api/webhooks/clerk/route.ts` using `svix` to listen for `user.created`:
     - Generate anonymous commuter pseudonym (e.g. `NCR_Commuter_7381`) to prevent doxxing.
     - Insert user record into Neon `User` table.
  5. Build header navigation with Clerk `<SignInButton />`, `<SignUpButton />`, and `<UserButton />`.
- **Deliverable:** Frictionless, optional authentication flow that syncs seamlessly with Neon.

---

### Phase 4: Leaflet Map Canvas & Delhi POI Visualization
- **Objective:** Build an interactive, mobile-optimized map centered on Delhi NCR rendering high-contrast markers for police stations, Pink Booths, metro stations, and hospitals.
- **Tasks:**
  1. Create `src/components/map/MapContainer.tsx` using `next/dynamic` with `{ ssr: false }` to prevent SSR window issues with Leaflet.
  2. Implement `MapView.tsx`:
     - Center: `[28.6139, 77.2090]` (New Delhi), Zoom: `13`.
     - Basemap: CartoDB Dark Matter (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`).
  3. Implement `src/hooks/useGeolocation.ts`:
     - Obtains browser GPS position via `navigator.geolocation.watchPosition`.
     - Renders custom pulsing radar dot on user coordinates.
  4. Build `src/app/api/places/nearby/route.ts`:
     - Queries Neon for places within specified radius using SQL Haversine formula.
  5. Implement `PlaceMarkersLayer.tsx`:
     - Renders custom SVG pins for Pink Booths (🟣), Police (🔵), Metro (🟢), and Hospitals (🔴).
     - Clicking a pin opens a popup with distance, address, landmark, and direct call button.
  6. Add top filter chips: `(All)`, `(Pink Booths)`, `(Metro)`, `(Hospitals)`, `(Community Alerts)`.
- **Deliverable:** Smooth 60fps Leaflet map rendering all Delhi NCR safe spots with live GPS tracking.

---

### Phase 5: Safety Heatmap Engine & Dynamic Scoring
- **Objective:** Compute and render real-time area safety scores (0.0 to 10.0) based on infrastructure proximity, time-of-day, and active community reports.
- **Tasks:**
  1. Implement `src/lib/safetyScorer.ts`:
     - Calculates infrastructure positive score (+0 to +6.0 pts for Pink Booths, police, metro).
     - Calculates commercial/transit footfall (+0 to +1.5 pts).
     - Subtracts active hazard penalties (-0 to -4.0 pts for broken lights or harassment spots).
     - Multiplies by local Delhi time factor (Day: $1.0\times$, Evening: $0.9\times$, Late night: $0.75\times$).
  2. Build `src/app/api/safety-score/route.ts`:
     - Accepts `lat` and `lng`, runs calculations, returns score and breakdown factors.
  3. Build `SafetyHeatmapLayer.tsx`:
     - Visualizes safe anchor influence circles (soft green radiance) and hazard report circles (soft red radiance) on the Leaflet canvas.
  4. Implement `ZoneSafetyBadge.tsx`:
     - Displays live score at user's location (e.g. `8.6/10 High Safety` with green badge).
     - Tapping badge opens safety breakdown bottom drawer.
- **Deliverable:** Real-time safety scoring model visually displaying safe corridors and caution areas.

---

### Phase 6: Location Notes System (Community Alerts & Private Pins)
- **Objective:** Allow authenticated users to report verified hazards or save client-encrypted private safety notes tied to geographic coordinates.
- **Tasks:**
  1. Build `src/lib/crypto.ts`:
     - Web Crypto API helper: generates user-derived key and encrypts private notes with **AES-256-GCM** in-browser. Server stores only ciphertext.
  2. Implement `src/app/api/notes/route.ts`:
     - `GET`: Returns public community notes for active map bounding box + authenticated user's private notes.
     - `POST`: Validates note category, checks GPS proximity (<1km from user), and saves to Neon.
  3. Build `CreateNoteDialog.tsx`:
     - Toggle between **📢 Public Community Alert** (`POOR_LIGHTING`, `DESERTED_AREA`, `HARASSMENT_SPOT`) and **🔒 Private Note**.
  4. Implement `VoteActions.tsx` and `src/app/api/notes/[id]/vote/route.ts`:
     - Prevents duplicate votes per user.
     - Allows commuters to upvote ("Still an Issue") or downvote ("Resolved").
     - Automatically expires hazards with net-negative votes.
- **Deliverable:** Functional dual-mode note-taking engine with crowdsourced hazard validation.

---

### Phase 7: Emergency HUD, Stealth Disguise & Offline Fallback
- **Objective:** Deliver critical emergency assistance within thumb reach, create an offline helpline directory, and implement a stealth calculator disguise.
- **Tasks:**
  1. Implement `BottomSheetHUD.tsx`:
     - Shows closest safe spot: *"Nearest: Janpath Pink Booth (210m away)"*.
     - Action buttons: `[ Directions ]`, `[ Call Booth ]`, `[ Drop Safety Note ]`.
  2. Implement `QuickActionBar.tsx`:
     - Prominent **SOS 112** button that opens a confirmation dialer.
     - **Share Trip via WhatsApp** button that creates a pre-filled Google Maps link with current coordinates.
  3. Build `StealthDisguiseModal.tsx`:
     - Triple-tapping the header logo or emergency button opens a functional calculator interface.
     - Disguises screen in uncomfortable or threatening situations while preserving location tracking.
  4. Build `src/app/directory/page.tsx`:
     - Complete click-to-call directory of Delhi NCR helplines (112, 1091, 1090, 181, 155370).
     - Cached locally in `IndexedDB` so it loads instantly even with zero network coverage.
- **Deliverable:** Resilient emergency HUD with one-tap dialing and stealth disguise.

---

### Phase 8: End-to-End Verification & Production Readiness
- **Objective:** Test end-to-end user flows, optimize bundle size, verify PWA offline caching, and validate deployment.
- **Tasks:**
  1. Test GPS positioning across mobile viewports (Chrome on Android, Safari on iOS).
  2. Verify Clerk authentication tokens and webhook processing against Neon.
  3. Test zero-knowledge encryption: verify that private notes are stored as unreadable ciphertext in Neon.
  4. Audit Lighthouse score for PWA compliance, accessibility (WCAG 2.1 AAA contrast), and performance (FCP < 1.5s).
  5. Deploy to Vercel and configure Neon connection pooling.
- **Deliverable:** Production-ready PWA live and accessible to Delhi NCR commuters.

---

## 4. Environment Variables Specification (`.env.example`)

```env
# =======================================================================
# NEON POSTGRESQL DATABASE
# =======================================================================
# Pooled connection string from Neon dashboard
DATABASE_URL="postgresql://username:password@ep-cool-pool-123456.us-east-2.aws.neon.tech/safecity_delhi?sslmode=require&pgbouncer=true"
# Direct connection string for Prisma migrations
DIRECT_URL="postgresql://username:password@ep-cool-pool-123456.us-east-2.aws.neon.tech/safecity_delhi?sslmode=require"

# =======================================================================
# CLERK AUTHENTICATION
# =======================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# =======================================================================
# APPLICATION CONFIGURATION
# =======================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LAT="28.6139"
NEXT_PUBLIC_DEFAULT_LNG="77.2090"
NEXT_PUBLIC_DEFAULT_REGION="Delhi NCR"
```
