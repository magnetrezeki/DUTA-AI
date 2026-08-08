import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { joinOrganization } from "@/app/organizations/actions";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const supabase = await createClient(); const { data: link } = await supabase.from("organization_join_links").select("organization_id,organization:organizations(name,slug)").eq("token", token).eq("is_active", true).single(); if (!link) notFound(); const organization = link.organization as unknown as { name: string; slug: string };
  return <main className="flex-1 py-12"><Container><div className="mx-auto max-w-lg rounded-2xl border bg-white p-7 text-center"><h1 className="text-3xl font-bold">Bergabung dengan {organization.name}</h1><p className="mt-3 text-slate-600">Permintaan Anda akan menunggu persetujuan admin organisasi.</p><form action={joinOrganization} className="mt-6"><input type="hidden" name="organizationId" value={link.organization_id} /><input type="hidden" name="returnPath" value={`/organizations/${organization.slug}`} /><button className="min-h-11 rounded-lg bg-brand-700 px-6 font-semibold text-white">Ajukan keanggotaan</button></form></div></Container></main>;
}
