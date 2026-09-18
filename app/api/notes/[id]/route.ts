import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// =======================================================================
// SafeCity Delhi NCR — Individual Note API (Phase 6)
// PATCH  /api/notes/[id]  → update note content / status (author only)
// DELETE /api/notes/[id]  → delete note (author only)
// =======================================================================

// ---------------------------------------------------------------------------
// Shared: resolve DB userId from Clerk session and verify note ownership
// ---------------------------------------------------------------------------
async function resolveOwnership(
  clerkId: string,
  noteId: string
): Promise<
  | { ok: true; userId: string; note: { id: string; userId: string; noteType: string } }
  | { ok: false; response: NextResponse }
> {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!dbUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  const note = await prisma.locationNote.findUnique({
    where: { id: noteId },
    select: { id: true, userId: true, noteType: true },
  });

  if (!note) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Note not found" }, { status: 404 }),
    };
  }

  if (note.userId !== dbUser.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: you can only modify your own notes" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: dbUser.id, note };
}

// ---------------------------------------------------------------------------
// PATCH /api/notes/[id]
// Body: { content?, encryptionIv?, status? }
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: noteId } = await params;
    const ownership = await resolveOwnership(clerkId, noteId);
    if (!ownership.ok) return ownership.response;

    const body = await req.json();
    const { content, encryptionIv, status } = body as {
      content?: string;
      encryptionIv?: string;
      status?: string;
    };

    const VALID_STATUSES = ["ACTIVE", "RESOLVED", "FLAGGED"];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await prisma.locationNote.update({
      where: { id: noteId },
      data: {
        ...(content !== undefined && { content }),
        ...(encryptionIv !== undefined && { encryptionIv }),
        ...(status !== undefined && { status }),
      },
      select: { id: true, status: true, updatedAt: true },
    });

    return NextResponse.json({ success: true, note: updated });
  } catch (error) {
    console.error("[PATCH /api/notes/:id] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/notes/[id]
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: noteId } = await params;
    const ownership = await resolveOwnership(clerkId, noteId);
    if (!ownership.ok) return ownership.response;

    await prisma.locationNote.delete({ where: { id: noteId } });

    console.log(`[DELETE /api/notes/:id] Note ${noteId} deleted by clerkId ${clerkId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/notes/:id] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
