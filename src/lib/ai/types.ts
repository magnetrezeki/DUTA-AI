export const DUTA_INTENTS = [
  "consular_help", "representative_office", "official_contact", "official_news",
  "find_job", "job_detail", "find_place", "find_health_facility",
  "find_organization", "find_event", "platform_help", "general_duta_question",
] as const;

export type DutaIntent = (typeof DUTA_INTENTS)[number];
export type DataClassification =
  | "PUBLIC_READ"
  | "USER_OWNED_READ"
  | "AUTHORIZED_ROLE_READ"
  | "PROHIBITED_AI_ACCESS";

export type DutaSource = {
  label: string;
  url?: string;
  verificationStatus: "verified" | "community" | "platform";
  lastVerifiedAt?: string;
};

export type DutaAction = { label: string; href: string };

export type DutaResponse = {
  answer: string;
  intent: DutaIntent;
  agent: string;
  confidence: number;
  entities: Record<string, string>;
  sources: DutaSource[];
  actions: DutaAction[];
  warnings: string[];
  follow_up_suggestions: string[];
  requestId: string;
};

export type ToolContext = {
  countryCode: string;
  userId: string | null;
  query: string;
  entities: Record<string, string>;
};

export type ToolResult = Pick<DutaResponse, "answer" | "sources" | "actions" | "warnings">;

export type DutaTool = {
  name: string;
  intent: DutaIntent;
  classification: DataClassification;
  execute(context: ToolContext): Promise<ToolResult>;
};
