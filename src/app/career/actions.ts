"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) =>
  typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
const uuid = (input: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
const path = (input: string, fallback: string) => input.startsWith("/") ? input : fallback;
function finish(target: string, ok: boolean): never {
  revalidatePath(target);
  redirect(`${target}${target.includes("?") ? "&" : "?"}${ok ? "success=saved" : "error=failed"}`);
}

export async function saveJob(data: FormData) {
  const { user } = await requireOnboardedUser();
  const jobId = value(data, "jobId");
  const returnPath = path(value(data, "returnPath"), "/career");
  if (!uuid(jobId)) finish(returnPath, false);
  const supabase = await createClient();
  const { error } = await supabase.from("saved_jobs").upsert(
    { job_id: jobId, user_id: user.id },
    { onConflict: "job_id,user_id" },
  );
  finish(returnPath, !error);
}

export async function removeSavedJob(data: FormData) {
  const { user } = await requireOnboardedUser();
  const jobId = value(data, "jobId");
  if (!uuid(jobId)) finish("/career/saved", false);
  const supabase = await createClient();
  const { error } = await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("user_id", user.id);
  finish("/career/saved", !error);
}

export async function applyForJob(data: FormData) {
  const { user } = await requireOnboardedUser();
  const jobId = value(data, "jobId");
  if (!uuid(jobId) || value(data, "coverNote").length > 3000) finish(`/career/jobs/${jobId}`, false);
  const supabase = await createClient();
  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    applicant_id: user.id,
    cover_note: value(data, "coverNote"),
    share_career_passport: value(data, "sharePassport") === "yes",
  });
  finish(`/career/jobs/${jobId}`, !error);
}

export async function saveCareerPassport(data: FormData) {
  const { user } = await requireOnboardedUser();
  const list = (key: string) => value(data, key).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);
  const payload = {
    user_id: user.id,
    headline: value(data, "headline").slice(0, 180),
    summary: value(data, "summary").slice(0, 3000),
    skills: list("skills"),
    experience_summary: value(data, "experience").slice(0, 5000),
    education_summary: value(data, "education").slice(0, 3000),
    languages: list("languages"),
    is_public: false,
  };
  const supabase = await createClient();
  const { error } = await supabase.from("career_passports").upsert(payload, { onConflict: "user_id" });
  finish("/career/passport", !error);
}

export async function createJobAlert(data: FormData) {
  const { user, profile } = await requireOnboardedUser();
  const name = value(data, "name");
  if (name.length < 2) finish("/career/alerts", false);
  const employmentType = value(data, "employmentType");
  const supabase = await createClient();
  const { error } = await supabase.from("job_alerts").insert({
    user_id: user.id,
    name,
    keywords: value(data, "keywords") || null,
    country_code: profile.current_country_code,
    location_text: value(data, "location") || null,
    employment_type: employmentType || null,
  });
  finish("/career/alerts", !error);
}

export async function updateJobAlert(data: FormData) {
  const { user } = await requireOnboardedUser();
  const alertId = value(data, "alertId");
  const name = value(data, "name");
  const employmentType = value(data, "employmentType");
  if (!uuid(alertId) || name.length < 2) finish("/career/alerts", false);
  const supabase = await createClient();
  const { error } = await supabase.from("job_alerts").update({
    name,
    keywords: value(data, "keywords") || null,
    location_text: value(data, "location") || null,
    employment_type: employmentType || null,
    is_active: value(data, "isActive") === "yes",
  }).eq("id", alertId).eq("user_id", user.id);
  finish("/career/alerts", !error);
}

export async function deleteJobAlert(data: FormData) {
  const { user } = await requireOnboardedUser();
  const alertId = value(data, "alertId");
  if (!uuid(alertId)) finish("/career/alerts", false);
  const supabase = await createClient();
  const { error } = await supabase.from("job_alerts").delete().eq("id", alertId).eq("user_id", user.id);
  finish("/career/alerts", !error);
}

export async function withdrawApplication(data: FormData) {
  const { user } = await requireOnboardedUser();
  const applicationId = value(data, "applicationId");
  if (!uuid(applicationId)) finish("/career/applications", false);
  const supabase = await createClient();
  const { error } = await supabase.from("job_applications").update({
    status: "withdrawn",
    status_changed_by: user.id,
    status_changed_at: new Date().toISOString(),
  }).eq("id", applicationId).eq("applicant_id", user.id);
  finish("/career/applications", !error);
}
