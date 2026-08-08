import Link from "next/link";
import {
  createContactChannel,
  createJurisdiction,
  createOffice,
  createOfficialSource,
  createServiceCategory,
} from "@/app/admin/day2-actions";
import { AdminForm, selectClass, VerificationFields } from "@/components/admin/admin-form";
import { Field, FormNotice, SubmitButton } from "@/components/auth/form-elements";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminConnectPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminConnectPage({ searchParams }: AdminConnectPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [sourcesResult, officesResult, servicesResult] = await Promise.all([
    supabase.from("official_sources").select("id, name, scope, is_demo").eq("scope", "representative_office").order("name"),
    supabase.from("representative_offices").select("id, name, is_demo").order("name"),
    supabase.from("service_categories").select("id, name, is_demo").order("name"),
  ]);
  const sources = sourcesResult.data ?? [];
  const offices = officesResult.data ?? [];
  const services = servicesResult.data ?? [];

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Admin · DUTA Connect</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">Kelola kantor dan saluran layanan</h1>
            <p className="mt-2 max-w-3xl text-slate-600">Masukkan hanya informasi yang memiliki URL sumber. Data resmi belum muncul ke publik sampai berstatus terverifikasi dan memiliki tanggal verifikasi.</p>
          </div>
          <Link href="/admin" className="font-semibold text-brand-700 hover:underline">Kembali ke admin</Link>
        </div>
        <div className="mt-6 max-w-2xl">
          {params.success && <FormNotice tone="success">Data berhasil disimpan.</FormNotice>}
          {params.error && <FormNotice tone="error">Data belum tersimpan. Periksa semua bidang, sumber, dan status verifikasi.</FormNotice>}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AdminForm title="1. Tambah sumber resmi kantor">
            <form action={createOfficialSource} className="space-y-4">
              <input type="hidden" name="scope" value="representative_office" />
              <Field id="office-source-name" name="name" label="Nama sumber" required />
              <Field id="office-source-url" name="sourceUrl" type="url" label="URL sumber resmi" placeholder="https://" required />
              <VerificationFields prefix="office-source" />
              <SubmitButton>Simpan sumber</SubmitButton>
            </form>
          </AdminForm>

          <AdminForm title="2. Tambah kantor perwakilan">
            <form action={createOffice} className="space-y-4">
              <Field id="office-name" name="name" label="Nama kantor" required />
              <div><label htmlFor="office-type" className="block text-sm font-semibold">Jenis kantor</label><select id="office-type" name="officeType" className={selectClass} required><option value="embassy">Kedutaan</option><option value="consulate_general">Konsulat Jenderal</option><option value="consulate">Konsulat</option><option value="other">Lainnya</option></select></div>
              <div><label htmlFor="office-source" className="block text-sm font-semibold">Sumber resmi</label><select id="office-source" name="sourceId" className={selectClass} required><option value="">Pilih sumber</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.name}{source.is_demo ? " (DEMO)" : ""}</option>)}</select></div>
              <VerificationFields prefix="office" />
              <SubmitButton>Simpan kantor</SubmitButton>
            </form>
          </AdminForm>

          <AdminForm title="3. Tambah yurisdiksi kantor">
            <form action={createJurisdiction} className="space-y-4">
              <div><label htmlFor="jurisdiction-office" className="block text-sm font-semibold">Kantor</label><select id="jurisdiction-office" name="officeId" className={selectClass} required><option value="">Pilih kantor</option>{offices.map((office) => <option key={office.id} value={office.id}>{office.name}{office.is_demo ? " (DEMO)" : ""}</option>)}</select></div>
              <Field id="state-name" name="stateName" label="Nama negeri/lokasi" required />
              <div><label htmlFor="jurisdiction-source" className="block text-sm font-semibold">Sumber yurisdiksi</label><select id="jurisdiction-source" name="sourceId" className={selectClass} required><option value="">Pilih sumber</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></div>
              <VerificationFields prefix="jurisdiction" />
              <SubmitButton>Simpan yurisdiksi</SubmitButton>
            </form>
          </AdminForm>

          <AdminForm title="4. Tambah kategori layanan">
            <form action={createServiceCategory} className="space-y-4">
              <Field id="service-slug" name="slug" label="Kode kategori" placeholder="contoh-kategori" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
              <Field id="service-name" name="name" label="Nama kategori" required />
              <div><label htmlFor="service-description" className="block text-sm font-semibold">Deskripsi</label><textarea id="service-description" name="description" className={`${selectClass} min-h-24`} /></div>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="isDemo" value="true" /> Catat sebagai DEMO</label>
              <SubmitButton>Simpan kategori</SubmitButton>
            </form>
          </AdminForm>

          <AdminForm title="5. Tambah saluran kontak layanan">
            <form action={createContactChannel} className="space-y-4">
              <div><label htmlFor="contact-office" className="block text-sm font-semibold">Kantor</label><select id="contact-office" name="officeId" className={selectClass} required><option value="">Pilih kantor</option>{offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}</select></div>
              <div><label htmlFor="contact-service" className="block text-sm font-semibold">Kategori layanan</label><select id="contact-service" name="serviceCategoryId" className={selectClass} required><option value="">Pilih layanan</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div>
              <div><label htmlFor="channel-type" className="block text-sm font-semibold">Jenis saluran</label><select id="channel-type" name="channelType" className={selectClass} required><option value="phone">Telepon</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="website">Website</option></select></div>
              <Field id="contact-label" name="label" label="Label kontak" required />
              <Field id="contact-value" name="channelValue" label="Nomor, email, atau URL" required />
              <div><label htmlFor="contact-source" className="block text-sm font-semibold">Sumber kontak</label><select id="contact-source" name="sourceId" className={selectClass} required><option value="">Pilih sumber</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></div>
              <VerificationFields prefix="contact" />
              <SubmitButton>Simpan kontak</SubmitButton>
            </form>
          </AdminForm>
        </div>
      </Container>
    </main>
  );
}
