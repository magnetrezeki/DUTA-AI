import Link from "next/link";
import { Container } from "@/components/ui/container";
import {
  malaysiaMissions,
  malaysiaStateOptions,
  normalizeMalaysiaLocation,
  resolveMalaysiaJurisdiction,
  sabahDistrictOptions,
} from "@/config/malaysia-jurisdictions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "DUTA Layanan WNI",
  description: "Smart Gateway ke layanan KBRI, KJRI, dan KRI di Malaysia.",
};

type LayananPageProps = {
  searchParams: Promise<{ intent?: string; state?: string; district?: string }>;
};

const intents = [
  { value: "CONSULAR", label: "Urusan konsuler" },
  { value: "IMMIGRATION", label: "Imigrasi dan dokumen perjalanan" },
  { value: "PROTECTION", label: "Perlindungan WNI" },
] as const;

type PublicOffice = { id: string; mission_code: string; name: string; evidence_url: string };
type PublicJurisdiction = { id: string; office_id: string; state_normalized: string; district_normalized: string | null };
type PublicService = { id: string; office_id: string; service_category_id: string; service_code: string; name: string };
type PublicContact = { id: string; office_id: string; service_category_id: string | null; label: string; raw_value: string; url: string | null };
type PublicFee = { id: string; mission_service_id: string; fee_label: string; amount: number | null; currency: string | null; is_free: boolean };

export default async function LayananPage({ searchParams }: LayananPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [officeResult, jurisdictionResult, serviceResult, contactResult, feeResult] = await Promise.all([
    supabase.from("layanan_public_offices").select("id,mission_code,name,evidence_url").eq("country_code", "MY"),
    supabase.from("layanan_public_jurisdictions").select("id,office_id,state_normalized,district_normalized").eq("country_code", "MY"),
    supabase.from("layanan_public_mission_services").select("id,office_id,service_category_id,service_code,name"),
    supabase.from("layanan_public_contact_channels").select("id,office_id,service_category_id,label,raw_value,url").eq("country_code", "MY"),
    supabase.from("layanan_public_fees").select("id,mission_service_id,fee_label,amount,currency,is_free"),
  ]);
  const hasLoadError = [officeResult, jurisdictionResult, serviceResult, contactResult, feeResult].some((result) => result.error);
  const offices = (officeResult.data ?? []) as PublicOffice[];
  const jurisdictions = (jurisdictionResult.data ?? []) as PublicJurisdiction[];
  const services = (serviceResult.data ?? []) as PublicService[];
  const contacts = (contactResult.data ?? []) as PublicContact[];
  const fees = (feeResult.data ?? []) as PublicFee[];
  const submitted = Boolean(params.state || params.district || params.intent);
  const resolution = submitted ? resolveMalaysiaJurisdiction(params.state, params.district) : null;
  const configuredMission = resolution?.status === "resolved" ? malaysiaMissions[resolution.missionCode] : null;
  const jurisdiction = resolution?.status === "resolved"
    ? jurisdictions.find((item) => item.state_normalized === normalizeMalaysiaLocation(resolution.canonicalState)
      && item.district_normalized === (resolution.canonicalDistrict ? normalizeMalaysiaLocation(resolution.canonicalDistrict) : null))
    : undefined;
  const mission = jurisdiction ? offices.find((item) => item.id === jurisdiction.office_id) : undefined;
  const selectedService = mission && params.intent
    ? services.find((item) => item.office_id === mission.id && item.service_code === params.intent)
    : undefined;
  const serviceContacts = mission ? contacts.filter((item) => item.office_id === mission.id
    && (item.service_category_id === null || item.service_category_id === selectedService?.service_category_id)) : [];
  const serviceFees = selectedService ? fees.filter((item) => item.mission_service_id === selectedService.id) : [];

  return (
    <main className="flex-1 bg-slate-50 pb-20">
      <section className="border-b border-emerald-100 bg-emerald-950 text-white">
        <Container className="py-12 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">DUTA Layanan WNI</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Smart Gateway ke layanan KBRI/KJRI di Malaysia.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">Mulai dari kebutuhan dan lokasi Anda. DUTA menentukan kantor berdasarkan yurisdiksi resmi—bukan jarak terdekat.</p>
        </Container>
      </section>

      <Container>
        {hasLoadError && <section role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-bold text-rose-950">Data layanan belum dapat dimuat</h2><p className="mt-2 text-sm text-rose-800">Tidak ada data yang diterka atau ditampilkan dari tabel privat. Silakan coba lagi.</p></section>}
        <section aria-labelledby="gateway-title" className="relative -mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-7">
          <h2 id="gateway-title" className="text-xl font-bold text-slate-950">Temukan kantor yang melayani wilayah Anda</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sabah memerlukan distrik agar DUTA tidak mengarahkan Anda ke kantor yang salah.</p>
          <form className="mt-6 grid gap-5 lg:grid-cols-3" aria-describedby="gateway-help">
            <label className="text-sm font-semibold text-slate-800">Apa yang ingin Anda urus?
              <select name="intent" defaultValue={params.intent ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-emerald-100" required>
                <option value="" disabled>Pilih kebutuhan</option>
                {intents.map((intent) => <option key={intent.value} value={intent.value}>{intent.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-800">Anda berada di negeri/wilayah mana?
              <select name="state" defaultValue={params.state ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-emerald-100" required>
                <option value="" disabled>Pilih negeri atau wilayah</option>
                {malaysiaStateOptions.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-800">Distrik Sabah (jika berkenaan)
              <select name="district" defaultValue={params.district ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-emerald-100">
                <option value="">Tidak berkenaan / pilih distrik</option>
                {sabahDistrictOptions.map((district) => <option key={district} value={district}>{district}</option>)}
              </select>
            </label>
            <p id="gateway-help" className="text-xs leading-5 text-slate-500 lg:col-span-2">DUTA menggunakan pemetaan yurisdiksi deterministik. Lokasi yang tidak dikenal tidak akan ditebak.</p>
            <button className="min-h-12 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white hover:bg-brand-800 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-emerald-500">Cari kantor layanan</button>
          </form>
        </section>

        {!submitted && <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h2 className="font-bold text-slate-950">Mulai dengan kebutuhan dan lokasi</h2><p className="mt-2 text-sm text-slate-600">Hasil kantor akan tampil setelah informasi lokasi cukup untuk menentukan yurisdiksi.</p></section>}

        {resolution?.status === "ambiguous" && <section role="status" aria-live="polite" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-bold text-amber-950">Anda berada di daerah mana di Sabah?</h2><p className="mt-2 text-sm leading-6 text-amber-900">Pilih distrik Sabah di formulir. DUTA tidak menggunakan jarak atau menebak kantor.</p></section>}

        {resolution?.status === "unsupported" && <section role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-bold text-rose-950">Lokasi belum didukung</h2><p className="mt-2 text-sm leading-6 text-rose-800">Semak negeri dan distrik yang dipilih. Lokasi yang tidak dikenali tidak akan diarahkan secara otomatis.</p></section>}

        {resolution?.status === "resolved" && !hasLoadError && !mission && <section role="status" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-bold text-amber-950">Kantor belum tersedia untuk dipublikasikan</h2><p className="mt-2 text-sm text-amber-900">Pemetaan lokal menunjuk ke {configuredMission?.name}, tetapi DUTA hanya menampilkan kantor yang lolos curated public reader.</p></section>}

        {resolution?.status === "resolved" && mission && <section aria-labelledby="mission-result" className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="bg-slate-950 p-6 text-white sm:p-8"><p className="text-sm font-bold uppercase tracking-wider text-emerald-300">Kantor berdasarkan yurisdiksi</p><h2 id="mission-result" className="mt-3 text-2xl font-bold sm:text-3xl">{mission.name}</h2><p className="mt-3 text-sm leading-6 text-slate-300">Kode misi: {mission.mission_code} · Wilayah: {resolution.canonicalDistrict ?? resolution.canonicalState}</p></div><div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2"><div><h3 className="font-bold text-slate-950">Layanan</h3>{selectedService ? <p className="mt-2 text-sm text-slate-700">{selectedService.name}</p> : <p className="mt-2 text-sm text-slate-600">Layanan yang dipilih belum tersedia melalui pembaca publik terverifikasi.</p>}<Link href={mission.evidence_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center font-bold text-brand-700 hover:underline">Buka bukti resmi kantor</Link></div><div><h3 className="font-bold text-slate-950">Kontak resmi</h3>{serviceContacts.length ? <ul className="mt-2 space-y-2 text-sm text-slate-700">{serviceContacts.map((contact) => <li key={contact.id}>{contact.url ? <Link href={contact.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">{contact.label}</Link> : <span><strong>{contact.label}:</strong> {contact.raw_value}</span>}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Belum ada kontak yang memenuhi bukti dan syarat publikasi.</p>}</div><div><h3 className="font-bold text-slate-950">Biaya terverifikasi</h3>{serviceFees.length ? <ul className="mt-2 space-y-2 text-sm text-slate-700">{serviceFees.map((fee) => <li key={fee.id}><strong>{fee.fee_label}:</strong> {fee.is_free ? "Gratis" : `${fee.currency ?? ""} ${fee.amount ?? ""}`.trim()}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Belum ada biaya yang memenuhi bukti dan syarat publikasi.</p>}</div><div><h3 className="font-bold text-slate-950">Pilihan lainnya</h3><Link href="/connect" className="mt-2 inline-flex min-h-11 items-center font-bold text-brand-700 hover:underline">Lihat direktori terverifikasi di DUTA Connect</Link></div></div></section>}
      </Container>
    </main>
  );
}
