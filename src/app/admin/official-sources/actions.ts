"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  canEnableSource,
  isRegistryVerificationStatus,
  isSourcePriority,
  isVerificationLevel,
  validCategoryScope,
} from "@/lib/official-sources/types";

const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const text = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";

function finish(ok: boolean): never {
  revalidatePath("/admin/official-sources");
  revalidatePath("/news");
  redirect(`/admin/official-sources?${ok ? "success=saved" : "error=save_failed"}`);
}

export async function updateOfficialSource(data: FormData) {
  await requirePlatformAdmin();
  const id = text(data, "id");
  const priority = text(data, "priority");
  const registryStatus = text(data, "registryStatus");
  const lastVerifiedAt = text(data, "lastVerifiedAt");
  const notes = text(data, "notes");
  const enabled = data.get("enabled") === "true";
  const confirmed = data.get("confirmEnable") === "true";
  const categories = data.getAll("categoryScope").filter((value): value is string => typeof value === "string");
  const verifiedDate = lastVerifiedAt ? new Date(lastVerifiedAt) : null;

  if (!uuid(id) || !isSourcePriority(priority) || !isRegistryVerificationStatus(registryStatus)
    || !validCategoryScope(categories) || notes.length > 2000
    || (registryStatus === "VERIFIED" && (!verifiedDate || Number.isNaN(verifiedDate.getTime())))) finish(false);

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("official_sources")
    .select("verification_level")
    .eq("id", id)
    .single<{ verification_level: string }>();
  if (!current || !isVerificationLevel(current.verification_level)) finish(false);
  if (enabled && (!confirmed || !canEnableSource(current.verification_level, registryStatus))) finish(false);

  const verified = registryStatus === "VERIFIED";
  const { error } = await supabase
    .from("official_sources")
    .update({
      priority,
      registry_status: registryStatus,
      verification_status: verified ? "verified" : "unverified",
      last_verified_at: verifiedDate && !Number.isNaN(verifiedDate.getTime()) ? verifiedDate.toISOString() : null,
      notes: notes || null,
      category_scope: categories,
      enabled: verified && enabled,
      is_active: verified && enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  finish(!error);
}
