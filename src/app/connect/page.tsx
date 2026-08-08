import Link from "next/link";
import { Container } from "@/components/ui/container";
import { VerificationBadge } from "@/components/data/verification-badge";
import { createClient } from "@/lib/supabase/server";
import type {
  ContactChannel,
  Jurisdiction,
  ServiceCategory,
} from "@/lib/day2/types";

export const dynamic = "force-dynamic";

type ConnectPageProps = {
  searchParams: Promise<{ state?: string; service?: string }>;
};

function contactHref(contact: ContactChannel) {
  if (contact.channel_type === "email") return `mailto:${contact.channel_value}`;
  if (contact.channel_type === "phone") return `tel:${contact.channel_value}`;
  if (contact.channel_type === "website" && contact.channel_value.startsWith("https://")) {
    return contact.channel_value;
  }
  return null;
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: jurisdictionData }, { data: serviceData }] = await Promise.all([
    supabase
      .from("office_jurisdictions")
      .select("id, state_name, office_id, is_demo, office:representative_offices(id, name, office_type, source:official_sources(id, name, source_url, verification_status, last_verified_at, is_demo))")
      .eq("country_code", "MY")
      .order("state_name"),
    supabase
      .from("service_categories")
      .select("id, name, description, is_demo")
      .eq("is_active", true)
      .order("name"),
  ]);

  const jurisdictions = (jurisdictionData ?? []) as unknown as Jurisdiction[];
  const services = (serviceData ?? []) as ServiceCategory[];
  const selectedJurisdiction = jurisdictions.find((item) => item.id === params.state);
  const selectedService = services.find((item) => item.id === params.service);
  let contacts: ContactChannel[] = [];

  if (selectedJurisdiction && selectedService) {
    const { data } = await supabase
      .from("office_contact_channels")
      .select("id, channel_type, label, channel_value, verification_status, last_verified_at, is_demo, source:official_sources(id, name, source_url, verification_status, last_verified_at, is_demo)")
      .eq("office_id", selectedJurisdiction.office_id)
      .eq("service_category_id", selectedService.id)
      .eq("is_active", true)
      .order("channel_type");
    contacts = (data ?? []) as unknown as ContactChannel[];
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
              {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
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
              <h2 className="text-2xl font-bold text-slate-950">{selectedJurisdiction.office?.name}</h2>
              <VerificationBadge status={selectedJurisdiction.office?.source?.verification_status ?? "unverified"} isDemo={selectedJurisdiction.is_demo || Boolean(selectedJurisdiction.office?.source?.is_demo)} />
            </div>
            <p className="mt-2 text-slate-600">Wilayah: {selectedJurisdiction.state_name} · Layanan: {selectedService.name}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {contacts.map((contact) => {
                const href = contactHref(contact);
                return (
                  <div key={contact.id} className="rounded-xl border border-slate-200 p-4">
                    <VerificationBadge status={contact.verification_status} isDemo={contact.is_demo} />
                    <h3 className="mt-3 font-semibold text-slate-950">{contact.label}</h3>
                    {href ? <Link href={href} className="mt-2 block break-all text-brand-700 hover:underline">{contact.channel_value}</Link> : <p className="mt-2 break-all text-slate-700">{contact.channel_value}</p>}
                    {contact.source && <Link href={contact.source.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline">Lihat sumber</Link>}
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
