"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(formData: FormData) {
  const displayNameValue = formData.get("displayName");
  const countryValue = formData.get("currentCountry");
  const displayName = typeof displayNameValue === "string" ? displayNameValue.trim() : "";
  const currentCountry = typeof countryValue === "string" ? countryValue : "";

  if (displayName.length < 2 || displayName.length > 100) {
    redirect("/onboarding?error=invalid_name");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: country } = await supabase
    .from("countries")
    .select("code")
    .eq("code", currentCountry)
    .eq("is_active", true)
    .maybeSingle();

  if (!country) {
    redirect("/onboarding?error=invalid_country");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      current_country_code: country.code,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    redirect("/onboarding?error=save_failed");
  }

  redirect("/dashboard");
}
