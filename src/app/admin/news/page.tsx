import Link from "next/link";
import { createNewsItem, createOfficialSource } from "@/app/admin/day2-actions";
import { AdminForm, selectClass, VerificationFields } from "@/components/admin/admin-form";
import { Field, FormNotice, SubmitButton } from "@/components/auth/form-elements";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminNewsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminNewsPage({ searchParams }: AdminNewsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: sources }, { data: items }] = await Promise.all([
    supabase.from("official_sources").select("id, name, is_demo").eq("scope", "news").order("name"),
    supabase.from("news_items").select("id, title, publication_status, verification_status, is_demo").order("created_at", { ascending: false }).limit(20),
  ]);

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Admin · DUTA News</p><h1 className="mt-3 text-3xl font-bold text-slate-950">Kelola sumber dan URL berita resmi</h1><p className="mt-2 max-w-3xl text-slate-600">Masukkan URL resmi secara manual. Feed dan API tetap dinonaktifkan sampai integrasinya diotorisasi.</p></div>
          <Link href="/admin" className="font-semibold text-brand-700 hover:underline">Kembali ke admin</Link>
        </div>
        <div className="mt-6 max-w-2xl">{params.success && <FormNotice tone="success">Data berita berhasil disimpan.</FormNotice>}{params.error && <FormNotice tone="error">Data belum tersimpan. Periksa URL dan verifikasi.</FormNotice>}</div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AdminForm title="1. Tambah sumber berita resmi">
            <form action={createOfficialSource} className="space-y-4">
              <input type="hidden" name="scope" value="news" />
              <Field id="news-source-name" name="name" label="Nama sumber" required />
              <Field id="news-source-url" name="sourceUrl" type="url" label="URL sumber resmi" placeholder="https://" required />
              <VerificationFields prefix="news-source" />
              <SubmitButton>Simpan sumber</SubmitButton>
            </form>
          </AdminForm>
          <AdminForm title="2. Tambah URL berita resmi">
            <form action={createNewsItem} className="space-y-4">
              <div><label htmlFor="news-source" className="block text-sm font-semibold">Sumber</label><select id="news-source" name="sourceId" className={selectClass} required><option value="">Pilih sumber</option>{(sources ?? []).map((source) => <option key={source.id} value={source.id}>{source.name}{source.is_demo ? " (DEMO)" : ""}</option>)}</select></div>
              <Field id="news-title" name="title" label="Judul" required />
              <Field id="official-url" name="officialUrl" type="url" label="URL berita resmi" placeholder="https://" required />
              <div><label htmlFor="news-summary" className="block text-sm font-semibold">Ringkasan</label><textarea id="news-summary" name="summary" className={`${selectClass} min-h-24`} /></div>
              <div><label htmlFor="published-at" className="block text-sm font-semibold">Tanggal publikasi</label><input id="published-at" name="publishedAt" type="datetime-local" className={selectClass} /></div>
              <div><label htmlFor="publication-status" className="block text-sm font-semibold">Status publikasi</label><select id="publication-status" name="publicationStatus" className={selectClass} defaultValue="draft"><option value="draft">Draf</option><option value="published">Publikasikan</option><option value="archived">Arsip</option></select></div>
              <VerificationFields prefix="news-item" />
              <SubmitButton>Simpan berita</SubmitButton>
            </form>
          </AdminForm>
        </div>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Entri terbaru</h2><ul className="mt-4 divide-y divide-slate-200">{(items ?? []).map((item) => <li key={item.id} className="py-3"><span className="font-semibold">{item.title}</span><span className="ml-2 text-sm text-slate-500">{item.publication_status} · {item.verification_status}{item.is_demo ? " · DEMO" : ""}</span></li>)}</ul>{(items ?? []).length === 0 && <p className="mt-3 text-slate-600">Belum ada entri.</p>}</section>
      </Container>
    </main>
  );
}
