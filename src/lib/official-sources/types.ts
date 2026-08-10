export const verificationLevels = ["A", "B", "C", "LEGACY", "HOLD"] as const;
export const verificationStatuses = ["VERIFIED", "REVIEW", "LEGACY", "HOLD"] as const;
export const sourcePriorities = ["P0", "P1", "P2"] as const;
export const sourcePlatforms = ["website", "instagram", "facebook", "x", "youtube", "tiktok"] as const;
export const officialSourceCategories = [
  "GENERAL_OFFICIAL", "CONSULAR", "PROTECTION", "IMMIGRATION",
  "MIGRANT_WORKER", "EMPLOYMENT", "REPATRIATION", "LEGAL", "LEGAL_AID",
  "EDUCATION", "STUDENT", "SCHOLARSHIP", "CULTURE", "TRANSPORT",
  "SEAFARER", "TRAVEL", "TRADE", "BUSINESS", "EXPORT", "ECONOMY",
  "SECURITY", "SCAM_ALERT", "LAW_ENFORCEMENT", "COMMUNITY", "LOCAL_ALERT",
] as const;

export type VerificationLevel = (typeof verificationLevels)[number];
export type RegistryVerificationStatus = (typeof verificationStatuses)[number];
export type SourcePriority = (typeof sourcePriorities)[number];
export type SourcePlatform = (typeof sourcePlatforms)[number];
export type OfficialSourceCategory = (typeof officialSourceCategories)[number];

export type RegistryOfficialSource = {
  id: string;
  institution_code: string | null;
  name: string;
  unit_name: string | null;
  country_code: string | null;
  city: string | null;
  platform: SourcePlatform | null;
  handle: string | null;
  source_url: string | null;
  official_website: string | null;
  verification_level: VerificationLevel;
  registry_status: RegistryVerificationStatus;
  priority: SourcePriority;
  category_scope: OfficialSourceCategory[];
  enabled: boolean;
  last_verified_at: string | null;
  last_successful_fetch_at: string | null;
  fetch_method: string | null;
  notes: string | null;
};

export type PublicOfficialSource = Omit<RegistryOfficialSource, "notes">;

export const verificationLevelLabels: Record<VerificationLevel, string> = {
  A: "Verified",
  B: "Cross-Verified",
  C: "Probable",
  LEGACY: "Legacy",
  HOLD: "Hold",
};

export function isVerificationLevel(value: string): value is VerificationLevel {
  return verificationLevels.includes(value as VerificationLevel);
}

export function isRegistryVerificationStatus(value: string): value is RegistryVerificationStatus {
  return verificationStatuses.includes(value as RegistryVerificationStatus);
}

export function isSourcePriority(value: string): value is SourcePriority {
  return sourcePriorities.includes(value as SourcePriority);
}

export function validCategoryScope(values: string[]): values is OfficialSourceCategory[] {
  return values.length <= officialSourceCategories.length
    && new Set(values).size === values.length
    && values.every((value) => officialSourceCategories.includes(value as OfficialSourceCategory));
}

export function canEnableSource(level: VerificationLevel, status: RegistryVerificationStatus) {
  return (level === "A" || level === "B") && status === "VERIFIED";
}
