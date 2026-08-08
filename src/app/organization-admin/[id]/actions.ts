"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizationAdmin } from "@/lib/organizations/authorization";

const text = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
const uuid = (input: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input);
function finish(id: string, ok: boolean): never { revalidatePath(`/organization-admin/${id}`); revalidatePath("/organizations"); redirect(`/organization-admin/${id}?${ok ? "success=saved" : "error=failed"}`); }

export async function approveMember(data: FormData) {
  const organizationId = text(data, "organizationId"); const membershipId = text(data, "membershipId"); const decision = text(data, "decision");
  if (!uuid(organizationId) || !uuid(membershipId) || !["approved", "rejected"].includes(decision)) redirect("/dashboard?error=invalid");
  const { user, supabase } = await requireOrganizationAdmin(organizationId);
  const { error } = await supabase.from("organization_memberships").update({ status: decision, role: "member", approved_by: decision === "approved" ? user.id : null, approved_at: decision === "approved" ? new Date().toISOString() : null }).eq("id", membershipId).eq("organization_id", organizationId);
  finish(organizationId, !error);
}

export async function createAnnouncement(data: FormData) {
  const organizationId = text(data, "organizationId"); if (!uuid(organizationId) || text(data, "title").length < 3 || text(data, "body").length < 10) redirect("/dashboard?error=invalid");
  const { user, supabase } = await requireOrganizationAdmin(organizationId); const publish = text(data, "publish") === "true";
  const { error } = await supabase.from("organization_announcements").insert({ organization_id: organizationId, title: text(data, "title"), body: text(data, "body"), status: publish ? "published" : "draft", published_at: publish ? new Date().toISOString() : null, created_by: user.id });
  finish(organizationId, !error);
}

export async function createEvent(data: FormData) {
  const organizationId = text(data, "organizationId"); const starts = text(data, "startsAt"); if (!uuid(organizationId) || text(data, "title").length < 3 || text(data, "description").length < 10 || !starts || (!text(data, "venueName") && !text(data, "onlineUrl"))) redirect("/dashboard?error=invalid");
  const { user, supabase } = await requireOrganizationAdmin(organizationId); const publish = text(data, "publish") === "true";
  const { error } = await supabase.from("organization_events").insert({ organization_id: organizationId, title: text(data, "title"), description: text(data, "description"), starts_at: new Date(starts).toISOString(), ends_at: text(data, "endsAt") ? new Date(text(data, "endsAt")).toISOString() : null, venue_name: text(data, "venueName") || null, venue_address: text(data, "venueAddress") || null, online_url: text(data, "onlineUrl") || null, capacity: text(data, "capacity") ? Number(text(data, "capacity")) : null, status: publish ? "published" : "draft", published_at: publish ? new Date().toISOString() : null, created_by: user.id });
  finish(organizationId, !error);
}

export async function createJoinLink(data: FormData) {
  const organizationId = text(data, "organizationId"); if (!uuid(organizationId)) redirect("/dashboard?error=invalid");
  const { user, supabase } = await requireOrganizationAdmin(organizationId); const { error } = await supabase.from("organization_join_links").insert({ organization_id: organizationId, created_by: user.id }); finish(organizationId, !error);
}
