"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import { requireEmployerMember } from "@/lib/career/authorization";
import { createClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
const https = (input: string) => { try { return !input || new URL(input).protocol === "https:"; } catch { return false; } };
const uuid = (input: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input);
function finish(target: string, ok: boolean): never { revalidatePath(target); redirect(`${target}?${ok ? "success=saved" : "error=failed"}`); }

export async function registerEmployer(data: FormData) {
  const { user, profile } = await requireOnboardedUser();
  const name = value(data, "name"); const description = value(data, "description"); const website = value(data, "website");
  if (name.length < 2 || description.length < 20 || !https(website)) finish("/employer/register", false);
  const supabase = await createClient();
  const { error } = await supabase.from("employers").insert({
    country_code: profile.current_country_code,
    name,
    registration_number: value(data, "registrationNumber") || null,
    description,
    website_url: website || null,
    contact_email: value(data, "contactEmail"),
    submitted_by: user.id,
  });
  finish("/employer/register", !error);
}
export async function postJob(data: FormData) {
  const { user, profile, membership } = await requireEmployerMember();
  const employerId = String(membership.employer_id); const deadline = value(data, "deadline");
  if (value(data, "title").length < 3 || value(data, "description").length < 30 || !uuid(employerId)) finish("/employer/dashboard", false);
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").insert({
    employer_id: employerId,
    country_code: profile.current_country_code,
    title: value(data, "title"),
    description: value(data, "description"),
    location_text: value(data, "location"),
    employment_type: value(data, "employmentType"),
    salary_text: value(data, "salary") || null,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    status: "pending",
    source_type: "internal",
    posted_by: user.id,
  });
  finish("/employer/dashboard", !error);
}

export async function trackApplication(data: FormData) {
  const { user } = await requireEmployerMember();
  const applicationId = value(data, "applicationId");
  const allowed = ["reviewing", "shortlisted", "interview", "offered", "rejected"];
  const status = value(data, "status");
  if (!uuid(applicationId) || !allowed.includes(status)) finish("/employer/dashboard", false);
  const supabase = await createClient();
  const { error } = await supabase.from("job_applications").update({
    status,
    status_note: value(data, "statusNote") || null,
    status_changed_by: user.id,
    status_changed_at: new Date().toISOString(),
  }).eq("id", applicationId);
  finish("/employer/dashboard", !error);
}
