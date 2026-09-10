# SafeCity Delhi NCR: Technical Architecture Blueprint
## Comprehensive Architecture, Flowcharts & Engineering Specifications

---

## 1. Architectural Overview & Design Principles

SafeCity Delhi NCR is built as an **offline-resilient, full-stack monolithic Progressive Web Application (PWA)**. The system eliminates infrastructure friction by relying on managed, autoscaling cloud services:

1. **Monolithic Simplicity:** Next.js 14+ (App Router) hosts the React frontend UI, PWA Service Worker, and serverless API route handlers in **one repository**.
2. **Zero-API-Key Mapping:** Leaflet.js with CartoDB Dark Matter / OpenStreetMap tiles eliminates third-party tile subscription costs and telemetry locks.
3. **Serverless Persistence:** Neon PostgreSQL provides serverless compute with built-in connection pooling (`PgBouncer`) and instant point-in-time recovery.
4. **Managed Identity:** Clerk (`@clerk/nextjs`) manages SMS OTP, WhatsApp verification, and session cookies, synchronized to Neon via webhooks.
5. **Zero-Knowledge Privacy:** Private safety notes are encrypted in the client browser using the Web Crypto API (`AES-256-GCM`) before transmission to the database.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer [Client Layer: Browser & PWA]
        UI[Next.js App Router UI]
        Map[Leaflet.js + CartoDB Dark Tiles]
        ClerkSDK[Clerk Frontend SDK]
        SW[Workbox Service Worker]
        IDB[(Client IndexedDB: Offline Directory)]
        Crypto["Web Crypto Subsystem: AES-256-GCM"]

        UI <--> Map
        UI <--> ClerkSDK
        UI <--> Crypto
        SW <--> IDB
    end

    subgraph EdgeLayer [Edge Delivery & Route Protection]
        VercelCDN[Vercel Edge Network / CDN]
        ClerkEdge["Clerk Middleware: clerkMiddleware()"]
        VercelCDN --> ClerkEdge
    end

    subgraph AppServerLayer [Serverless Application Layer: Next.js 14]
        APIPublic["Public Endpoints: /api/places/nearby, /api/safety-score"]
        APIPrivate["Protected Endpoints: /api/notes, /api/notes/:id/vote"]
        WebhookHandler["Clerk Webhook Sync: /api/webhooks/clerk"]
        ScorerLib["Safety Scoring Algorithm: safetyScorer.ts"]
        PrismaClient[Prisma Client with Connection Pooling]

        ClerkEdge --> APIPublic
        ClerkEdge --> APIPrivate
        ClerkEdge --> WebhookHandler
        APIPublic --> ScorerLib
        ScorerLib --> PrismaClient
        APIPrivate --> PrismaClient
        WebhookHandler --> PrismaClient
    end

    subgraph AuthCloud [Authentication Service]
        ClerkAuth[Clerk Cloud Auth Engine]
        ClerkAuth -- "Webhook Event (user.created)" --> WebhookHandler
    end

    subgraph DatabaseLayer [Persistence Tier]
        PgBouncer["Neon Connection Pooler (PgBouncer)"]
        NeonDB[(Neon Serverless PostgreSQL)]
        PrismaClient <== Pooled Connection ==> PgBouncer
        PgBouncer <== Auto-Scaling Compute ==> NeonDB
    end

    ClientLayer <== HTTPS / JSON ==> VercelCDN
    ClerkSDK <== Auth Handshake ==> ClerkAuth
```

---

## 3. Clerk Authentication & Neon Database Sync Flow

To safeguard user privacy while preventing spam, public browsing of the map and emergency services requires **zero login**. Only users posting community alerts or saving private pins are authenticated via Clerk.

```mermaid
sequenceDiagram
    autonumber
    actor User as Commuter
    participant UI as Next.js Client
    participant Clerk as Clerk Cloud Auth
    participant Hook as /api/webhooks/clerk
    participant DB as Neon PostgreSQL
    participant NoteAPI as /api/notes

    Note over User, UI: Commuter browses map anonymously (no auth needed)
    User->>UI: Clicks "Report Safety Hazard"
    UI->>Clerk: Triggers <SignIn /> Modal (Phone OTP / Google)
    User->>Clerk: Submits Phone OTP
    Clerk-->>UI: Validates session & issues short-lived JWT cookie
    
    par Async Database Sync
        Clerk->>Hook: Dispatches webhook (user.created) with Svix signature
        Hook->>Hook: Verifies signature with CLERK_WEBHOOK_SECRET
        Hook->>Hook: Generates anonymous pseudonym (e.g. NCR_Commuter_8210)
        Hook->>DB: Upserts User record (clerkId, pseudonym, phone, reputation=50)
        DB-->>Hook: 200 OK
    and Commuter Action
        UI->>NoteAPI: POST /api/notes (lat, lng, category: POOR_LIGHTING, content)
        NoteAPI->>DB: Validates Clerk auth session & inserts LocationNote
        DB-->>NoteAPI: Note inserted with status: ACTIVE
        NoteAPI-->>UI: 201 Created (Displays pin on map)
    end
```

---

## 4. Safety Heatmap Engine Calculation & Visualization

The Safety Heatmap determines how safe any geographic area in Delhi NCR is using a 3-layer quantitative evaluation:

```mermaid
flowchart TD
    Start(["User Coordinates: lat, lng"]) --> QueryAnchors["Query Neon for Safe Anchors within 1.5km"]
    
    subgraph Layer1 [Layer 1: Positive Infrastructure Anchors]
        QueryAnchors --> CalcPink["Delhi Police Pink Booth: <=300m: +3.5 pts / <=800m: +2.5 pts"]
        QueryAnchors --> CalcMetro["DMRC Metro Station: <=400m: +2.0 pts / <=1000m: +1.0 pt"]
        QueryAnchors --> CalcHosp["24/7 Hospital ER or Safe Haven: <=500m: +1.0 pt"]
        CalcPink --> SumAnchors["Sum Anchor Score: Clamp 0.0 to 6.0 pts"]
        CalcMetro --> SumAnchors
        CalcHosp --> SumAnchors
    end

    Start --> QueryHazards[Query Neon for Active Community Hazards within 500m]

    subgraph Layer2 [Layer 2: Community Hazard Penalties]
        QueryHazards --> FilterActive{Is Note Active & Upvoted?}
        FilterActive -- Yes --> CalcHazards["Calculate Penalties: Streetlight -1.5 / Deserted -2.0 / Harassment -3.0"]
        FilterActive -- "Downvoted / Resolved" --> IgnoreHazard["Ignore Hazard Penalty: 0 pts"]
        CalcHazards --> SumHazards["Sum Hazard Penalty: Clamp 0.0 to -4.0 pts"]
        IgnoreHazard --> SumHazards
    end

    subgraph Layer3 [Layer 3: Time-of-Day Multiplier]
        CheckTime[Evaluate Current Delhi Local Time]
        CheckTime --> TimeBranch{Current Hour?}
        TimeBranch -- 06:00 to 19:00 (Day) --> MultDay[Multiplier = 1.00]
        TimeBranch -- 19:00 to 22:30 (Evening) --> MultEve[Multiplier = 0.90]
        TimeBranch -- 22:30 to 05:30 (Night) --> MultNight[Multiplier = 0.75]
    end

    SumAnchors --> ComputeComposite["Formula: Base Anchors + Footfall - Hazard Penalties"]
    SumHazards --> ComputeComposite
    MultDay --> ApplyMultiplier
    MultEve --> ApplyMultiplier
    MultNight --> ApplyMultiplier
    ComputeComposite --> ApplyMultiplier["Apply Time Multiplier and Normalize: Clamp 0.0 to 10.0"]

    ApplyMultiplier --> ScoreDecision{Final Safety Score}
    ScoreDecision -- 8.0 to 10.0 --> Green[🟢 Emerald Green: High Safety Zone]
    ScoreDecision -- 5.5 to 7.9 --> Yellow[🟡 Amber / Yellow: Moderate Safety Zone]
    ScoreDecision -- 0.0 to 5.4 --> Red[🔴 Coral / Red: Elevated Caution Zone]

    Green --> LeafletRender[Render Dynamic Aura on Leaflet & Update Zone HUD Badge]
    Yellow --> LeafletRender
    Red --> LeafletRender
```

---

## 5. Location Notes Lifecycle & Anti-Misinformation State Machine

To prevent misinformation, trolling, or outdated reviews from permanently skewing Delhi NCR neighborhood ratings, notes transition through a deterministic lifecycle:

```mermaid
flowchart TD
    START([User drops pin on map]) --> Draft[Draft]

    Draft --> PrivateNote["Private Note (Lock)"]
    Draft --> CommunityAlert["Public Community Alert"]

    subgraph PrivateNoteFlow ["Private Note Flow"]
        PrivateNote --> ClientEncrypt["Web Crypto API derives key"]
        ClientEncrypt --> EncryptedPayload["AES-256-GCM ciphertext + IV"]
        EncryptedPayload --> NeonPrivateStore["Stored in Neon - Server cannot read"]
        NeonPrivateStore --> AuthorOnly([Visible only to Author])
    end

    subgraph CommunityFlow ["Community Alert Flow"]
        CommunityAlert --> GeofenceCheck["Verify user GPS vs pin distance"]
        GeofenceCheck -- "Distance > 1km" --> Rejected([Rejected: Anti-remote spam])
        GeofenceCheck -- "Distance <= 1km" --> ActiveAlert["Status: ACTIVE"]

        ActiveAlert --> Upvoted["Upvoted: Commuters tap Still an Issue"]
        ActiveAlert --> Downvoted["Downvoted: Commuters tap Resolved / Inaccurate"]
        ActiveAlert --> Expired["14-day TTL expires without reaffirmation"]

        Upvoted -- "Upvotes >= 3" --> FullPenalty["Full Penalty: 100% impact on WSI score"]
        Downvoted -- "Downvotes > Upvotes + 2" --> Resolved["Status: RESOLVED"]

        Resolved --> PenaltyLifted["Penalty Removed"]
        Expired --> PenaltyLifted
    end

    PenaltyLifted --> END([Archived])
```

---

## 6. Offline-First Emergency Fallback Sequence

During subway transit or cellular dead zones, the Progressive Web App guarantees 100% uptime for life-saving emergency helplines and nearest police coordinates:

```mermaid
sequenceDiagram
    autonumber
    actor User as Commuter (In Metro Subway)
    participant UI as PWA Interface
    participant SW as Service Worker (Workbox)
    participant IDB as Browser IndexedDB
    participant API as Next.js API Server
    participant Neon as Neon PostgreSQL

    Note over User, UI: Commuter loses cellular connection (No Internet)
    User->>UI: Taps "Emergency Helplines" or "Find Nearest Police"
    UI->>SW: Fetch request: /api/places/nearby?lat=...&lng=...
    
    SW->>API: Tries network request
    API--xSW: Network Error / Timeout (Offline)
    
    SW->>IDB: Query local cached emergency directory & police places
    IDB-->>SW: Returns cached Delhi NCR places (AIIMS, Pink Booths, 112, 1091)
    
    SW-->>UI: 200 OK (Served from local offline storage)
    UI-->>User: Displays "Offline Mode: Showing Cached Safe Spots & Helplines"
    User->>UI: Taps "Call 1091 (Delhi Police Women Helpline)"
    UI->>User: Triggers native OS phone dialer (Works without internet)
```

---

## 7. Database Architecture & Schema Specification

The database utilizes **Neon Serverless PostgreSQL** via **Prisma ORM**.

```mermaid
erDiagram
    User ||--o{ LocationNote : creates
    User ||--o{ NoteVote : casts
    LocationNote ||--o{ NoteVote : receives

    User {
        string id PK "UUID"
        string clerkId UK "Clerk Identifier"
        string pseudonym UK "Anonymous Alias"
        string phoneNumber "Synced from Clerk"
        string email "Synced from Clerk"
        int reputationScore "0 to 100"
        datetime createdAt
        datetime updatedAt
    }

    SafetyPlace {
        string id PK "UUID"
        string name "Place Name"
        enum category "PINK_BOOTH, POLICE_STATION, METRO_STATION, HOSPITAL_247"
        float latitude "GPS Latitude"
        float longitude "GPS Longitude"
        string address "Street address"
        string contactNumber "Phone or Helpline"
        string landmark "Exit gate or landmark"
        boolean is24x7 "Always open flag"
        string region "Delhi, Gurugram, Noida"
        datetime createdAt
    }

    LocationNote {
        string id PK "UUID"
        string userId FK "References User.id"
        enum noteType "COMMUNITY_ALERT, PRIVATE_PIN"
        enum hazardCategory "POOR_LIGHTING, DESERTED_AREA, HARASSMENT_SPOT, SAFE_ZONE"
        float latitude "GPS Latitude"
        float longitude "GPS Longitude"
        string content "Plaintext (community) or Ciphertext (private)"
        boolean isEncrypted "Client-side encrypted flag"
        int upvotesCount "Valid confirmations"
        int downvotesCount "Resolved confirmations"
        string status "ACTIVE, RESOLVED, FLAGGED, EXPIRED"
        datetime expiresAt "TTL auto-expiration"
        datetime createdAt
    }

    NoteVote {
        string id PK "UUID"
        string noteId FK "References LocationNote.id"
        string userId FK "References User.id"
        boolean isUpvote "true=Still an Issue, false=Resolved"
        datetime createdAt
    }
```

### High-Performance Haversine Distance Query (SQL)
To find the closest police stations and Pink Booths within $3\text{ km}$, Prisma executes an indexed SQL mathematical query:

```sql
SELECT 
    id, name, category, latitude, longitude, address,
    contact_number AS "contactNumber", landmark,
    (6371 * acos(
        cos(radians(:userLat)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(:userLng)) + 
        sin(radians(:userLat)) * sin(radians(latitude))
    )) AS distance_km
FROM "SafetyPlace"
WHERE 
    latitude BETWEEN (:userLat - 0.035) AND (:userLat + 0.035)
    AND longitude BETWEEN (:userLng - 0.035) AND (:userLng + 0.035)
ORDER BY distance_km ASC
LIMIT 20;
```

---

## 8. Client-Side Zero-Knowledge Encryption Flow

To ensure absolute user privacy for private notes (e.g. *"Spare bike key kept near metro pillar"*, *"Alley behind market is dark after 10 PM"*), notes are protected by a **Zero-Knowledge Web Crypto Architecture**:

```
+-------------------------------------------------------------------------------+
| CLIENT BROWSER (Web Crypto API)                                               |
|                                                                               |
| 1. User Master Passphrase                                                     |
|         + Client Device Salt                                                  |
|         |                                                                     |
|         v (PBKDF2-HMAC-SHA256, 100,000 Iterations)                            |
|    Derived 256-bit AES-GCM Key (in browser RAM only, never sent to server)     |
|         |                                                                     |
| 2. Raw Private Note: "Scooter parked at Gate 4 near camera"                   |
|         |                                                                     |
|         v (crypto.subtle.encrypt: AES-256-GCM + 96-bit random IV)             |
|    Ciphertext: "3f8b01c...99a", IV: "a1b2c3d4e5f6"                            |
+-------------------------------------------------------------------------------+
                                       |
                   Encrypted JSON payload over TLS 1.3
                                       |
                                       v
+-------------------------------------------------------------------------------+
| NEON POSTGRESQL DATABASE                                                      |
|                                                                               |
| Stores: { id, userId, lat, lng, content: "3f8b01c...99a", isEncrypted: true } |
|                                                                               |
| Database administrators and hackers CANNOT decrypt the plaintext note!       |
+-------------------------------------------------------------------------------+
```

---

## 9. Security, Privacy & Differential Anonymity Guardrails

1. **Identity Pseudonymization:**
   - Public community notes display pseudonyms (`NCR_Commuter_4819`).
   - The user's real name, phone number, and email are never exposed to other commuters or returned in public API payloads.
2. **Anti-Stalking Telemetry Protection:**
   - SafeCity **never stores persistent user GPS breadcrumbs** or location histories.
   - GPS telemetry sent for safety calculations is processed ephemerally in-memory and discarded.
3. **Anti-Brigading & Sybil Resistance:**
   - A commuter must be within **$1\text{ km}$** of the reported coordinates to submit an alert.
   - IP and user-rate limits prevent malicious coordinated review-bombing of commercial areas.
4. **Emergency Stealth Trigger:**
   - Triple-tapping the header logo activates a **Stealth Calculator Disguise**, disguising the screen as a normal calculator while preserving silent background emergency broadcasting.

---

## 10. Deployment Topology & Production Pipeline

```mermaid
flowchart LR
    subgraph Development [Local Developer Environment]
        LocalDev[Next.js Local Server: localhost:3000]
        PrismaCLI[Prisma CLI Migrations]
    end

    subgraph CI_CD [GitHub & Vercel Pipeline]
        GitHub[GitHub Repository: WomenSafety]
        VercelBuild[Vercel CI/CD Build Engine]
        GitHub --> VercelBuild
    end

    subgraph Production [Production Cloud Infrastructure]
        EdgeNetwork[Vercel Global Edge Network]
        ServerlessApp[Next.js Serverless Functions]
        ClerkCloud[Clerk Identity Cloud]
        NeonProd[(Neon Serverless Postgres: Auto-Scaling)]
        
        VercelBuild --> EdgeNetwork
        EdgeNetwork --> ServerlessApp
        ServerlessApp <--> ClerkCloud
        ServerlessApp <== PgBouncer Pool ==> NeonProd
    end

    LocalDev -. git push .-> GitHub
    PrismaCLI -. prisma migrate deploy .-> NeonProd
```

---

## 11. Architectural Summary & Verification Milestones
- [x] **Lightweight & Free:** Zero paid mapping subscriptions (Leaflet + CartoDB Dark Matter).
- [x] **Scalable Serverless Backend:** Next.js monolithic API + Neon autoscaling Postgres with PgBouncer.
- [x] **Frictionless Auth:** Clerk SMS/WhatsApp OTP with zero login required for emergency map features.
- [x] **Transparent Safety Heatmap:** Multi-factor scoring model combining verified anchors, time of day, and verified community hazard alerts.
- [x] **Crisis Resilient:** 100% offline emergency telephone directory and cached safe locations.
