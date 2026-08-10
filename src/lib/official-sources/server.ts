import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OfficialSourceCategory, PublicOfficialSource, SourcePlatform } from "./types";

const publicColumns = "id,institution_code,name,unit_name,country_code,city,platform,handle,source_url,official_website,verification_level,registry_status,priority,category_scope,enabled,last_verified_at,last_successful_fetch_at,fetch_method";

async function enabledQuery() {
  const supabase = await createClient();
  return supabase
    .from("official_sources")
    .select(publicColumns)
    .eq("enabled", true)
    .eq("registry_status", "VERIFIED")
    .in("verification_level", ["A", "B"])
    .order("priority")
    .order("name");
}

export async function getEnabledOfficialSources(): Promise<PublicOfficialSource[]> {
  const { data, error } = await enabledQuery();
  if (error) throw new Error("Official sources are unavailable.");
  return (data ?? []) as unknown as PublicOfficialSource[];
}

export async function getOfficialSourcesByInstitution(institutionCode: string) {
  const sources = await getEnabledOfficialSources();
  return sources.filter((source) => source.institution_code === institutionCode);
}

export async function getOfficialSourcesByCategory(category: OfficialSourceCategory) {
  const sources = await getEnabledOfficialSources();
  return sources.filter((source) => source.category_scope.includes(category));
}

export async function getOfficialSourcesByPlatform(platform: SourcePlatform) {
  const sources = await getEnabledOfficialSources();
  return sources.filter((source) => source.platform === platform);
}
