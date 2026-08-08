import "server-only";

import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function requireOrganizationAdmin(organizationId: string) {
  const authenticated = await requireOnboardedUser();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", authenticated.user.id)
    .eq("role", "admin")
    .eq("status", "approved")
    .maybeSingle();

  if (!membership) redirect("/dashboard?error=organization_access_denied");
  return { ...authenticated, supabase };
}
