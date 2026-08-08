"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
const uuid = (input: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input);
function finish(ok: boolean): never { revalidatePath("/admin/career"); redirect(`/admin/career?${ok ? "success=saved" : "error=failed"}`); }

export async function verifyEmployer(data: FormData) {
  await requirePlatformAdmin(); const employerId = value(data, "employerId"); const sourceUrl = value(data, "sourceUrl");
  if (!uuid(employerId) || !sourceUrl.startsWith("https://")) finish(false);
  const supabase = await createClient(); const { error } = await supabase.rpc("verify_employer", { target_employer_id: employerId, source_url: sourceUrl });
  finish(!error);
}
export async function moderateJob(data: FormData) {
  const { user } = await requirePlatformAdmin(); const jobId = value(data, "jobId"); const status = value(data, "status");
  if (!uuid(jobId) || !["published", "rejected", "closed"].includes(status)) finish(false);
  const supabase = await createClient(); const { error } = await supabase.from("jobs").update({ status, moderated_by: user.id, moderated_at: new Date().toISOString() }).eq("id", jobId);
  finish(!error);
}

export async function registerExternalSource(data: FormData) {
  await requirePlatformAdmin();
  const officialUrl = value(data, "officialUrl");
  if (!officialUrl.startsWith("https://")) finish(false);
  const supabase = await createClient(); const { error } = await supabase.from("external_job_sources").insert({
    code: value(data, "code").toUpperCase(), name: value(data, "name"), official_url: officialUrl,
    adapter_key: value(data, "adapterKey"), authorization_status: "pending", is_active: false,
  });
  finish(!error);
}
