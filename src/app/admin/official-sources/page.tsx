import Link from "next/link";
import { updateOfficialSource } from "./actions";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import {
  officialSourceCategories,
  sourcePlatforms,
  sourcePriorities,
  verificationLevelLabels,
  verificationLevels,
  verificationStatuses,
  type RegistryOfficialSource,
} from "@/lib/official-sources/types";

export const dynamic = "force-dynamic";

type Filters = {
  search?: string;
  institution?: string;
  platform?: string;
  level?: string;
  priority?: string;
  enabled?: string;
  city?: string;
  success?: string;
  error?: string;
};

export default async function OfficialSourcesAdminPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("official_sources")
    .select("id,institution_code,name,unit_name,country_code,city,platform,handle,source_url,official_website,verification_level,registry_status,priority,category_scope,enabled,last_verified_at,last_successful_fetch_at,fetch_method,notes")
    .order("name")
    .order("platform");
  const allSources = (data ?? []) as unknown as RegistryOfficialSource[];
  const sources = allSources.filter((source) => matches(source, filters));
  const institutions = unique(allSources.map((source) => source.institution_code).filter(Boolean) as string[]);
  const cities = unique(allSources.map((source) => source.city).filter(Boolean) as string[]);

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Admin · Official Sources</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">DUTA Master Source Registry</h1>
            <p className="mt-2 max-w-3xl text-slate-600">Kelola sumber resmi, tingkat verifikasi, prioritas, dan cakupan kategori. Ingestion otomatis belum aktif.</p>
          </div>
          <Link href="/admin" className="font-semibold text-brand-700 hover:underline">Kembali ke admin</Link>
        </div>

        {filters.success && <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-emerald-900">Sumber berhasil diperbarui.</p>}
        {filters.error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-900">Perubahan ditolak. Periksa verifikasi, tanggal, kategori, dan konfirmasi.</p>}

        <form className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <FilterInput name="search" label="Cari" defaultValue={filters.search} placeholder="Institusi, unit, handle" />
          <FilterSelect name="institution" label="Institusi" value={filters.institution} options={institutions} />
          <FilterSelect name="platform" label="Platform" value={filters.platform} options={[...sourcePlatforms]} />
          <FilterSelect name="level" label="Level" value={filters.level} options={[...verificationLevels]} />
          <FilterSelect name="priority" label="Prioritas" value={filters.priority} options={[...sourcePriorities]} />
          <FilterSelect name="enabled" label="Aktif" value={filters.enabled} options={["true", "false"]} />
          <FilterSelect name="city" label="Kota" value={filters.city} options={cities} />
          <div className="flex items-end gap-3"><button className="min-h-11 rounded-lg bg-brand-700 px-5 font-semibold text-white">Terapkan</button><Link href="/admin/official-sources" className="py-3 font-semibold text-brand-700">Reset</Link></div>
        </form>

        <p className="mt-6 text-sm text-slate-600">Menampilkan {sources.length} dari {allSources.length} sumber.</p>
        <div className="mt-4 space-y-4">
          {sources.map((source) => <SourceEditor key={source.id} source={source} />)}
          {sources.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Tidak ada sumber yang cocok dengan filter.</p>}
        </div>
      </Container>
    </main>
  );
}

function SourceEditor({ source }: { source: RegistryOfficialSource }) {
  const enableBlocked = !["A", "B"].includes(source.verification_level) || source.registry_status !== "VERIFIED";
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-950">{source.name}</h2><p className="text-sm text-slate-600">{source.unit_name ?? "Institusi utama"} · {source.institution_code ?? "Belum dikodekan"}</p></div>
        <div className="flex flex-wrap gap-2"><Badge>{source.platform ?? "belum ada platform"}</Badge><Badge>{verificationLevelLabels[source.verification_level]}</Badge><Badge>{source.priority}</Badge><Badge>{source.enabled ? "Aktif" : "Nonaktif"}</Badge></div>
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="font-semibold">Handle</dt><dd className="text-slate-600">{source.handle ?? "—"}</dd></div>
        <div><dt className="font-semibold">Kota</dt><dd className="text-slate-600">{source.city ?? "—"}</dd></div>
        <div><dt className="font-semibold">Terakhir diverifikasi</dt><dd className="text-slate-600">{formatDate(source.last_verified_at)}</dd></div>
        <div><dt className="font-semibold">Metode fetch</dt><dd className="text-slate-600">{source.fetch_method ?? "Belum diaktifkan"}</dd></div>
      </dl>
      {source.source_url && <a href={source.source_url} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm font-semibold text-brand-700 hover:underline">{source.source_url}</a>}

      <form action={updateOfficialSource} className="mt-5 grid gap-4 border-t border-slate-200 pt-5 lg:grid-cols-3">
        <input type="hidden" name="id" value={source.id} />
        <SelectField name="priority" label="Prioritas" defaultValue={source.priority} options={[...sourcePriorities]} />
        <SelectField name="registryStatus" label="Status verifikasi" defaultValue={source.registry_status} options={[...verificationStatuses]} />
        <label className="text-sm font-semibold">Terakhir diverifikasi<input name="lastVerifiedAt" type="datetime-local" defaultValue={dateTimeLocal(source.last_verified_at)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
        <fieldset className="lg:col-span-3"><legend className="text-sm font-semibold">Kategori</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{officialSourceCategories.map((category) => <label key={category} className="flex items-start gap-2 text-xs"><input type="checkbox" name="categoryScope" value={category} defaultChecked={source.category_scope.includes(category)} className="mt-0.5" />{category}</label>)}</div></fieldset>
        <label className="text-sm font-semibold lg:col-span-3">Catatan<textarea name="notes" defaultValue={source.notes ?? ""} maxLength={2000} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal" /></label>
        <div className="space-y-2 lg:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="enabled" value="true" defaultChecked={source.enabled} disabled={enableBlocked} />Aktifkan sumber</label>
          <label className="flex items-start gap-2 text-sm text-amber-900"><input type="checkbox" name="confirmEnable" value="true" className="mt-1" />Saya mengonfirmasi sumber ini boleh diaktifkan.</label>
          {source.verification_level !== "A" && <p className="text-sm text-amber-800">Peringatan: level {source.verification_level} memerlukan pemeriksaan ekstra. C, LEGACY, dan HOLD tidak dapat diaktifkan.</p>}
        </div>
        <div className="flex items-end justify-end"><button className="min-h-11 rounded-lg bg-brand-700 px-5 font-semibold text-white">Simpan perubahan</button></div>
      </form>
    </article>
  );
}

function matches(source: RegistryOfficialSource, filters: Filters) {
  const search = filters.search?.trim().toLowerCase();
  if (search && ![source.name, source.unit_name, source.handle].some((value) => value?.toLowerCase().includes(search))) return false;
  if (filters.institution && source.institution_code !== filters.institution) return false;
  if (filters.platform && source.platform !== filters.platform) return false;
  if (filters.level && source.verification_level !== filters.level) return false;
  if (filters.priority && source.priority !== filters.priority) return false;
  if (filters.enabled && String(source.enabled) !== filters.enabled) return false;
  return !filters.city || source.city === filters.city;
}

function unique(values: string[]) { return [...new Set(values)].sort(); }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value)) : "Belum ada"; }
function dateTimeLocal(value: string | null) { return value ? new Date(value).toISOString().slice(0, 16) : ""; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{children}</span>; }
function FilterInput({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: string; placeholder?: string }) { return <label className="text-sm font-semibold">{label}<input name={name} defaultValue={defaultValue} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>; }
function FilterSelect({ name, label, value, options }: { name: string; label: string; value?: string; options: string[] }) { return <label className="text-sm font-semibold">{label}<select name={name} defaultValue={value ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal"><option value="">Semua</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }
function SelectField({ name, label, defaultValue, options }: { name: string; label: string; defaultValue: string; options: string[] }) { return <label className="text-sm font-semibold">{label}<select name={name} defaultValue={defaultValue} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }
