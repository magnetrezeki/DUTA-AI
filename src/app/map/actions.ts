"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
const uuid = (input: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);
const safeHttps = (input: string) => { try { return !input || new URL(input).protocol === "https:"; } catch { return false; } };

function done(path: string, ok: boolean): never {
  revalidatePath("/map");
  revalidatePath(path);
  redirect(`${path}${path.includes("?") ? "&" : "?"}${ok ? "success=submitted" : "error=submission_failed"}`);
}

export async function submitPlace(data: FormData) {
  const { user, profile } = await requireOnboardedUser();
  const categoryId = value(data, "categoryId");
  const name = value(data, "name");
  const address = value(data, "address");
  const city = value(data, "city");
  const state = value(data, "state");
  const latitude = Number(value(data, "latitude"));
  const longitude = Number(value(data, "longitude"));
  const website = value(data, "website");
  if (!uuid(categoryId) || name.length < 2 || address.length < 5 || city.length < 2 || state.length < 2 || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || !safeHttps(website)) done("/map/add", false);
  const supabase = await createClient();
  const { error } = await supabase.from("community_places").insert({
    country_code: profile.current_country_code,
    category_id: categoryId,
    name,
    description: value(data, "description") || null,
    address_text: address,
    city,
    state_region: state,
    latitude,
    longitude,
    phone: value(data, "phone") || null,
    website_url: website || null,
    submitted_by: user.id,
  });
  done("/map/add", !error);
}

export async function submitCorrection(data: FormData) {
  const { user } = await requireOnboardedUser();
  const placeId = value(data, "placeId");
  const reason = value(data, "reason");
  const field = value(data, "field");
  const proposedValue = value(data, "proposedValue");
  const allowed = ["name", "description", "address_text", "city", "state_region", "phone", "website_url"];
  if (!uuid(placeId) || reason.length < 10 || !allowed.includes(field) || !proposedValue || (field === "website_url" && !safeHttps(proposedValue))) done(`/map/${placeId}`, false);
  const supabase = await createClient();
  const { error } = await supabase.from("place_corrections").insert({ place_id: placeId, proposed_changes: { [field]: proposedValue }, reason, submitted_by: user.id });
  done(`/map/${placeId}`, !error);
}

export async function submitReview(data: FormData) {
  const { user } = await requireOnboardedUser();
  const placeId = value(data, "placeId");
  const rating = Number(value(data, "rating"));
  const reviewText = value(data, "reviewText");
  if (!uuid(placeId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 10) done(`/map/${placeId}`, false);
  const supabase = await createClient();
  const { error } = await supabase.from("place_reviews").insert({ place_id: placeId, author_id: user.id, rating, review_text: reviewText });
  done(`/map/${placeId}`, !error);
}

export async function recommendPlace(data: FormData) {
  const { user } = await requireOnboardedUser();
  const placeId = value(data, "placeId");
  if (!uuid(placeId)) done("/map", false);
  const supabase = await createClient();
  const { error } = await supabase.from("place_recommendations").upsert({ place_id: placeId, user_id: user.id }, { onConflict: "place_id,user_id", ignoreDuplicates: true });
  done(`/map/${placeId}`, !error);
}

export async function confirmPlace(data: FormData) {
  const { user } = await requireOnboardedUser();
  const placeId = value(data, "placeId");
  if (!uuid(placeId)) done("/map", false);
  const supabase = await createClient();
  const { error } = await supabase.from("place_confirmations").upsert({ place_id: placeId, user_id: user.id }, { onConflict: "place_id,user_id", ignoreDuplicates: true });
  done(`/map/${placeId}`, !error);
}

export async function reportPlace(data: FormData) {
  const { user } = await requireOnboardedUser();
  const placeId = value(data, "placeId");
  const reason = value(data, "reportReason");
  const details = value(data, "details");
  const allowed = ["incorrect_information", "closed", "duplicate", "unsafe", "other"];
  if (!uuid(placeId) || !allowed.includes(reason) || details.length < 10) done(`/map/${placeId}`, false);
  const supabase = await createClient();
  const { error } = await supabase.from("place_reports").insert({ place_id: placeId, reporter_id: user.id, reason, details });
  done(`/map/${placeId}`, !error);
}
