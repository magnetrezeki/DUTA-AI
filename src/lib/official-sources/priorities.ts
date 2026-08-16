export const contentPriority = {
  P0: ["EMERGENCY", "SAFETY", "IMMIGRATION_CHANGE", "PASSPORT", "SPLP", "REPATRIATION", "PROTECTION", "MIGRANT_WORKER", "LEGAL_AID", "SCAM_ALERT"],
  P1: ["EDUCATION", "SCHOLARSHIP", "TRANSPORT", "OUTREACH", "TRADE", "COMMUNITY"],
  P2: ["DIPLOMACY", "CEREMONIAL", "CULTURE", "GENERAL_EVENT"],
} as const;

export const contentPriorityRule =
  "P0 content ranks above P1 and P2 even when lower-priority content is slightly newer.";
