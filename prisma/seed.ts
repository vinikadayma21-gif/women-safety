/**
 * SafeCity Delhi NCR — Database Seed Script
 * PLANv2 Phase 1: SafetyPlace model removed.
 * POIs now come from Google Places API at runtime (lib/google-maps.ts).
 * Remaining seeds: System admin User + sample Community Alerts.
 */

import { PrismaClient, HazardCategory, NoteType } from "@prisma/client";

const prisma = new PrismaClient();

// SafetyPlace and PlaceCategory removed (PLANv2 Phase 1). POIs = Google Places API.

async function main() {
  console.log("🌸 [SafeCity Delhi NCR] Starting database seeding...");

  // SafetyPlace seeding removed in PLANv2 Phase 1 — POIs come from Google Places API.
  console.log("ℹ️  SafetyPlace seeding skipped — POIs now served live from Google Places API.");

  // Seed System Administrator User
  const systemUser = await prisma.user.upsert({
    where: { clerkId: "system_safecity_ncr" },
    update: {},
    create: {
      clerkId: "system_safecity_ncr",
      pseudonym: "SafeCity_Official_NCR",
      reputationScore: 100,
      email: "official@safecity-delhi.org",
    },
  });
  console.log(`✅ Verified system seed user: ${systemUser.pseudonym}`);

  // Seed Sample Community Alerts for Testing & Demonstration (Delhi & Gurugram)
  const sampleNotes = [
    // Delhi Notes
    {
      userId: systemUser.id,
      noteType: NoteType.COMMUNITY_ALERT,
      hazardCategory: HazardCategory.POOR_LIGHTING,
      latitude: 28.5685,
      longitude: 77.2088,
      content: "Street lights non-functional along the underpass road near Safdarjung Hospital. Commuters advised to stick to the main road.",
      upvotesCount: 14,
      downvotesCount: 1,
      status: "ACTIVE",
    },
    {
      userId: systemUser.id,
      noteType: NoteType.COMMUNITY_ALERT,
      hazardCategory: HazardCategory.SAFE_ZONE,
      latitude: 28.633,
      longitude: 77.2185,
      content: "Well-lit 24/7 operational pre-paid auto booth and continuous police PCR presence outside Rajiv Chowk Gate 2.",
      upvotesCount: 28,
      downvotesCount: 0,
      status: "ACTIVE",
    },
    {
      userId: systemUser.id,
      noteType: NoteType.COMMUNITY_ALERT,
      hazardCategory: HazardCategory.DESERTED_AREA,
      latitude: 28.618,
      longitude: 77.185,
      content: "Isolated stretch along Upper Ridge Road with minimal pedestrian footfall after 8:30 PM. Prefer using public transit on Shankar Road.",
      upvotesCount: 9,
      downvotesCount: 0,
      status: "ACTIVE",
    },
    // Gurugram Notes
    {
      userId: systemUser.id,
      noteType: NoteType.COMMUNITY_ALERT,
      hazardCategory: HazardCategory.POOR_LIGHTING,
      latitude: 28.471,
      longitude: 77.062,
      content: "Broken street lights along the service lane approaching IFFCO Chowk flyover. Low visibility after dark.",
      upvotesCount: 18,
      downvotesCount: 1,
      status: "ACTIVE",
    },
    {
      userId: systemUser.id,
      noteType: NoteType.COMMUNITY_ALERT,
      hazardCategory: HazardCategory.SAFE_ZONE,
      latitude: 28.495,
      longitude: 77.0888,
      content: "Cyber Hub transit drop point: 24/7 active security guards, Gurugram Police PCR van, and well-illuminated cab pickup bays.",
      upvotesCount: 35,
      downvotesCount: 0,
      status: "ACTIVE",
    },
    {
      userId: systemUser.id,
      noteType: NoteType.COMMUNITY_ALERT,
      hazardCategory: HazardCategory.DESERTED_AREA,
      latitude: 28.412,
      longitude: 77.051,
      content: "Southern Peripheral Road (SPR) extension stretch has very low commercial activity and empty footpaths after 9:00 PM.",
      upvotesCount: 12,
      downvotesCount: 0,
      status: "ACTIVE",
    },
  ];

  let notesCount = 0;
  for (const note of sampleNotes) {
    const existing = await prisma.locationNote.findFirst({
      where: {
        userId: note.userId,
        latitude: note.latitude,
        longitude: note.longitude,
      },
    });

    if (!existing) {
      await prisma.locationNote.create({
        data: note,
      });
      notesCount++;
    }
  }
  console.log(`✅ Seeded ${notesCount} initial verified community alerts across Delhi & Gurugram.`);

  console.log("🎉 [SafeCity Delhi NCR] Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
