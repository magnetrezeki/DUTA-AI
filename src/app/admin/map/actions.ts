"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const text = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
const uuid = (input: string) => /^[0-9a-f-]{36}$/i.test(input);

export async function moderatePlace(data: FormData) {
  const { user } = await requirePlatformAdmin();
  const id = text(data, "id");
  const status = text(data, "status");
  const trust = text(data, "trustLabel");
  if (!uuid(id) || !["approved", "rejected", "needs_changes"].includes(status) || !["community_unverified", "community_confirmed", "trusted_contributor_confirmed", "admin_reviewed"].includes(trust)) redirect("/admin/map?error=invalid");
  const supabase = await createClient();
  const { error } = await supabase.from("community_places").update({ moderation_status: status, trust_label: trust, moderation_note: text(data, "note") || null, moderated_by: user.id, moderated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/map"); revalidatePath("/admin/map"); redirect(`/admin/map?${error ? "error=save_failed" : "success=saved"}`);
}

export async function moderateQueueItem(data: FormData) {
  const { user } = await requirePlatformAdmin();
  const table = text(data, "table");
  const id = text(data, "id");
  const status = text(data, "status");
  if (!["place_corrections", "place_reviews", "place_reports"].includes(table) || !uuid(id) || !["approved", "rejected", "needs_changes"].includes(status)) redirect("/admin/map?error=invalid");
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ moderation_status: status, moderated_by: user.id, moderated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/map"); revalidatePath("/admin/map"); redirect(`/admin/map?${error ? "error=save_failed" : "success=saved"}`);
}
