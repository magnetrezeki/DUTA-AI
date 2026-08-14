import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { inputClass, labelClass, selectClass } from "@/components/ui/form-control";
import { createClient } from "@/lib/supabase/server";
import type { JobSummary } from "@/lib/career/types";

export const metadata = { title: "DUTA Karier", description: "Cari lowongan tepercaya dan kelola perjalanan karier Anda dengan privasi ketat." };
export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = { full_time: "Penuh waktu", part_time: "Paruh waktu", contract: "Kontrak", temporary: "Sementara", internship: "Magang" };

export default async function CareerPage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string; type?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("jobs").select("id,employer_id,title,location_text,employment_type,salary_text,deadline,source_type,original_url,created_at").eq("country_code", "MY").eq("status", "published").order("created_at", { ascending: false });
  if (params.q) query = query.ilike("title", `%${params.q.replaceAll("%", "")}%`);
  if (params.location) query = query.ilike("location_text", `%${params.location.replaceAll("%", "")}%`);
  if (params.type) query = query.eq("employment_type", params.type);
  const { data, error } = await query.returns<JobSummary[]>();
  const filtersActive = Boolean(params.q || params.location || params.type);

  return <main className="flex-1 pb-20">
    <section className="border-b border-slate-200 bg-white"><Container className="grid gap-7 py-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-3xl"><Badge tone="curated">Peluang terpublikasi · Malaysia</Badge><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Bangun perjalanan karier Anda, satu langkah demi satu.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Temukan lowongan, simpan peluang, pantau lamaran, dan kelola Career Passport privat dalam satu ruang.</p></div><ButtonLink href="/career/passport" variant="secondary">Perbarui Career Passport</ButtonLink></Container></section>
    <Container>
      <section aria-labelledby="job-search-title" className="relative -mt-1 rounded-b-2xl border border-t-0 border-slate-200 bg-white p-5 shadow-[var(--shadow-low)] sm:p-7"><h2 id="job-search-title" className="text-xl font-bold text-slate-950">Cari lowongan yang tersedia</h2><form className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr_auto] lg:items-end"><div><label htmlFor="q" className={labelClass}>Posisi</label><input id="q" name="q" defaultValue={params.q} placeholder="Contoh: teknisi" className={inputClass} /></div><div><label htmlFor="location" className={labelClass}>Lokasi</label><input id="location" name="location" defaultValue={params.location} placeholder="Kota atau negeri" className={inputClass} /></div><div><label htmlFor="type" className={labelClass}>Jenis kerja</label><select id="type" name="type" defaultValue={params.type} className={selectClass}><option value="">Semua jenis</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><button className="min-h-11 rounded-xl bg-slate-950 px-6 font-bold text-white hover:bg-slate-800">Cari pekerjaan</button></form>{filtersActive && <Link href="/career" className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-primary hover:underline">Hapus filter</Link>}</section>

      {error ? <section role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-bold text-red-950">Lowongan belum dapat dimuat</h2><p className="mt-2 text-sm text-red-800">Silakan muat ulang halaman. Data Career Passport Anda tidak terpengaruh.</p></section> : <section aria-labelledby="jobs-title" className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Peluang tersedia</p><h2 id="jobs-title" className="mt-2 text-2xl font-bold text-slate-950">{filtersActive ? "Hasil pencarian" : "Lowongan terbaru"}</h2></div><p className="text-sm font-semibold text-slate-500">{data?.length ?? 0} lowongan</p></div><div className="mt-5 grid gap-5 md:grid-cols-2">{data?.map((job) => <JobCard key={job.id} job={job} />)}{!data?.length && <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><h3 className="text-xl font-bold text-slate-950">{filtersActive ? "Belum ada lowongan yang cocok" : "Belum ada lowongan terpublikasi"}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{filtersActive ? "Ubah kata kunci, lokasi, atau jenis kerja untuk memperluas pencarian." : "Buat job alert untuk menyimpan kriteria pencarian sambil menunggu peluang baru."}</p><ButtonLink href={filtersActive ? "/career" : "/career/alerts"} variant="secondary" className="mt-5">{filtersActive ? "Atur ulang pencarian" : "Buat job alert"}</ButtonLink></div>}</div></section>}
    </Container>
  </main>;
}

function JobCard({ job }: { job: JobSummary }) {
  return <article className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-low)] transition hover:border-slate-300 hover:shadow-[var(--shadow-raised)]"><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone={job.source_type === "external" ? "verified" : "curated"}>{job.source_type === "external" ? "Sumber eksternal" : "DUTA Karier"}</Badge><span className="text-xs font-bold text-slate-500">{typeLabels[job.employment_type] ?? job.employment_type.replaceAll("_", " ")}</span></div><h3 className="mt-5 text-xl font-bold leading-snug text-slate-950 group-hover:text-primary"><Link href={`/career/jobs/${job.id}`}>{job.title}</Link></h3><p className="mt-2 text-sm text-slate-600">{job.location_text}</p>{job.salary_text && <p className="mt-3 font-bold text-slate-900">{job.salary_text}</p>}<div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-100 pt-5"><p className="text-xs text-slate-500">Batas: {job.deadline ? new Date(job.deadline).toLocaleDateString("id-ID") : "Tidak dicantumkan"}</p><Link href={`/career/jobs/${job.id}`} className="text-sm font-bold text-primary">Lihat detail →</Link></div></article>;
}
