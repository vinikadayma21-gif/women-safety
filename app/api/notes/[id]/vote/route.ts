import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// =======================================================================
// SafeCity Delhi NCR — Note Vote API (Phase 6)
// POST /api/notes/[id]/vote
// Body: { isUpvote: boolean }  ("Still an Issue" = true, "Resolved" = false)
//
// Anti-spam: unique constraint on (noteId, userId) — duplicate returns 409.
// Auto-expire: if downvotesCount >= upvotesCount + 3 → note.status = "RESOLVED"
// =======================================================================

const NET_DOWNVOTE_THRESHOLD = 3; // Net downvotes needed to auto-expire a note

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth guard ─────────────────────────────────────────────────────────
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Authentication required to vote" },
        { status: 401 }
      );
    }

    // ── Parse route param ──────────────────────────────────────────────────
    const { id: noteId } = await params;

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const { isUpvote } = body as { isUpvote?: boolean };

    if (typeof isUpvote !== "boolean") {
      return NextResponse.json(
        { error: "isUpvote must be a boolean" },
        { status: 400 }
      );
    }

    // ── Resolve internal user ──────────────────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Verify note exists and is a community alert ─────────────────────────
    const note = await prisma.locationNote.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        noteType: true,
        status: true,
        userId: true,
        upvotesCount: true,
        downvotesCount: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.noteType !== "COMMUNITY_ALERT") {
      return NextResponse.json(
        { error: "Voting is only available on community alerts" },
        { status: 400 }
      );
    }

    if (note.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Cannot vote on a note that is already resolved or expired" },
        { status: 400 }
      );
    }

    // ── Prevent self-voting ────────────────────────────────────────────────
    if (note.userId === dbUser.id) {
      return NextResponse.json(
        { error: "You cannot vote on your own report" },
        { status: 400 }
      );
    }

    // ── Check for duplicate vote ───────────────────────────────────────────
    const existingVote = await prisma.noteVote.findUnique({
      where: { noteId_userId: { noteId, userId: dbUser.id } },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this report" },
        { status: 409 }
      );
    }

    // ── Cast vote in a transaction (insert + update counter) ──────────────
    const updatedNote = await prisma.$transaction(async (tx) => {
      // Insert vote record
      await tx.noteVote.create({
        data: {
          noteId,
          userId: dbUser.id,
          isUpvote,
        },
      });

      // Atomically increment the appropriate counter
      const updated = await tx.locationNote.update({
        where: { id: noteId },
        data: {
          upvotesCount:   isUpvote ? { increment: 1 } : undefined,
          downvotesCount: isUpvote ? undefined : { increment: 1 },
        },
        select: {
          id: true,
          upvotesCount: true,
          downvotesCount: true,
          status: true,
        },
      });

      // ── Auto-expire: net downvotes ≥ threshold → RESOLVED ────────────────
      const netDownvotes = updated.downvotesCount - updated.upvotesCount;
      if (netDownvotes >= NET_DOWNVOTE_THRESHOLD && updated.status === "ACTIVE") {
        return tx.locationNote.update({
          where: { id: noteId },
          data: { status: "RESOLVED" },
          select: {
            id: true,
            upvotesCount: true,
            downvotesCount: true,
            status: true,
          },
        });
      }

      return updated;
    });

    console.log(
      `[POST /api/notes/${noteId}/vote] ${isUpvote ? "👍" : "✅"} by clerkId ${clerkId} — ` +
        `up:${updatedNote.upvotesCount} down:${updatedNote.downvotesCount} status:${updatedNote.status}`
    );

    return NextResponse.json({
      success: true,
      isUpvote,
      upvotesCount: updatedNote.upvotesCount,
      downvotesCount: updatedNote.downvotesCount,
      status: updatedNote.status,
    });
  } catch (error) {
    console.error("[POST /api/notes/:id/vote] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
