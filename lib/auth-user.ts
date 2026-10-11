import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Generates a privacy-preserving commuter pseudonym.
 * Format: NCR_Commuter_XXXX (4-digit random suffix)
 */
async function generateUniquePseudonym(): Promise<string> {
  const MAX_ATTEMPTS = 10;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const pseudonym = `NCR_Commuter_${suffix}`;
    const existing = await prisma.user.findUnique({ where: { pseudonym } });
    if (!existing) return pseudonym;
  }
  const tsSuffix = Date.now().toString().slice(-6);
  return `NCR_Commuter_${tsSuffix}`;
}

/**
 * Resolves the internal DB User for a given Clerk ID.
 * If the user does not exist in the database (e.g. in local development without webhooks,
 * after database resets, or due to a sign-up race condition), this helper automatically
 * fetches the user's profile from Clerk and creates a new User record in PostgreSQL on the fly (JIT sync).
 */
export async function getOrCreateDbUser(clerkId: string): Promise<User | null> {
  if (!clerkId) return null;

  try {
    // 1. Fast path: check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      return existingUser;
    }

    // 2. JIT sync: fetch details from Clerk
    let primaryEmail: string | null = null;
    let primaryPhone: string | null = null;

    try {
      const clerkUser = await currentUser();
      if (clerkUser && clerkUser.id === clerkId) {
        primaryEmail =
          clerkUser.emailAddresses?.find(
            (e) =>
              e.id === clerkUser.primaryEmailAddressId ||
              e.verification?.status === "verified"
          )?.emailAddress ??
          clerkUser.emailAddresses?.[0]?.emailAddress ??
          null;

        primaryPhone =
          clerkUser.phoneNumbers?.find(
            (p) =>
              p.id === clerkUser.primaryPhoneNumberId ||
              p.verification?.status === "verified"
          )?.phoneNumber ??
          clerkUser.phoneNumbers?.[0]?.phoneNumber ??
          null;
      }
    } catch (clerkErr) {
      console.warn("[getOrCreateDbUser] Could not fetch currentUser from Clerk:", clerkErr);
    }

    const pseudonym = await generateUniquePseudonym();

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        pseudonym,
        email: primaryEmail,
        phoneNumber: primaryPhone,
        reputationScore: 50,
      },
    });

    console.log(`[getOrCreateDbUser] Auto-provisioned user ${pseudonym} (clerkId: ${clerkId})`);
    return newUser;
  } catch (error: unknown) {
    // Handle concurrency race condition (Prisma P2002 Unique constraint failure)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      const raceUser = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (raceUser) return raceUser;
    }

    console.error("[getOrCreateDbUser] Error resolving user:", error);
    return null;
  }
}
