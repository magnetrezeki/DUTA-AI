import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  isPlatformAdminRole,
  type UserRole,
} from "@/lib/auth/roles";

export type UserProfile = {
  id: string;
  display_name: string;
  current_country_code: string;
  role: UserRole;
  onboarding_completed: boolean;
};

type AuthenticatedUser = {
  user: User;
  profile: UserProfile;
};

export async function requireUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, current_country_code, role, onboarding_completed",
    )
    .eq("id", user.id)
    .single<UserProfile>();

  if (error || !profile) {
    throw new Error("Profil pengguna tidak tersedia.");
  }

  return { user, profile };
}

export async function requireOnboardedUser() {
  const authenticatedUser = await requireUser();

  if (!authenticatedUser.profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return authenticatedUser;
}

export async function requirePlatformAdmin() {
  const authenticatedUser = await requireOnboardedUser();

  if (!isPlatformAdminRole(authenticatedUser.profile.role)) {
    redirect("/dashboard?error=admin_access_denied");
  }

  return authenticatedUser;
}
