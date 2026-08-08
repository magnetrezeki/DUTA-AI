export type MapCategory = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
};

export type CommunityPlace = {
  id: string;
  name: string;
  description: string | null;
  address_text: string;
  city: string;
  state_region: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website_url: string | null;
  trust_label: "community_unverified" | "community_confirmed" | "trusted_contributor_confirmed" | "admin_reviewed";
  category: { id: string; name: string; slug: string } | null;
};

export const trustLabels: Record<CommunityPlace["trust_label"], string> = {
  community_unverified: "Komunitas - belum dikonfirmasi",
  community_confirmed: "Dikonfirmasi komunitas",
  trusted_contributor_confirmed: "Dikonfirmasi kontributor tepercaya",
  admin_reviewed: "Ditinjau moderator",
};
