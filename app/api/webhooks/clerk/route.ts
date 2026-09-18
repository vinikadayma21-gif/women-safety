import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

// =======================================================================
// SafeCity Delhi NCR — Clerk Webhook Handler (Phase 3)
// Listens for: user.created, user.updated, user.deleted
// Syncs Clerk identity into Neon PostgreSQL `User` table.
// Generates an anonymous NCR_Commuter pseudonym to prevent doxxing.
// =======================================================================

type ClerkEmailAddress = {
  email_address: string;
  verification?: { status: string } | null;
};

type ClerkPhoneNumber = {
  phone_number: string;
  verification?: { status: string } | null;
};

type ClerkUserPayload = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  phone_numbers?: ClerkPhoneNumber[];
  primary_email_address_id?: string | null;
  primary_phone_number_id?: string | null;
};

type ClerkWebhookEvent = {
  type: string;
  data: ClerkUserPayload;
};

/**
 * Generates a privacy-preserving commuter pseudonym.
 * Format: NCR_Commuter_XXXX (4-digit random suffix)
 * Ensures uniqueness via collision retry.
 */
async function generateUniquePseudonym(): Promise<string> {
  const MAX_ATTEMPTS = 10;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const pseudonym = `NCR_Commuter_${suffix}`;
    const existing = await prisma.user.findUnique({ where: { pseudonym } });
    if (!existing) return pseudonym;
  }
  // Fallback: use timestamp-based suffix for guaranteed uniqueness
  const tsSuffix = Date.now().toString().slice(-6);
  return `NCR_Commuter_${tsSuffix}`;
}

export async function POST(req: Request) {
  // ── 1. Retrieve the raw body and Svix signature headers ──────────────
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers — request rejected.", { status: 400 });
  }

  const body = await req.text();

  // ── 2. Verify webhook signature with Svix ─────────────────────────────
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set in environment variables.");
    return new Response("Webhook secret not configured.", { status: 500 });
  }

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Svix webhook signature verification failed:", err);
    return new Response("Invalid webhook signature.", { status: 400 });
  }

  const { type, data } = event;

  // ── 3. Handle user.created — insert new user with pseudonym ───────────
  if (type === "user.created") {
    const clerkId: string = data.id;

    // Extract verified primary email (if any)
    const primaryEmail =
      data.email_addresses?.find(
        (e) => e.email_address && e.verification?.status === "verified"
      )?.email_address ?? null;

    // Extract verified primary phone (if any)
    const primaryPhone =
      data.phone_numbers?.find(
        (p) => p.phone_number && p.verification?.status === "verified"
      )?.phone_number ?? null;

    // Guard: skip if user already synced (idempotent)
    const existingUser = await prisma.user.findUnique({ where: { clerkId } });
    if (existingUser) {
      console.log(`[Clerk Webhook] user.created: clerkId ${clerkId} already exists — skipping.`);
      return new Response("User already exists.", { status: 200 });
    }

    const pseudonym = await generateUniquePseudonym();

    await prisma.user.create({
      data: {
        clerkId,
        pseudonym,
        email: primaryEmail,
        phoneNumber: primaryPhone,
        reputationScore: 50,
      },
    });

    console.log(`[Clerk Webhook] user.created: ${pseudonym} (clerkId: ${clerkId})`);
    return new Response("User created successfully.", { status: 201 });
  }

  // ── 4. Handle user.updated — sync contact info changes ────────────────
  if (type === "user.updated") {
    const clerkId: string = data.id;

    const primaryEmail =
      data.email_addresses?.find(
        (e) => e.email_address && e.verification?.status === "verified"
      )?.email_address ?? null;

    const primaryPhone =
      data.phone_numbers?.find(
        (p) => p.phone_number && p.verification?.status === "verified"
      )?.phone_number ?? null;

    await prisma.user.updateMany({
      where: { clerkId },
      data: {
        email: primaryEmail,
        phoneNumber: primaryPhone,
      },
    });

    console.log(`[Clerk Webhook] user.updated: clerkId ${clerkId}`);
    return new Response("User updated.", { status: 200 });
  }

  // ── 5. Handle user.deleted — cascade delete via Prisma relations ──────
  if (type === "user.deleted") {
    const clerkId: string = data.id;
    await prisma.user.deleteMany({ where: { clerkId } });
    console.log(`[Clerk Webhook] user.deleted: clerkId ${clerkId}`);
    return new Response("User deleted.", { status: 200 });
  }

  // ── 6. Acknowledge all other event types ──────────────────────────────
  return new Response(`Unhandled event type: ${type}`, { status: 200 });
}
