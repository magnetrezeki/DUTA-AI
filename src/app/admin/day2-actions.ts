"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "true";
}

function httpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function verification(formData: FormData) {
  const status = text(formData, "verificationStatus");
  const date = text(formData, "lastVerifiedAt");

  if (status !== "verified" && status !== "unverified") return null;
  if (status === "verified" && !date) return null;

  return {
    verification_status: status,
    last_verified_at: date ? new Date(date).toISOString() : null,
  } as const;
}

async function adminClient() {
  const { user } = await requirePlatformAdmin();
  return { user, supabase: await createClient() };
}

function finish(path: string, ok: boolean): never {
  revalidatePath(path);
  revalidatePath("/connect");
  revalidatePath("/news");
  redirect(`${path}?${ok ? "success=saved" : "error=save_failed"}`);
}

export async function createOfficialSource(formData: FormData) {
  const scope = text(formData, "scope");
  const name = text(formData, "name");
  const sourceUrl = text(formData, "sourceUrl");
  const verified = verification(formData);
  const path = scope === "news" ? "/admin/news" : "/admin/connect";

  if (!verified || !name || !httpsUrl(sourceUrl) || !["representative_office", "news"].includes(scope)) {
    finish(path, false);
  }

  const { user, supabase } = await adminClient();
  const { error } = await supabase.from("official_sources").insert({
    scope,
    country_code: "MY",
    name,
    source_url: sourceUrl,
    ...verified,
    integration_type: scope === "news" ? "manual_url" : null,
    integration_enabled: false,
    is_demo: checked(formData, "isDemo"),
    created_by: user.id,
  });
  finish(path, !error);
}

export async function createOffice(formData: FormData) {
  const name = text(formData, "name");
  const officeType = text(formData, "officeType");
  const sourceId = text(formData, "sourceId");
  const verified = verification(formData);
  const allowedTypes = ["embassy", "consulate_general", "consulate", "other"];

  if (!verified || !name || !sourceId || !allowedTypes.includes(officeType)) finish("/admin/connect", false);
  const { user, supabase } = await adminClient();
  const { error } = await supabase.from("representative_offices").insert({
    country_code: "MY",
    name,
    office_type: officeType,
    source_id: sourceId,
    ...verified,
    is_demo: checked(formData, "isDemo"),
    created_by: user.id,
  });
  finish("/admin/connect", !error);
}

export async function createJurisdiction(formData: FormData) {
  const officeId = text(formData, "officeId");
  const stateName = text(formData, "stateName");
  const sourceId = text(formData, "sourceId");
  const verified = verification(formData);

  if (!verified || !officeId || !stateName || !sourceId) finish("/admin/connect", false);
  const { user, supabase } = await adminClient();
  const { error } = await supabase.from("office_jurisdictions").insert({
    office_id: officeId,
    country_code: "MY",
    state_name: stateName,
    source_id: sourceId,
    ...verified,
    is_demo: checked(formData, "isDemo"),
    created_by: user.id,
  });
  finish("/admin/connect", !error);
}

export async function createServiceCategory(formData: FormData) {
  const slug = text(formData, "slug");
  const name = text(formData, "name");
  const description = text(formData, "description");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name) finish("/admin/connect", false);
  const { user, supabase } = await adminClient();
  const { error } = await supabase.from("service_categories").insert({
    slug,
    name,
    description: description || null,
    is_demo: checked(formData, "isDemo"),
    created_by: user.id,
  });
  finish("/admin/connect", !error);
}

export async function createContactChannel(formData: FormData) {
  const officeId = text(formData, "officeId");
  const serviceCategoryId = text(formData, "serviceCategoryId");
  const channelType = text(formData, "channelType");
  const label = text(formData, "label");
  const channelValue = text(formData, "channelValue");
  const sourceId = text(formData, "sourceId");
  const verified = verification(formData);

  if (!verified || !officeId || !serviceCategoryId || !label || !channelValue || !sourceId || !["phone", "whatsapp", "email", "website"].includes(channelType)) {
    finish("/admin/connect", false);
  }
  const { user, supabase } = await adminClient();
  const { error } = await supabase.from("office_contact_channels").insert({
    office_id: officeId,
    service_category_id: serviceCategoryId,
    channel_type: channelType,
    label,
    channel_value: channelValue,
    source_id: sourceId,
    ...verified,
    is_demo: checked(formData, "isDemo"),
    created_by: user.id,
  });
  finish("/admin/connect", !error);
}

export async function createNewsItem(formData: FormData) {
  const sourceId = text(formData, "sourceId");
  const title = text(formData, "title");
  const officialUrl = text(formData, "officialUrl");
  const summary = text(formData, "summary");
  const publicationStatus = text(formData, "publicationStatus");
  const publishedAt = text(formData, "publishedAt");
  const verified = verification(formData);

  if (!verified || !sourceId || !title || !httpsUrl(officialUrl) || !["draft", "published", "archived"].includes(publicationStatus)) {
    finish("/admin/news", false);
  }
  const { user, supabase } = await adminClient();
  const { error } = await supabase.from("news_items").insert({
    source_id: sourceId,
    title,
    official_url: officialUrl,
    summary: summary || null,
    publication_status: publicationStatus,
    published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
    ...verified,
    is_demo: checked(formData, "isDemo"),
    created_by: user.id,
  });
  finish("/admin/news", !error);
}
