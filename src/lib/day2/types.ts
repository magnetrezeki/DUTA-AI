export type VerificationStatus = "unverified" | "verified";

export type OfficialSource = {
  id: string;
  name: string;
  source_url: string;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  is_demo: boolean;
};

export type RepresentativeOffice = {
  id: string;
  name: string;
  office_type: string;
  source: OfficialSource | null;
};

export type Jurisdiction = {
  id: string;
  state_name: string;
  office_id: string;
  is_demo: boolean;
  office: RepresentativeOffice | null;
};

export type ServiceCategory = {
  id: string;
  name: string;
  description: string | null;
  is_demo: boolean;
};

export type ContactChannel = {
  id: string;
  channel_type: "phone" | "whatsapp" | "email" | "website";
  label: string;
  channel_value: string;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  is_demo: boolean;
  source: OfficialSource | null;
};

export type NewsItem = {
  id: string;
  title: string;
  official_url: string;
  summary: string | null;
  published_at: string | null;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  is_demo: boolean;
  source: OfficialSource | null;
};
