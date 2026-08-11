import Link from "next/link";
import { Container } from "@/components/ui/container";
import { VerificationBadge } from "@/components/data/verification-badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "DUTA Connect", description: "Temukan kantor perwakilan dan kontak layanan resmi yang relevan untuk wilayah Anda." };

export const dynamic = "force-dynamic";

type ConnectPageProps = {
  searchParams: Promise<{ state?: string; service?: string }>;
};

type PublicOffice = {
  id: string;
  country_code: string;
  name: string;
  office_type: string;
  source_name: string;
  evidence_url: string;
};

type PublicJurisdiction = {
  id: string;
  office_id: string;
  state_name: string;
};

type PublicService = {
  office_id: string;
  service_category_id: string;
  name: string;
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

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: officeData }, { data: jurisdictionData }, { data: serviceData }] = await Promise.all([
    supabase
      .from("layanan_public_offices")
      .select("id, country_code, name, office_type, source_name, evidence_url")
      .eq("country_code", "MY")
      .order("name"),
    supabase
      .from("layanan_public_jurisdictions")
      .select("id, state_name, office_id")
      .eq("country_code", "MY")
      .order("state_name"),
    supabase
      .from("layanan_public_mission_services")
      .select("office_id, service_category_id, name")
      .order("name"),
  ]);

  const offices = (officeData ?? []) as PublicOffice[];
  const officeIds = new Set(offices.map((office) => office.id));
  const jurisdictions = ((jurisdictionData ?? []) as PublicJurisdiction[])
    .filter((jurisdiction) => officeIds.has(jurisdiction.office_id));
  const missionServices = ((serviceData ?? []) as PublicService[])
    .filter((service) => officeIds.has(service.office_id));
  const selectedJurisdiction = jurisdictions.find((item) => item.id === params.state);
  const selectedOffice = offices.find((office) => office.id === selectedJurisdiction?.office_id);
  const availableServices = missionServices.filter(
    (service, index, rows) => rows.findIndex(
      (candidate) => candidate.service_category_id === service.service_category_id,
    ) === index,
  );
  const selectedService = availableServices.find((item) => item.service_category_id === params.service);
  let contacts: PublicContact[] = [];

  if (selectedJurisdiction && selectedService) {
    const { data } = await supabase
      .from("layanan_public_contact_channels")
      .select("id, channel_type, label, raw_value, e164_phone, url, last_verified_at, source_name, evidence_url")
      .eq("office_id", selectedJurisdiction.office_id)
      .eq("service_category_id", selectedService.service_category_id)
      .order("display_order");
    contacts = (data ?? []) as PublicContact[];
  }

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">DUTA Connect</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Temukan kantor dan saluran layanan yang relevan</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">Pilih lokasi Anda di Malaysia, lalu pilih kategori layanan. Data demo selalu ditandai dan tidak boleh digunakan sebagai informasi resmi.</p>
        </div>

        <form className="mt-8 grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
          <div>
            <label htmlFor="state" className="block text-sm font-semibold text-slate-800">Negeri/lokasi Anda</label>
            <select id="state" name="state" defaultValue={params.state ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3" required>
              <option value="" disabled>Pilih lokasi</option>
              {jurisdictions.map((item) => <option key={item.id} value={item.id}>{item.state_name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="service" className="block text-sm font-semibold text-slate-800">Kategori layanan</label>
            <select id="service" name="service" defaultValue={params.service ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3" required>
              <option value="" disabled>Pilih layanan</option>
              {availableServices.map((item) => <option key={item.service_category_id} value={item.service_category_id}>{item.name}</option>)}
            </select>
          </div>
          <button type="submit" className="min-h-11 rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 sm:col-span-2">Tampilkan kontak</button>
        </form>

        {jurisdictions.length === 0 && (
          <p className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Data DUTA Connect belum tersedia. Admin dapat menambah data terverifikasi setelah migrasi Day 2 diterapkan.</p>
        )}

        {selectedJurisdiction && selectedService && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-950">{selectedOffice?.name}</h2>
              <VerificationBadge status="verified" isDemo={false} />
            </div>
            <p className="mt-2 text-slate-600">Wilayah: {selectedJurisdiction.state_name} · Layanan: {selectedService.name}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {contacts.map((contact) => {
                const href = contactHref(contact);
                return (
                  <div key={contact.id} className="rounded-xl border border-slate-200 p-4">
                    <VerificationBadge status="verified" isDemo={false} />
                    <h3 className="mt-3 font-semibold text-slate-950">{contact.label}</h3>
                    {href ? <Link href={href} className="mt-2 block break-all text-brand-700 hover:underline">{contact.raw_value}</Link> : <p className="mt-2 break-all text-slate-700">{contact.raw_value}</p>}
                    <Link href={contact.evidence_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline">Sumber: {contact.source_name}</Link>
                  </div>
                );
              })}
              {contacts.length === 0 && <p className="text-slate-600">Belum ada saluran kontak untuk pilihan ini.</p>}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
