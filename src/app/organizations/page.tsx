import Link from "next/link";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { submitOrganization } from "./actions";

export const metadata = { title: "Organisasi", description: "Temukan organisasi, pengumuman, dan acara komunitas Indonesia di Malaysia." };

export const dynamic = "force-dynamic";

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ q?: string; area?: string; success?: string; error?: string }> }) {
  const params = await searchParams; const supabase = await createClient();
  let query = supabase.from("organizations").select("id,slug,name,description,city,state_region,verification_status").eq("country_code", "MY").eq("status", "approved").order("name");
  if (params.q) query = query.ilike("name", `%${params.q.replaceAll("%", "")}%`); if (params.area) query = query.or(`city.ilike.%${params.area.replaceAll("%", "")}%,state_region.ilike.%${params.area.replaceAll("%", "")}%`);
  const { data: organizations } = await query;
  return <main className="flex-1 py-12"><Container><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Community OS</p><h1 className="mt-3 text-4xl font-bold">Direktori organisasi Indonesia</h1><p className="mt-4 text-slate-600">Temukan organisasi, kegiatan, dan pengumuman. Status verifikasi selalu ditampilkan secara jelas.</p></div>
    <form className="mt-8 grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-3"><input name="q" defaultValue={params.q} placeholder="Nama organisasi" className="min-h-11 rounded-lg border px-3" /><input name="area" defaultValue={params.area} placeholder="Kota atau negeri" className="min-h-11 rounded-lg border px-3" /><button className="rounded-lg bg-slate-900 font-semibold text-white">Cari</button></form>
    <div className="mt-8 grid gap-5 md:grid-cols-2">{organizations?.map((o) => <article key={o.id} className="rounded-2xl border bg-white p-6"><span className="text-xs font-semibold text-brand-700">{o.verification_status === "verified" ? "Terverifikasi" : "Belum terverifikasi"}</span><h2 className="mt-2 text-xl font-bold"><Link href={`/organizations/${o.slug}`}>{o.name}</Link></h2><p className="mt-2 text-sm text-slate-500">{o.city}, {o.state_region}</p><p className="mt-3 line-clamp-3 text-slate-600">{o.description}</p></article>)}{!organizations?.length && <p className="text-slate-600">Belum ada organisasi yang disetujui.</p>}</div>
    <section className="mt-12 max-w-2xl rounded-2xl border bg-white p-6"><h2 className="text-2xl font-bold">Tambahkan organisasi</h2><p className="mt-2 text-sm text-slate-600">Kiriman menunggu pemeriksaan dan tidak otomatis terverifikasi.</p><form action={submitOrganization} className="mt-5 grid gap-4"><Input name="name" label="Nama" /><Input name="slug" label="Tautan singkat (huruf kecil dan tanda hubung)" /><label className="text-sm font-semibold">Deskripsi<textarea name="description" required minLength={20} className="mt-2 w-full rounded-lg border p-3" rows={4} /></label><div className="grid gap-4 sm:grid-cols-2"><Input name="city" label="Kota" /><Input name="state" label="Negeri/wilayah" /></div><Input name="publicEmail" label="Email publik (opsional)" type="email" required={false} /><Input name="website" label="Website HTTPS (opsional)" type="url" required={false} /><button className="min-h-11 rounded-lg bg-brand-700 font-semibold text-white">Kirim untuk ditinjau</button></form></section>
  </Container></main>;
}
function Input({ name, label, type = "text", required = true }: { name: string; label: string; type?: string; required?: boolean }) { return <label className="text-sm font-semibold">{label}<input name={name} type={type} required={required} className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>; }
