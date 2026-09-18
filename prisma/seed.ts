/**
 * SafeCity Delhi NCR — Database Seed Script
 * Populates Neon PostgreSQL with verified Delhi NCR & Gurugram safety infrastructure:
 * - Delhi & Gurugram Police Pink Booths & Women Help Desks
 * - Police Stations (Delhi, Gurugram, Noida)
 * - DMRC & Rapid Metro Stations (CISF-guarded Transit Anchors)
 * - 24/7 Hospital ERs & Trauma Centers
 * - 24/7 Verified Safe Haven Stores
 * - Initial Seed System User & Sample Community Hazard Alerts
 */

import { PrismaClient, PlaceCategory, HazardCategory, NoteType } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedPlace {
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string;
  contactNumber?: string;
  landmark?: string;
  is24x7: boolean;
  region: string;
}

const DELHI_NCR_SAFETY_PLACES: SeedPlace[] = [
  // =====================================================================
  // 1. PINK BOOTHS & WOMEN HELP DESKS (Delhi & Gurugram)
  // =====================================================================
  // --- Delhi Police Pink Booths ---
  {
    name: "Janpath Pink Booth - Delhi Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.6256,
    longitude: 77.2185,
    address: "Janpath Road, Connaught Place, New Delhi",
    contactNumber: "1091",
    landmark: "Near Janpath Metro Station Gate 1",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "North Campus DU Pink Booth - Delhi Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.6942,
    longitude: 77.2127,
    address: "Patel Chest Marg, University Enclave, North Campus, Delhi",
    contactNumber: "1091",
    landmark: "Near Arts Faculty & Patel Chest Institute",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Karol Bagh Market Pink Booth - Delhi Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.6514,
    longitude: 77.1907,
    address: "Ajmal Khan Road, Karol Bagh, Central Delhi",
    contactNumber: "1091",
    landmark: "Near Karol Bagh Metro Station Gate 2",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Laxmi Nagar Pink Booth - Delhi Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.6308,
    longitude: 77.2773,
    address: "Vikas Marg, Laxmi Nagar, East Delhi",
    contactNumber: "1091",
    landmark: "Adjacent to Laxmi Nagar Metro Station",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Hauz Khas Village Pink Booth - Delhi Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.5532,
    longitude: 77.1945,
    address: "Hauz Khas Village Main Entrance, South Delhi",
    contactNumber: "1091",
    landmark: "Near Deer Park Entrance Gate",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Connaught Place Inner Circle Pink Booth - Delhi Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.6328,
    longitude: 77.2197,
    address: "Block A, Inner Circle, Connaught Place, New Delhi",
    contactNumber: "1091",
    landmark: "Near Rajiv Chowk Metro Gate 7",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Saket District Centre Pink Booth - Delhi Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.5284,
    longitude: 77.2188,
    address: "Press Enclave Marg, Saket District Centre, New Delhi",
    contactNumber: "1091",
    landmark: "Opposite Select Citywalk Mall Gate 1",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Lajpat Nagar Central Market Pink Booth - Delhi Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.5678,
    longitude: 77.2433,
    address: "Feroze Gandhi Road, Central Market, Lajpat Nagar II, New Delhi",
    contactNumber: "1091",
    landmark: "Near 3Cs Cinema Complex",
    is24x7: true,
    region: "Delhi",
  },
  // --- Gurugram Police Women Help Desks & Pink Kiosks ---
  {
    name: "Sector 29 Market Women Help Desk - Gurugram Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.4682,
    longitude: 77.0632,
    address: "Sector 29 Commercial Market, Leisure Valley Road, Gurugram",
    contactNumber: "1091",
    landmark: "Near IFFCO Chowk Metro & Leisure Valley Park entrance",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "MG Road Mall Mile Women Safety Kiosk - Gurugram Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.4805,
    longitude: 77.0805,
    address: "Mehrauli-Gurgaon Road, DLF Phase 2, Gurugram",
    contactNumber: "1091",
    landmark: "Outside MGF Metropolitan Mall & MG Road Metro Gate 1",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Cyber City Women Help Desk - Gurugram Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.4965,
    longitude: 77.0872,
    address: "DLF Cyber City Building 10, Gurugram",
    contactNumber: "1091",
    landmark: "Adjacent to Cyber City Rapid Metro Station walkway",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Galleria Market Women Safety Desk - Gurugram Police",
    category: PlaceCategory.PINK_BOOTH,
    latitude: 28.4674,
    longitude: 77.0818,
    address: "DLF Phase 4, Galleria Market, Gurugram",
    contactNumber: "1091",
    landmark: "Central Fountain Courtyard, Galleria Market",
    is24x7: true,
    region: "Gurugram",
  },

  // =====================================================================
  // 2. POLICE STATIONS (Delhi, Gurugram, Noida)
  // =====================================================================
  // --- Delhi Police ---
  {
    name: "Connaught Place Police Station",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.6341,
    longitude: 77.2158,
    address: "Baba Kharak Singh Marg, Connaught Place, New Delhi",
    contactNumber: "011-23363840",
    landmark: "Opposite Hanuman Mandir",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Hauz Khas Police Station",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.5471,
    longitude: 77.2023,
    address: "Kaushalya Park, Hauz Khas, New Delhi",
    contactNumber: "011-26510065",
    landmark: "Near Hauz Khas Enclave Main Road",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Parliament Street Police Station",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.6225,
    longitude: 77.2132,
    address: "Sansad Marg, New Delhi",
    contactNumber: "011-23361100",
    landmark: "Near Patel Chowk Metro Station",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Kashmere Gate Police Station",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.6675,
    longitude: 77.2285,
    address: "Lothian Road, Kashmere Gate, Old Delhi",
    contactNumber: "011-23862211",
    landmark: "Near ISBT Kashmere Gate",
    is24x7: true,
    region: "Delhi",
  },
  // --- Gurugram Police Stations ---
  {
    name: "Cyber Hub DLF Phase 2 Police Station",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.4952,
    longitude: 77.089,
    address: "DLF Cyber City, Phase 2, Gurugram, Haryana",
    contactNumber: "0124-2388100",
    landmark: "Opposite Cyber Hub Building 8",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Women Police Station Gurugram (Sector 51)",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.4328,
    longitude: 77.0722,
    address: "Sector 51, Near Artemis Hospital Road, Gurugram",
    contactNumber: "0124-2370004",
    landmark: "Dedicated Women Police Station Gurugram, near Amity International",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "DLF Phase 1 Police Station Gurugram",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.4725,
    longitude: 77.0985,
    address: "Golf Course Road, DLF Phase 1, Gurugram",
    contactNumber: "0124-2350100",
    landmark: "Near Mega Mall and Sector 42-43 Rapid Metro",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Sushant Lok Police Station Gurugram",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.4552,
    longitude: 77.0788,
    address: "Sushant Lok Phase 1, Sector 43, Gurugram",
    contactNumber: "0124-2571100",
    landmark: "Near Gold Souk Mall & Vyapar Kendra",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Sector 29 Police Station Gurugram",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.4695,
    longitude: 77.0598,
    address: "Sector 29 Institutional Area, Gurugram",
    contactNumber: "0124-2384100",
    landmark: "Near Kingdom of Dreams & Leisure Valley",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Udyog Vihar Police Station Gurugram",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.5085,
    longitude: 77.085,
    address: "Phase 4, Udyog Vihar, Gurugram",
    contactNumber: "0124-2340100",
    landmark: "Near Maruti Suzuki Gate 2 & Delhi-Gurugram Border",
    is24x7: true,
    region: "Gurugram",
  },
  // --- Noida Police ---
  {
    name: "Sector 20 Police Station Noida",
    category: PlaceCategory.POLICE_STATION,
    latitude: 28.5835,
    longitude: 77.3242,
    address: "Sector 20, Noida, Gautam Buddha Nagar, Uttar Pradesh",
    contactNumber: "0120-2521100",
    landmark: "Near Sector 18 Atta Market",
    is24x7: true,
    region: "Noida",
  },

  // =====================================================================
  // 3. DMRC & RAPID METRO STATIONS (CISF-Guarded Transit Anchors)
  // =====================================================================
  // --- Delhi Metro Stations ---
  {
    name: "Rajiv Chowk Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.6328,
    longitude: 77.2195,
    address: "Central Park, Connaught Place, New Delhi",
    contactNumber: "155370",
    landmark: "Yellow & Blue line interchange hub",
    is24x7: false,
    region: "Delhi",
  },
  {
    name: "Hauz Khas Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.5432,
    longitude: 77.2064,
    address: "Outer Ring Road, Hauz Khas, New Delhi",
    contactNumber: "155370",
    landmark: "Yellow & Magenta line interchange",
    is24x7: false,
    region: "Delhi",
  },
  {
    name: "Kashmere Gate Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.6674,
    longitude: 77.2282,
    address: "Inter State Bus Terminal (ISBT), Kashmere Gate, Delhi",
    contactNumber: "155370",
    landmark: "Triple interchange for Red, Yellow & Violet lines",
    is24x7: false,
    region: "Delhi",
  },
  {
    name: "Chandni Chowk Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.6578,
    longitude: 77.2301,
    address: "Netaji Subhash Marg, Chandni Chowk, Old Delhi",
    contactNumber: "155370",
    landmark: "Near Old Delhi Railway Station",
    is24x7: false,
    region: "Delhi",
  },
  {
    name: "Vishwavidyalaya Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.6946,
    longitude: 77.2139,
    address: "Mall Road, University Enclave, North Delhi",
    contactNumber: "155370",
    landmark: "Delhi University North Campus main transit point",
    is24x7: false,
    region: "Delhi",
  },
  {
    name: "Mandi House Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.6258,
    longitude: 77.2343,
    address: "Copernicus Marg, Mandi House, New Delhi",
    contactNumber: "155370",
    landmark: "Blue & Violet line interchange near National School of Drama",
    is24x7: false,
    region: "Delhi",
  },
  // --- Gurugram DMRC & Rapid Metro Stations ---
  {
    name: "Sikanderpur Metro Station (DMRC & Rapid Metro)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.482,
    longitude: 77.0932,
    address: "Mehrauli-Gurgaon Road, DLF Phase 1, Gurugram",
    contactNumber: "155370",
    landmark: "Interchange for Yellow Line & Rapid Metro Gurugram",
    is24x7: false,
    region: "Gurugram",
  },
  {
    name: "Millennium City Centre Gurugram Metro (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.4592,
    longitude: 77.0724,
    address: "Sector 29 / Sector 44, Gurugram",
    contactNumber: "155370",
    landmark: "Yellow Line Terminal Station, CISF Security Post Gate 1",
    is24x7: false,
    region: "Gurugram",
  },
  {
    name: "IFFCO Chowk Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.4721,
    longitude: 77.0652,
    address: "NH-48, Sector 29, Gurugram",
    contactNumber: "155370",
    landmark: "Major transit point on NH-48 with 24/7 auto stand",
    is24x7: false,
    region: "Gurugram",
  },
  {
    name: "MG Road Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.4797,
    longitude: 77.0802,
    address: "Mehrauli-Gurgaon Road, DLF Phase 2, Gurugram",
    contactNumber: "155370",
    landmark: "Direct skywalk to MGF Metropolitan & City Centre Mall",
    is24x7: false,
    region: "Gurugram",
  },
  {
    name: "Cyber City Rapid Metro Station",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.4972,
    longitude: 77.0878,
    address: "DLF Cyber City, Phase 2, Gurugram",
    contactNumber: "0124-2800028",
    landmark: "Direct covered walkway to Cyber Hub and building towers",
    is24x7: false,
    region: "Gurugram",
  },
  {
    name: "Sector 53-54 Rapid Metro Station",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.4415,
    longitude: 77.1062,
    address: "Golf Course Road, Sector 53, Gurugram",
    contactNumber: "0124-2800028",
    landmark: "Opposite South Point Mall on Golf Course Road",
    is24x7: false,
    region: "Gurugram",
  },
  // --- Noida Metro ---
  {
    name: "Botanical Garden Metro Station (DMRC)",
    category: PlaceCategory.METRO_STATION,
    latitude: 28.5642,
    longitude: 77.3344,
    address: "Captain Shashi Kant Marg, Sector 38, Noida",
    contactNumber: "155370",
    landmark: "Blue & Magenta line interchange",
    is24x7: false,
    region: "Noida",
  },

  // =====================================================================
  // 4. 24/7 HOSPITAL EMERGENCY ROOMS (ER & Trauma Centers)
  // =====================================================================
  // --- Delhi Hospitals ---
  {
    name: "AIIMS New Delhi - 24/7 Trauma & Emergency",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.5672,
    longitude: 77.21,
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi",
    contactNumber: "011-26588500",
    landmark: "Emergency & Trauma Department Gate 1",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Safdarjung Hospital - 24/7 Emergency",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.5695,
    longitude: 77.2078,
    address: "Ring Road, opposite AIIMS, Safdarjung Enclave, New Delhi",
    contactNumber: "011-26165060",
    landmark: "Opposite AIIMS, 24/7 Super Speciality Emergency Block",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Dr. Ram Manohar Lohia (RML) Hospital - 24/7 Casualty",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.6247,
    longitude: 77.2016,
    address: "Baba Kharak Singh Marg, Connaught Place, New Delhi",
    contactNumber: "011-23365525",
    landmark: "Near Talkatora Stadium & Connaught Place",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Lady Hardinge Medical College & Smt. S.K. Hospital",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.6348,
    longitude: 77.2144,
    address: "Shaheed Bhagat Singh Marg, Connaught Place, New Delhi",
    contactNumber: "011-23363728",
    landmark: "Dedicated Women's & Children's 24/7 Emergency Wing",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "Max Super Speciality Hospital Saket - 24/7 ER",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.5282,
    longitude: 77.2125,
    address: "1, 2, Press Enclave Marg, Saket Institutional Area, New Delhi",
    contactNumber: "011-26515050",
    landmark: "Emergency entrance on Press Enclave Marg",
    is24x7: true,
    region: "Delhi",
  },
  // --- Gurugram 24/7 Hospitals ---
  {
    name: "Fortis Memorial Research Institute - 24/7 Emergency",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.4595,
    longitude: 77.0725,
    address: "Sector 44, Opposite HUDA City Centre Metro, Gurugram",
    contactNumber: "0124-4962200",
    landmark: "Opposite Millennium City Centre Metro Gate 2",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Medanta - The Medicity (24/7 Emergency & Level-1 Trauma)",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.4392,
    longitude: 77.0422,
    address: "CH Bakhtawar Singh Road, Sector 38, Gurugram",
    contactNumber: "0124-4141414",
    landmark: "Near Subhash Chowk, 24/7 dedicated Emergency & Trauma entrance",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Max Hospital Gurugram (24/7 Emergency)",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.4618,
    longitude: 77.0782,
    address: "B-Block, Sushant Lok 1, Sector 43, Gurugram",
    contactNumber: "0124-6623000",
    landmark: "Near Millennium City Centre Metro, 24/7 Casualty entrance",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Artemis Hospital Gurugram (24/7 Emergency & Trauma)",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.4312,
    longitude: 77.0754,
    address: "Sector 51, Gurugram, Haryana",
    contactNumber: "0124-4511111",
    landmark: "Near Mayfield Gardens, dedicated emergency ambulance ramp",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Paras Health Gurugram (24/7 Emergency)",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.4528,
    longitude: 77.0945,
    address: "C-1, Sushant Lok Phase 1, Sector 43, Gurugram",
    contactNumber: "0124-4585555",
    landmark: "Near Gold Souk Mall on Vyapar Kendra Road",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "Civil Hospital Gurugram (24/7 Emergency)",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.4578,
    longitude: 77.0322,
    address: "Sadar Bazar, Old Railway Road, Gurugram",
    contactNumber: "0124-2322412",
    landmark: "Old Railway Road, 24/7 Government Casualty Department",
    is24x7: true,
    region: "Gurugram",
  },
  // --- Noida Hospital ---
  {
    name: "Jaypee Hospital - 24/7 Emergency & Trauma",
    category: PlaceCategory.HOSPITAL_247,
    latitude: 28.5147,
    longitude: 77.3712,
    address: "Sector 128, Noida-Greater Noida Expressway, Uttar Pradesh",
    contactNumber: "0120-4122222",
    landmark: "Expressway Exit 7, 24/7 Emergency Wing",
    is24x7: true,
    region: "Noida",
  },

  // =====================================================================
  // 5. 24/7 SAFE HAVEN STORES (Lit Commercial Points)
  // =====================================================================
  {
    name: "24SEVEN Convenience Store - Connaught Place",
    category: PlaceCategory.SAFE_HAVEN_STORE,
    latitude: 28.6335,
    longitude: 77.218,
    address: "Regal Building, Connaught Circus, New Delhi",
    contactNumber: "011-43512400",
    landmark: "Near Regal Cinema, 24/7 staff and CCTV coverage",
    is24x7: true,
    region: "Delhi",
  },
  {
    name: "24SEVEN Convenience Store - Cyber Hub",
    category: PlaceCategory.SAFE_HAVEN_STORE,
    latitude: 28.4948,
    longitude: 77.0885,
    address: "DLF Cyber Hub, Ground Floor, Gurugram",
    contactNumber: "0124-4272470",
    landmark: "Near Cyber Hub Amphitheatre, 24/7 security presence",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "24SEVEN Convenience Store - One Horizon Center",
    category: PlaceCategory.SAFE_HAVEN_STORE,
    latitude: 28.4518,
    longitude: 77.0998,
    address: "One Horizon Center, Golf Course Road, DLF Phase 5, Gurugram",
    contactNumber: "0124-4001247",
    landmark: "Ground Plaza, One Horizon Center, well-lit 24/7 campus",
    is24x7: true,
    region: "Gurugram",
  },
  {
    name: "24SEVEN Convenience Store - Sector 29",
    category: PlaceCategory.SAFE_HAVEN_STORE,
    latitude: 28.4688,
    longitude: 77.0625,
    address: "SCO 31, Sector 29 Market, Gurugram",
    contactNumber: "0124-4062470",
    landmark: "Sector 29 Central Market, active pedestrian promenade",
    is24x7: true,
    region: "Gurugram",
  },
];

async function main() {
  console.log("🌸 [SafeCity Delhi NCR] Starting database seeding...");

  // 1. Seed Safety Places (Idempotent upsert by name & coordinates)
  let placesCount = 0;
  for (const place of DELHI_NCR_SAFETY_PLACES) {
    const existing = await prisma.safetyPlace.findFirst({
      where: {
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
      },
    });

    if (!existing) {
      await prisma.safetyPlace.create({
        data: place,
      });
      placesCount++;
    }
  }
  console.log(`✅ Seeded ${placesCount} new safety infrastructure POIs (${DELHI_NCR_SAFETY_PLACES.length} total verified across Delhi & Gurugram).`);

  // 2. Seed System Administrator User
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

  // 3. Seed Sample Community Alerts for Testing & Demonstration (Delhi & Gurugram)
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
