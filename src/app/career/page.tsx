import Link from "next/link";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import type { JobSummary } from "@/lib/career/types";

export const dynamic = "force-dynamic";

export default async function CareerPage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string; type?: string }> }) {
  const params = await searchParams; const supabase = await createClient();
  let query = supabase.from("jobs").select("id,employer_id,title,location_text,employment_type,salary_text,deadline,source_type,original_url,created_at").eq("country_code", "MY").eq("status", "published").order("created_at", { ascending: false });
  if (params.q) query = query.ilike("title", `%${params.q.replaceAll("%", "")}%`);
  if (params.location) query = query.ilike("location_text", `%${params.location.replaceAll("%", "")}%`);
  if (params.type) query = query.eq("employment_type", params.type);
  const { data } = await query.returns<JobSummary[]>();
  return <main className="flex-1 py-12"><Container>
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">DUTA KARIER</p>
    <h1 className="mt-3 text-4xl font-bold">Peluang kerja tepercaya</h1>
    <p className="mt-4 max-w-3xl text-slate-600">Cari dan lamar pekerjaan secara gratis. Lowongan eksternal selalu menampilkan sumber asli dan tidak diambil melalui scraping tanpa izin.</p>
    <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold"><Link href="/career/saved" className="text-brand-700">Lowongan tersimpan</Link><Link href="/career/passport" className="text-brand-700">Career Passport</Link><Link href="/career/applications" className="text-brand-700">Lamaran saya</Link><Link href="/career/alerts" className="text-brand-700">Job alerts</Link><Link href="/employer/register" className="text-brand-700">Untuk pemberi kerja</Link></div>
    <form className="mt-8 grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-4"><input name="q" defaultValue={params.q} placeholder="Posisi" className="min-h-11 rounded-lg border px-3"/><input name="location" defaultValue={params.location} placeholder="Lokasi" className="min-h-11 rounded-lg border px-3"/><select name="type" defaultValue={params.type} className="min-h-11 rounded-lg border px-3"><option value="">Semua jenis</option><option value="full_time">Penuh waktu</option><option value="part_time">Paruh waktu</option><option value="contract">Kontrak</option><option value="temporary">Sementara</option><option value="internship">Magang</option></select><button className="rounded-lg bg-slate-900 font-semibold text-white">Cari</button></form>
    <div className="mt-8 grid gap-5 md:grid-cols-2">{data?.map((job) => <article key={job.id} className="rounded-2xl border bg-white p-6"><div className="flex justify-between gap-4"><span className="text-xs font-semibold uppercase text-brand-700">{job.source_type === "external" ? "Sumber eksternal" : "DUTA KARIER"}</span><span className="text-xs text-slate-500">{job.employment_type.replaceAll("_", " ")}</span></div><h2 className="mt-3 text-xl font-bold"><Link href={`/career/jobs/${job.id}`}>{job.title}</Link></h2><p className="mt-2 text-sm text-slate-600">{job.location_text}</p>{job.salary_text && <p className="mt-2 text-sm font-semibold">{job.salary_text}</p>}<p className="mt-4 text-xs text-slate-500">Batas: {job.deadline ? new Date(job.deadline).toLocaleDateString("id-ID") : "Tidak dicantumkan"}</p></article>)}{!data?.length && <p className="text-slate-600">Belum ada lowongan yang dipublikasikan.</p>}</div>
  </Container></main>;
}
