import "server-only";

import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function requireEmployerMember() {
  const authenticated = await requireOnboardedUser();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("employer_members")
    .select("employer_id, role, employers!inner(id,name,status)")
    .eq("user_id", authenticated.user.id)
    .eq("employers.status", "verified")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/employer/register?error=employer_access_denied");
  }

  return { ...authenticated, membership };
}
