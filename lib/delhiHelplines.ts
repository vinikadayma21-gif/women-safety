/**
 * Static directory of Delhi NCR emergency helpline numbers.
 * Organised by category for the offline-capable Emergency Directory page.
 * All numbers are verified public emergency lines.
 */

export interface Helpline {
  /** Unique identifier */
  id: string;
  /** Display name of the service */
  name: string;
  /** Primary dialing number */
  number: string;
  /** Short description of when to call */
  description: string;
  /** Availability hours */
  availability: string;
  /** Emoji icon representing the service */
  icon: string;
  /** Category grouping */
  category: HelplineCategory;
  /** Optional alternate numbers */
  alternateNumbers?: string[];
}

export type HelplineCategory =
  | "EMERGENCY"
  | "WOMEN_SAFETY"
  | "MEDICAL"
  | "POLICE"
  | "CHILD_SAFETY"
  | "MENTAL_HEALTH"
  | "LEGAL";

export interface HelplineGroup {
  category: HelplineCategory;
  label: string;
  icon: string;
  color: string;
  helplines: Helpline[];
}

export const DELHI_HELPLINES: HelplineGroup[] = [
  {
    category: "EMERGENCY",
    label: "Emergency Services",
    icon: "🆘",
    color: "#ef4444",
    helplines: [
      {
        id: "emergency-112",
        name: "National Emergency Number",
        number: "112",
        description:
          "Unified emergency response — connects to Police, Fire & Ambulance instantly. Priority line for any life-threatening situation.",
        availability: "24/7 — Always Active",
        icon: "🆘",
        category: "EMERGENCY",
      },
      {
        id: "emergency-fire-101",
        name: "Delhi Fire Service",
        number: "101",
        description:
          "Fire emergencies, road accidents with fire, and rescue operations across Delhi NCR.",
        availability: "24/7 — All Stations",
        icon: "🚒",
        category: "EMERGENCY",
      },
      {
        id: "emergency-ambulance-108",
        name: "Ambulance (CATS Delhi)",
        number: "108",
        description:
          "Centralised Accident & Trauma Services — free medical transport and first responder support.",
        availability: "24/7 — Free Service",
        icon: "🚑",
        category: "EMERGENCY",
        alternateNumbers: ["1911"],
      },
    ],
  },
  {
    category: "WOMEN_SAFETY",
    label: "Women Safety & Support",
    icon: "🛡️",
    color: "#ec4899",
    helplines: [
      {
        id: "women-1091",
        name: "Women Helpline (Delhi Police)",
        number: "1091",
        description:
          "Delhi Police 24-hour helpline dedicated to women in distress. Report harassment, stalking, domestic violence, or any safety threat.",
        availability: "24/7 — Delhi Police",
        icon: "👮‍♀️",
        category: "WOMEN_SAFETY",
      },
      {
        id: "women-1090",
        name: "UP Women Helpline",
        number: "1090",
        description:
          "Uttar Pradesh women safety helpline — covers Noida, Greater Noida & Ghaziabad areas of NCR. Complaints can be filed online.",
        availability: "24/7 — UP Police",
        icon: "🛡️",
        category: "WOMEN_SAFETY",
      },
      {
        id: "women-181",
        name: "Women Helpline (WCD Ministry)",
        number: "181",
        description:
          "Ministry of Women and Child Development national helpline. Counselling, legal advice, rescue operations, and shelter information.",
        availability: "24/7 — National",
        icon: "📞",
        category: "WOMEN_SAFETY",
      },
      {
        id: "women-pink-pcr",
        name: "Delhi Police PCR (Women)",
        number: "100",
        description:
          "Request an immediate PCR Police Control Room van response. Ask the dispatcher for the nearest Pink Booth or women patrol unit.",
        availability: "24/7 — Immediate Response",
        icon: "🚔",
        category: "WOMEN_SAFETY",
      },
      {
        id: "women-dcw",
        name: "Delhi Commission for Women",
        number: "011-23379181",
        description:
          "File complaints of harassment, acid attack, dowry, or trafficking. DCW provides legal and rehabilitation support.",
        availability: "Mon–Sat, 9 AM – 6 PM",
        icon: "⚖️",
        category: "WOMEN_SAFETY",
        alternateNumbers: ["011-23379182"],
      },
    ],
  },
  {
    category: "MEDICAL",
    label: "Medical Emergencies",
    icon: "🏥",
    color: "#10b981",
    helplines: [
      {
        id: "medical-aiims",
        name: "AIIMS Delhi Emergency",
        number: "011-26588500",
        description:
          "All India Institute of Medical Sciences — premier trauma and emergency care in South Delhi. 24/7 ER for critical cases.",
        availability: "24/7 Emergency",
        icon: "🏥",
        category: "MEDICAL",
        alternateNumbers: ["011-26588700"],
      },
      {
        id: "medical-safdarjung",
        name: "Safdarjung Hospital ER",
        number: "011-26707444",
        description:
          "Free government hospital with large trauma centre. Located in West Delhi; covers patients from across NCR.",
        availability: "24/7 Emergency",
        icon: "🏥",
        category: "MEDICAL",
      },
      {
        id: "medical-rml",
        name: "Ram Manohar Lohia Hospital",
        number: "011-23404040",
        description:
          "Central Delhi government hospital near Patel Chowk Metro. Free emergency care and ambulance referrals.",
        availability: "24/7 Emergency",
        icon: "🏥",
        category: "MEDICAL",
      },
      {
        id: "medical-poison",
        name: "Delhi Poison Control",
        number: "011-26589391",
        description:
          "Poison Control & Drug Overdose guidance by AIIMS Delhi. Call immediately after toxic substance ingestion.",
        availability: "24/7",
        icon: "⚗️",
        category: "MEDICAL",
        alternateNumbers: ["1800-11-6117"],
      },
    ],
  },
  {
    category: "POLICE",
    label: "Police & Law Enforcement",
    icon: "👮",
    color: "#3b82f6",
    helplines: [
      {
        id: "police-100",
        name: "Delhi Police Control Room",
        number: "100",
        description:
          "Direct connection to Delhi Police Control Room. PCR vans are dispatched to your location within minutes.",
        availability: "24/7",
        icon: "🚔",
        category: "POLICE",
      },
      {
        id: "police-cyber-1930",
        name: "National Cyber Crime Helpline",
        number: "1930",
        description:
          "Report online fraud, cyberstalking, non-consensual sharing of photos/videos, and social media harassment.",
        availability: "24/7 — National",
        icon: "💻",
        category: "POLICE",
      },
      {
        id: "police-anti-stalking",
        name: "Delhi Police Anti-Stalking Unit",
        number: "011-23490177",
        description:
          "Dedicated unit for reporting stalking, threatening calls, and repeat harassment. File an official FIR.",
        availability: "Mon–Sat, 10 AM – 6 PM",
        icon: "🔍",
        category: "POLICE",
      },
      {
        id: "police-155370",
        name: "Haryana Police Emergency",
        number: "155370",
        description:
          "Covers Gurugram, Faridabad, and other Haryana NCR zones. Essential for emergencies in Cyber Hub area.",
        availability: "24/7",
        icon: "🛡️",
        category: "POLICE",
      },
    ],
  },
  {
    category: "CHILD_SAFETY",
    label: "Child Safety",
    icon: "👶",
    color: "#f59e0b",
    helplines: [
      {
        id: "child-1098",
        name: "Childline India",
        number: "1098",
        description:
          "24/7 helpline for children in distress — abuse, trafficking, missing children, and runaway situations.",
        availability: "24/7 — Free & Confidential",
        icon: "👶",
        category: "CHILD_SAFETY",
      },
      {
        id: "child-missing",
        name: "Missing Child & Women (Delhi)",
        number: "011-27659393",
        description:
          "Delhi Police missing persons bureau. File a report for missing children or women at any hour.",
        availability: "24/7",
        icon: "🔍",
        category: "CHILD_SAFETY",
      },
    ],
  },
  {
    category: "MENTAL_HEALTH",
    label: "Mental Health & Crisis",
    icon: "💙",
    color: "#8b5cf6",
    helplines: [
      {
        id: "mental-iCall",
        name: "iCall — TISS",
        number: "9152987821",
        description:
          "Professional psychological counselling and crisis support by Tata Institute of Social Sciences counsellors.",
        availability: "Mon–Sat, 8 AM – 10 PM",
        icon: "🧠",
        category: "MENTAL_HEALTH",
      },
      {
        id: "mental-vandrevala",
        name: "Vandrevala Foundation",
        number: "1860-2662-345",
        description:
          "Free 24/7 mental health and suicide prevention support. Multi-language counsellors available.",
        availability: "24/7 — Free & Confidential",
        icon: "💙",
        category: "MENTAL_HEALTH",
        alternateNumbers: ["1800-2333-330"],
      },
      {
        id: "mental-snehi",
        name: "SNEHI — Suicide Prevention",
        number: "044-24640050",
        description:
          "Crisis intervention and suicide prevention helpline. Talk to a trained counsellor anonymously.",
        availability: "Daily, 8 AM – 10 PM",
        icon: "🌱",
        category: "MENTAL_HEALTH",
      },
    ],
  },
  {
    category: "LEGAL",
    label: "Legal Aid & Rights",
    icon: "⚖️",
    color: "#64748b",
    helplines: [
      {
        id: "legal-nalsa",
        name: "NALSA Legal Aid",
        number: "15100",
        description:
          "National Legal Services Authority — free legal aid for women, SC/ST, and economically weaker sections.",
        availability: "Mon–Sat, 10 AM – 5 PM",
        icon: "⚖️",
        category: "LEGAL",
      },
      {
        id: "legal-delhi-slsa",
        name: "Delhi State Legal Services",
        number: "011-23385235",
        description:
          "Delhi SLSA provides free legal counsel for FIR filing, bail, domestic violence protection orders.",
        availability: "Mon–Fri, 10 AM – 5 PM",
        icon: "🏛️",
        category: "LEGAL",
      },
    ],
  },
];

/** Flat list of all helplines — useful for search or export. */
export const ALL_HELPLINES: Helpline[] = DELHI_HELPLINES.flatMap(
  (group) => group.helplines
);
