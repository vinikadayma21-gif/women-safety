import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// =======================================================================
// SafeCity Delhi NCR — Notes API (Phase 6)
// GET  /api/notes  → viewport-scoped public community alerts + auth user's private pins
// POST /api/notes  → create a new community alert or private pin (auth required)
// =======================================================================

// ---------------------------------------------------------------------------
// GET /api/notes
// Query params: minLat, maxLat, minLng, maxLng
// Returns: community alerts within viewport + caller's private pins (if authed)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const minLat = parseFloat(searchParams.get("minLat") ?? "");
    const maxLat = parseFloat(searchParams.get("maxLat") ?? "");
    const minLng = parseFloat(searchParams.get("minLng") ?? "");
    const maxLng = parseFloat(searchParams.get("maxLng") ?? "");

    // Validate bounding-box params
    if ([minLat, maxLat, minLng, maxLng].some(isNaN)) {
      return NextResponse.json(
        { error: "Missing or invalid bounding box: minLat, maxLat, minLng, maxLng required" },
        { status: 400 }
      );
    }

    // Optionally get the authenticated user (not required for public notes)
    const { userId: clerkId } = await auth();

    // Find the internal DB user for private pin query
    let internalUserId: string | null = null;
    if (clerkId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      internalUserId = dbUser?.id ?? null;
    }

    // ── 1. Fetch public COMMUNITY_ALERT notes within bounding box ──────────
    const communityNotes = await prisma.locationNote.findMany({
      where: {
        noteType: "COMMUNITY_ALERT",
        status: "ACTIVE",
        latitude:  { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
        // Exclude expired notes
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        id: true,
        noteType: true,
        hazardCategory: true,
        latitude: true,
        longitude: true,
        content: true,
        isEncrypted: true,
        encryptionIv: true,
        upvotesCount: true,
        downvotesCount: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: { pseudonym: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Safety cap per viewport query
    });

    // ── 2. Fetch authenticated user's PRIVATE_PIN notes ───────────────────
    const privateNotes =
      internalUserId
        ? await prisma.locationNote.findMany({
            where: {
              noteType: "PRIVATE_PIN",
              userId: internalUserId,
              status: "ACTIVE",
              latitude:  { gte: minLat, lte: maxLat },
              longitude: { gte: minLng, lte: maxLng },
            },
            select: {
              id: true,
              noteType: true,
              hazardCategory: true,
              latitude: true,
              longitude: true,
              content: true,
              isEncrypted: true,
              encryptionIv: true,
              upvotesCount: true,
              downvotesCount: true,
              status: true,
              expiresAt: true,
              createdAt: true,
              user: {
                select: { pseudonym: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : [];

    // Shape the response — flatten authorPseudonym up
    const shapeNote = (
      n: typeof communityNotes[number] | typeof privateNotes[number],
      isOwn: boolean
    ) => ({
      id: n.id,
      noteType: n.noteType,
      hazardCategory: n.hazardCategory,
      latitude: n.latitude,
      longitude: n.longitude,
      content: n.content,
      isEncrypted: n.isEncrypted,
      encryptionIv: n.encryptionIv ?? null,
      upvotesCount: n.upvotesCount,
      downvotesCount: n.downvotesCount,
      status: n.status,
      expiresAt: n.expiresAt,
      createdAt: n.createdAt,
      authorPseudonym: n.user.pseudonym,
      isOwn,
    });

    const notes = [
      ...communityNotes.map((n) =>
        shapeNote(n, internalUserId !== null && false) // community notes: isOwn = false unless author match is needed
      ),
      ...privateNotes.map((n) => shapeNote(n, true)),
    ];

    return NextResponse.json({ success: true, notes }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[GET /api/notes] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/notes — create a new note (auth required)
// Body: { noteType, hazardCategory?, latitude, longitude, content, encryptionIv? }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // ── Auth guard ─────────────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Authentication required to create notes" },
        { status: 401 }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const {
      noteType,
      hazardCategory,
      latitude,
      longitude,
      content,
      encryptionIv,
    } = body as {
      noteType?: string;
      hazardCategory?: string;
      latitude?: number;
      longitude?: number;
      content?: string;
      encryptionIv?: string;
    };

    // ── Validate noteType ──────────────────────────────────────────────────
    if (!noteType || !["COMMUNITY_ALERT", "PRIVATE_PIN"].includes(noteType)) {
      return NextResponse.json(
        { error: "noteType must be COMMUNITY_ALERT or PRIVATE_PIN" },
        { status: 400 }
      );
    }

    // ── Validate coordinates ───────────────────────────────────────────────
    if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "latitude and longitude are required numbers" },
        { status: 400 }
      );
    }

    // Rough Delhi NCR bounds check
    if (latitude < 27.5 || latitude > 29.5 || longitude < 76.5 || longitude > 78.0) {
      return NextResponse.json(
        { error: "Coordinates are outside the supported Delhi NCR region" },
        { status: 400 }
      );
    }

    // ── Validate content ───────────────────────────────────────────────────
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Community alerts: content must be ≤ 500 chars; private pins: ciphertext may be longer
    if (noteType === "COMMUNITY_ALERT" && content.length > 500) {
      return NextResponse.json(
        { error: "Community alert content must be 500 characters or fewer" },
        { status: 400 }
      );
    }

    // ── Validate community alert category ─────────────────────────────────
    const VALID_HAZARD_CATEGORIES = [
      "POOR_LIGHTING",
      "DESERTED_AREA",
      "HARASSMENT_SPOT",
      "SAFE_ZONE",
      "GENERAL_TIP",
    ];
    if (
      noteType === "COMMUNITY_ALERT" &&
      (!hazardCategory || !VALID_HAZARD_CATEGORIES.includes(hazardCategory))
    ) {
      return NextResponse.json(
        { error: `hazardCategory must be one of: ${VALID_HAZARD_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // ── Private pin: require encryptionIv ─────────────────────────────────
    if (noteType === "PRIVATE_PIN" && !encryptionIv) {
      return NextResponse.json(
        { error: "encryptionIv is required for private pins" },
        { status: 400 }
      );
    }

    // ── Resolve internal user ID ───────────────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            "User profile not found. Please sign out and sign back in to sync your account.",
        },
        { status: 404 }
      );
    }

    // ── Persist the note ───────────────────────────────────────────────────
    const isPrivate = noteType === "PRIVATE_PIN";
    const expiresAt = isPrivate
      ? null                                              // Private pins never expire
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Community alerts: 14 days

    const newNote = await prisma.locationNote.create({
      data: {
        userId: dbUser.id,
        noteType: noteType as "COMMUNITY_ALERT" | "PRIVATE_PIN",
        hazardCategory: (hazardCategory ?? "GENERAL_TIP") as
          | "POOR_LIGHTING"
          | "DESERTED_AREA"
          | "HARASSMENT_SPOT"
          | "SAFE_ZONE"
          | "GENERAL_TIP",
        latitude,
        longitude,
        content,
        isEncrypted: isPrivate,
        encryptionIv: isPrivate ? encryptionIv : null,
        status: "ACTIVE",
        expiresAt,
      },
      select: {
        id: true,
        noteType: true,
        hazardCategory: true,
        latitude: true,
        longitude: true,
        isEncrypted: true,
        status: true,
        createdAt: true,
        user: { select: { pseudonym: true } },
      },
    });

    console.log(
      `[POST /api/notes] ${newNote.noteType} created by ${newNote.user.pseudonym} at (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
    );

    return NextResponse.json(
      {
        success: true,
        note: {
          ...newNote,
          authorPseudonym: newNote.user.pseudonym,
          isOwn: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/notes] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
