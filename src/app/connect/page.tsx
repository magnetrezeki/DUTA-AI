import Link from "next/link";
import { Container } from "@/components/ui/container";
import { VerificationBadge } from "@/components/data/verification-badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "DUTA Connect",
  description: "Temukan kantor perwakilan dan kontak layanan resmi yang relevan untuk wilayah Anda.",
};

export const dynamic = "force-dynamic";

type ConnectPageProps = {
  searchParams: Promise<{ state?: string; service?: string }>;
};

type PublicOffice = {
  id: string;
  country_code: string;
  name: string;
  office_type: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  last_verified_at: string | null;
  source_name: string;
  evidence_url: string;
};

type PublicJurisdiction = {
  id: string;
  office_id: string;
  state_name: string;
  district_name: string | null;
};

type PublicService = {
  office_id: string;
  service_category_id: string;
  name: string;
  appointment_required: boolean;
  walk_in_allowed: boolean;
};

type PublicContact = {
  id: string;
  channel_type: string;
  label: string;
  raw_value: string;
  e164_phone: string | null;
  url: string | null;
  last_verified_at: string | null;
  source_name: string;
  evidence_url: string;
};

const officeTypeLabels: Record<string, string> = {
  embassy: "Kedutaan Besar",
  consulate_general: "Konsulat Jenderal",
  consulate: "Konsulat",
};

function contactHref(contact: PublicContact) {
  if (contact.channel_type === "email") return `mailto:${contact.raw_value}`;
  if (["phone", "emergency_hotline"].includes(contact.channel_type)) {
    return `tel:${contact.e164_phone ?? contact.raw_value}`;
  }
  if (["website", "service_portal", "appointment_portal", "directions"].includes(contact.channel_type) && contact.url) {
    return contact.url;
  }
  return null;
}

function directionsHref(office: PublicOffice) {
  if (office.latitude != null && office.longitude != null) {
    return `https://www.openstreetmap.org/?mlat=${office.latitude}&mlon=${office.longitude}#map=16/${office.latitude}/${office.longitude}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${office.name}, ${office.address}, ${office.city}`)}`;
}

function formatVerifiedDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function Icon({ name }: { name: "search" | "location" | "shield" | "arrow" | "building" | "contact" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    building: <><path d="M4 21h16M6 21V7l6-4 6 4v14M9 10h1m4 0h1M9 14h1m4 0h1M10 21v-3h4v3" /></>,
    contact: <><path d="M7 4h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-5l-5 4v-4a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" /><path d="M8 9h8M8 13h5" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">{paths[name]}</svg>;
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [officeResult, jurisdictionResult, serviceResult] = await Promise.all([
    supabase.from("layanan_public_offices").select("id,country_code,name,office_type,city,address,latitude,longitude,last_verified_at,source_name,evidence_url").eq("country_code", "MY").order("name"),
    supabase.from("layanan_public_jurisdictions").select("id,state_name,district_name,office_id").eq("country_code", "MY").order("state_name"),
    supabase.from("layanan_public_mission_services").select("office_id,service_category_id,name,appointment_required,walk_in_allowed").order("name"),
  ]);

  const hasLoadError = Boolean(officeResult.error || jurisdictionResult.error || serviceResult.error);
  const offices = (officeResult.data ?? []) as PublicOffice[];
  const officeIds = new Set(offices.map((office) => office.id));
  const jurisdictions = ((jurisdictionResult.data ?? []) as PublicJurisdiction[]).filter((item) => officeIds.has(item.office_id));
  const missionServices = ((serviceResult.data ?? []) as PublicService[]).filter((item) => officeIds.has(item.office_id));
  const selectedJurisdiction = jurisdictions.find((item) => item.id === params.state);
  const selectedOffice = offices.find((office) => office.id === selectedJurisdiction?.office_id);
  const availableServices = missionServices.filter((service, index, rows) => rows.findIndex((candidate) => candidate.service_category_id === service.service_category_id) === index);
  const selectedService = availableServices.find((item) => item.service_category_id === params.service);
  const officeServices = selectedOffice ? missionServices.filter((service) => service.office_id === selectedOffice.id) : [];
  let contacts: PublicContact[] = [];
  let contactLoadError = false;

  if (selectedJurisdiction && selectedService) {
    const result = await supabase.from("layanan_public_contact_channels")
      .select("id,channel_type,label,raw_value,e164_phone,url,last_verified_at,source_name,evidence_url")
      .eq("office_id", selectedJurisdiction.office_id)
      .eq("service_category_id", selectedService.service_category_id)
      .order("display_order");
    contacts = (result.data ?? []) as PublicContact[];
    contactLoadError = Boolean(result.error);
  }

  const selectionComplete = Boolean(selectedJurisdiction && selectedService);

  return (
    <main className="flex-1 bg-slate-50 pb-20">
      <section className="border-b border-emerald-100 bg-emerald-950 text-white">
        <Container className="grid gap-7 py-10 sm:py-12 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:py-14">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300"><Icon name="shield" /> DUTA Connect</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Temukan layanan dan kantor yang sesuai.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">Temukan kantor perwakilan Indonesia dan saluran layanan yang sesuai dengan lokasi serta kebutuhan Anda di Malaysia.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="flex items-center gap-2 font-semibold"><Icon name="shield" /> Informasi yang dapat ditelusuri</p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">Setiap hasil berasal dari pembaca publik terkurasi dan dilengkapi tautan bukti sumber.</p>
          </div>
        </Container>
      </section>

      <Container>
        <section aria-labelledby="discovery-title" className="relative -mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] sm:p-7">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-emerald-50 p-2.5 text-brand-700"><Icon name="search" /></span>
            <div><h2 id="discovery-title" className="text-lg font-bold text-slate-950">Cari layanan resmi</h2><p className="mt-1 text-sm text-slate-600">Pilih lokasi dahulu, kemudian jenis bantuan yang Anda perlukan.</p></div>
          </div>
          <form className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <label htmlFor="state" className="block text-sm font-semibold text-slate-800"><span className="mr-2 text-brand-700">1.</span>Di mana Anda berada?</label>
              <select id="state" name="state" defaultValue={params.state ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-slate-900 outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-emerald-100" required>
                <option value="" disabled>Pilih lokasi Anda</option>
                {jurisdictions.map((item) => <option key={item.id} value={item.id}>{item.state_name}{item.district_name ? ` — ${item.district_name}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="service" className="block text-sm font-semibold text-slate-800"><span className="mr-2 text-brand-700">2.</span>Bantuan apa yang diperlukan?</label>
              <select id="service" name="service" defaultValue={params.service ?? ""} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-slate-900 outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-emerald-100" required>
                <option value="" disabled>Pilih jenis layanan</option>
                {availableServices.map((item) => <option key={item.service_category_id} value={item.service_category_id}>{item.name}</option>)}
              </select>
            </div>
            <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-emerald-500">Tampilkan kantor & kontak <Icon name="arrow" /></button>
          </form>
          {(params.state || params.service) && <Link href="/connect" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">Hapus pilihan dan mulai semula</Link>}
        </section>

        {hasLoadError && (
          <section role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h2 className="font-bold text-rose-950">Data layanan belum dapat dimuat</h2>
            <p className="mt-2 text-sm leading-6 text-rose-800">Silakan muat ulang halaman. Jika masalah berlanjut, gunakan tautan sumber resmi pada halaman utama DUTA.</p>
          </section>
        )}

        {!hasLoadError && jurisdictions.length === 0 && (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Icon name="location" /></span>
            <h2 className="mt-4 text-lg font-bold text-slate-950">Layanan belum tersedia untuk ditampilkan</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Data hanya akan muncul setelah kantor, wilayah, layanan, dan bukti sumbernya memenuhi persyaratan publikasi.</p>
          </section>
        )}

        {selectionComplete && selectedOffice && (
          <section aria-labelledby="result-title" className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-700">Hasil yang disarankan</p><h2 id="result-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Kantor untuk kebutuhan Anda</h2></div>
              <p className="text-sm text-slate-500">1 kantor sesuai pilihan</p>
            </div>
            <article className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
                <div className="bg-slate-950 p-6 text-white sm:p-8">
                  <div className="flex flex-wrap items-center gap-2"><VerificationBadge status="verified" isDemo={false} /><span className="text-xs font-semibold text-slate-300">Dijamin oleh pembaca publik terkurasi · diperiksa {formatVerifiedDate(selectedOffice.last_verified_at) ?? "oleh sumber resmi"}</span></div>
                  <p className="mt-6 text-sm font-semibold text-emerald-300">{officeTypeLabels[selectedOffice.office_type] ?? selectedOffice.office_type}</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{selectedOffice.name}</h3>
                  <div className="mt-5 flex gap-3 text-sm leading-6 text-slate-300"><Icon name="location" /><span>{selectedOffice.address}<br />{selectedOffice.city}</span></div>
                  <p className="mt-5 text-xs leading-5 text-slate-400">Sumber: {selectedOffice.source_name}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                    <Link href={selectedOffice.evidence_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-50">Buka laman resmi <Icon name="arrow" /></Link>
                    <Link href={directionsHref(selectedOffice)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"><Icon name="location" /> Lihat lokasi</Link>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3"><span className="rounded-lg bg-emerald-50 p-2 text-brand-700"><Icon name="contact" /></span><div><p className="text-sm text-slate-500">Layanan dipilih</p><p className="font-bold text-slate-950">{selectedService?.name}</p></div></div>
                  {officeServices.length > 0 && <div className="mt-5 flex flex-wrap gap-2" aria-label="Layanan yang tersedia">{officeServices.map((service) => <span key={`${service.office_id}-${service.service_category_id}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">{service.name}</span>)}</div>}
                  {contactLoadError ? (
                    <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Saluran kontak belum dapat dimuat. Gunakan tombol laman resmi untuk mendapatkan bantuan.</div>
                  ) : contacts.length > 0 ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {contacts.map((contact) => {
                        const href = contactHref(contact);
                        return <div key={contact.id} className="min-w-0 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{contact.label}</p>
                          {href ? <Link href={href} className="mt-2 block min-h-11 break-words py-2 font-semibold text-brand-700 hover:underline">{contact.raw_value}</Link> : <p className="mt-2 break-words py-2 font-semibold text-slate-800">{contact.raw_value}</p>}
                          <Link href={contact.evidence_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-slate-500 hover:text-brand-700">Bukti: {contact.source_name}</Link>
                        </div>;
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5"><p className="font-semibold text-slate-900">Belum ada kontak khusus untuk pilihan ini</p><p className="mt-1 text-sm leading-6 text-slate-600">Gunakan laman resmi kantor. DUTA tidak menampilkan nomor atau alamat yang belum memiliki bukti publikasi.</p></div>
                  )}
                </div>
              </div>
            </article>
          </section>
        )}

        {!hasLoadError && jurisdictions.length > 0 && !selectionComplete && (
          <section aria-labelledby="office-list-title" className="mt-12">
            <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-700">Jaringan bantuan</p><h2 id="office-list-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Kantor perwakilan yang tersedia</h2><p className="mt-3 text-slate-600">Pilih lokasi dan layanan di atas untuk mendapatkan rute serta saluran kontak yang paling relevan.</p></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {offices.map((office) => {
                const states = [...new Set(jurisdictions.filter((item) => item.office_id === office.id).map((item) => item.state_name))];
                const services = missionServices.filter((item) => item.office_id === office.id);
                return <article key={office.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-emerald-50 p-2.5 text-brand-700"><Icon name="building" /></span><VerificationBadge status="verified" isDemo={false} /></div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">{officeTypeLabels[office.office_type] ?? office.office_type}</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">{office.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{office.city}{states.length ? ` · Melayani ${states.slice(0, 2).join(", ")}${states.length > 2 ? ` +${states.length - 2}` : ""}` : ""}</p>
                  <p className="mt-4 text-sm font-semibold text-slate-800">{services.length} kategori layanan tersedia</p>
                  <Link href={office.evidence_url} target="_blank" rel="noreferrer" className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-bold text-brand-700 hover:underline">Lihat sumber resmi <Icon name="arrow" /></Link>
                </article>;
              })}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
