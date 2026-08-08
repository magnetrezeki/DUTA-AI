"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const text = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
const uuid = (input: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input);
function finish(ok: boolean): never { revalidatePath("/organizations"); revalidatePath("/admin/organizations"); redirect(`/admin/organizations?${ok ? "success=saved" : "error=failed"}`); }

export async function reviewOrganization(data: FormData) {
  const { user } = await requirePlatformAdmin(); const id = text(data, "id"); const status = text(data, "status"); const verification = text(data, "verificationStatus"); const source = text(data, "sourceUrl");
  if (!uuid(id) || !["approved", "rejected", "suspended"].includes(status) || !["verified", "unverified"].includes(verification) || (verification === "verified" && !source.startsWith("https://"))) finish(false);
  const supabase = await createClient(); const { error } = await supabase.from("organizations").update({ status, verification_status: verification, source_url: source || null, last_verified_at: verification === "verified" ? new Date().toISOString() : null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id); finish(!error);
}

export async function approveClaim(data: FormData) {
  await requirePlatformAdmin(); const id = text(data, "id"); if (!uuid(id)) finish(false);
  const supabase = await createClient(); const { error } = await supabase.rpc("approve_organization_claim", { target_claim_id: id }); finish(!error);
}
