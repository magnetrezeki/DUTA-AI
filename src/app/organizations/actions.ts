"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const text = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
const uuid = (input: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input);
const https = (input: string) => { try { return !input || new URL(input).protocol === "https:"; } catch { return false; } };
function finish(path: string, ok: boolean): never { revalidatePath(path); redirect(`${path}${path.includes("?") ? "&" : "?"}${ok ? "success=submitted" : "error=failed"}`); }

export async function submitOrganization(data: FormData) {
  const { user, profile } = await requireOnboardedUser();
  const slug = text(data, "slug"); const name = text(data, "name"); const description = text(data, "description"); const city = text(data, "city"); const state = text(data, "state"); const website = text(data, "website");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || name.length < 2 || description.length < 20 || city.length < 2 || state.length < 2 || !https(website)) finish("/organizations", false);
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").insert({ country_code: profile.current_country_code, slug, name, description, city, state_region: state, public_email: text(data, "publicEmail") || null, website_url: website || null, submitted_by: user.id });
  finish("/organizations", !error);
}

export async function claimOrganization(data: FormData) {
  const { user } = await requireOnboardedUser(); const organizationId = text(data, "organizationId"); const evidence = text(data, "evidenceUrl");
  if (!uuid(organizationId) || text(data, "reason").length < 20 || !https(evidence)) finish("/organizations", false);
  const supabase = await createClient(); const { error } = await supabase.from("organization_claims").insert({ organization_id: organizationId, claimant_id: user.id, reason: text(data, "reason"), evidence_url: evidence || null });
  finish("/organizations", !error);
}

export async function joinOrganization(data: FormData) {
  const { user } = await requireOnboardedUser(); const organizationId = text(data, "organizationId"); const path = text(data, "returnPath") || "/organizations";
  if (!uuid(organizationId)) finish("/organizations", false);
  const supabase = await createClient(); const { error } = await supabase.from("organization_memberships").insert({ organization_id: organizationId, user_id: user.id });
  finish(path.startsWith("/") ? path : "/organizations", !error);
}

export async function registerEvent(data: FormData) {
  const { user } = await requireOnboardedUser(); const eventId = text(data, "eventId"); const path = text(data, "returnPath") || "/organizations";
  if (!uuid(eventId)) finish("/organizations", false);
  const supabase = await createClient(); const { error } = await supabase.from("organization_event_registrations").upsert({ event_id: eventId, user_id: user.id, status: "registered" }, { onConflict: "event_id,user_id" });
  finish(path.startsWith("/") ? path : "/organizations", !error);
}
