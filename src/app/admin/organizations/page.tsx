import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { approveClaim, reviewOrganization } from "./actions";

export default async function OrganizationReviewPage() {
  const supabase = await createClient();
  const [organizations, claims] = await Promise.all([
    supabase.from("organizations").select("id,name,city,state_region,status,verification_status").eq("status", "pending").order("created_at"),
    supabase.from("organization_claims").select("id,organization_id,reason,evidence_url,status").eq("status", "pending").order("created_at"),
  ]);
  return <main className="flex-1 py-12"><Container><h1 className="text-3xl font-bold">Verifikasi organisasi</h1><p className="mt-3 text-slate-600">Tinjau organisasi dan klaim sebelum memberikan akses admin.</p><section className="mt-8"><h2 className="text-2xl font-bold">Organisasi menunggu</h2><div className="mt-4 grid gap-4">{organizations.data?.map((o) => <article key={o.id} className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold">{o.name}</h3><p>{o.city}, {o.state_region}</p><form action={reviewOrganization} className="mt-4 grid gap-3 md:grid-cols-4"><input type="hidden" name="id" value={o.id} /><select name="status" className="rounded-lg border px-3"><option value="approved">Setujui</option><option value="rejected">Tolak</option></select><select name="verificationStatus" className="rounded-lg border px-3"><option value="unverified">Belum terverifikasi</option><option value="verified">Terverifikasi</option></select><input name="sourceUrl" type="url" placeholder="Sumber HTTPS jika terverifikasi" className="rounded-lg border px-3" /><button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Simpan</button></form></article>)}</div></section><section className="mt-8"><h2 className="text-2xl font-bold">Klaim menunggu</h2><div className="mt-4 grid gap-4">{claims.data?.map((c) => <article key={c.id} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-slate-700">{c.reason}</p>{c.evidence_url && <p className="mt-2 break-all text-sm">{c.evidence_url}</p>}<form action={approveClaim} className="mt-3"><input type="hidden" name="id" value={c.id} /><button className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white">Setujui klaim</button></form></article>)}</div></section></Container></main>;
}
