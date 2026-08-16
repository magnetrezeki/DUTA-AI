import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { VerificationBadge } from "@/components/data/verification-badge";
import { createClient } from "@/lib/supabase/server";

type NewsPageProps = { searchParams: Promise<{ region?: string; category?: string; sourceType?: string; view?: string }> };

type PublicNewsItem = {
  id: string;
  title: string;
  summary: string | null;
  official_url: string;
  original_publisher_url: string | null;
  published_at: string;
  region: string;
  province: string | null;
  source_name: string;
  source_type: string;
  source_group: string;
  source_url: string | null;
  verification_level: string;
  last_verified_at: string;
  thumbnail_url: string | null;
  categories: string[];
};

export const metadata = { title: "DUTA News", description: "Informasi terkurasi dengan sumber dan jejak verifikasi yang jelas." };
export const dynamic = "force-dynamic";

const regionLabels: Record<string, string> = { MALAYSIA: "Malaysia", NASIONAL: "Nasional", SUMATERA: "Sumatera", JAWA: "Jawa", NTT: "NTT", NTB: "NTB", KALIMANTAN: "Kalimantan", SULAWESI: "Sulawesi", MALUKU: "Maluku", PAPUA: "Papua" };
const sourceTypeLabels: Record<string, string> = { INDONESIAN_GOVERNMENT: "Pemerintah Indonesia", MALAYSIAN_GOVERNMENT: "Pemerintah Malaysia", MEDIA: "Media" };
const categoryLabels: Record<string, string> = { PUBLIC_SERVICE: "Layanan publik", MIGRATION: "Migrasi", IMMIGRATION: "Imigrasi", INDONESIA_MALAYSIA: "Indonesia–Malaysia", DIASPORA: "Diaspora", CONSULAR: "Konsuler", PROTECTION: "Perlindungan", EMPLOYMENT: "Ketenagakerjaan", EDUCATION: "Pendidikan", BUSINESS: "Bisnis", TRAVEL: "Perjalanan", COMMUNITY: "Komunitas" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function Icon({ name }: { name: "news" | "arrow" | "shield" | "filter" | "external" }) {
  const paths = {
    news: <><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5M8 17h8" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">{paths[name]}</svg>;
}

function NewsVisual({ item, featured = false }: { item: PublicNewsItem; featured?: boolean }) {
  const category = item.categories[0] ? (categoryLabels[item.categories[0]] ?? item.categories[0].replaceAll("_", " ")) : "Berita";
  return <div className={`relative flex items-end overflow-hidden bg-slate-900 ${featured ? "min-h-64 lg:min-h-full" : "min-h-44"}`}>
    <div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_top_right,_#047857_0,_transparent_45%),linear-gradient(145deg,_#0f172a,_#064e3b)]" />
    <div className="relative p-5 text-white sm:p-6"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">{category}</span><p className="mt-3 max-w-xs text-sm leading-6 text-emerald-50/75">{item.thumbnail_url ? "Gambar sumber tersedia; tampilan aman menggunakan identitas visual DUTA." : "Informasi terkurasi tanpa gambar sumber."}</p></div>
  </div>;
}

function NewsCard({ item }: { item: PublicNewsItem }) {
  return <article className="group grid min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 md:grid-cols-[13rem_1fr]">
    <NewsVisual item={item} />
    <div className="flex min-w-0 flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{sourceTypeLabels[item.source_type] ?? item.source_type}</span><span className="text-xs font-semibold text-slate-500">{formatDate(item.published_at)} · {regionLabels[item.region] ?? item.region}</span></div>
      <h2 className="mt-3 text-xl font-bold leading-snug text-slate-950 group-hover:text-brand-700">{item.title}</h2>
      {item.summary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.summary}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4"><VerificationBadge status="verified" isDemo={false} /><span className="min-w-0 truncate text-xs font-semibold text-slate-600">{item.source_name}</span><span className="text-xs text-slate-400">Level {item.verification_level}</span></div>
      <div className="mt-3 flex flex-wrap gap-3"><Link href={item.official_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-brand-700 underline-offset-4 hover:underline">Baca di sumber asal <Icon name="external" /><span className="sr-only"> di situs eksternal</span></Link>{item.source_url && <Link href={item.source_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-500 hover:text-brand-700">Profil sumber<span className="sr-only"> di situs eksternal</span></Link>}</div>
    </div>
  </article>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const result = await supabase.from("news_public_items")
    .select("id,title,summary,official_url,original_publisher_url,published_at,region,province,source_name,source_type,source_group,source_url,verification_level,last_verified_at,thumbnail_url,categories")
    .order("published_at", { ascending: false, nullsFirst: false });
  const allItems = (result.data ?? []) as PublicNewsItem[];
  const regions = [...new Set(allItems.map((item) => item.region))].sort();
  const categories = [...new Set(allItems.flatMap((item) => item.categories))].sort();
  const sourceTypes = [...new Set(allItems.map((item) => item.source_type))].sort();
  const viewFilteredItems = allItems.filter((item) => params.view !== "official" || item.source_type === "INDONESIAN_GOVERNMENT" || item.source_type === "MALAYSIAN_GOVERNMENT").filter((item) => params.view !== "malaysia" || item.region === "MALAYSIA");
  const newsItems = viewFilteredItems.filter((item) => (!params.region || item.region === params.region) && (!params.category || item.categories.includes(params.category)) && (!params.sourceType || item.source_type === params.sourceType));
  const featured = newsItems[0];
  const feedItems = featured ? newsItems.slice(1) : [];
  const filtersActive = Boolean(params.region || params.category || params.sourceType || params.view);

  return (
    <main className="flex-1 bg-slate-50 pb-20">
      <section className="border-b border-slate-200 bg-white">
        <Container className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl"><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-brand-700"><Icon name="news" /> DUTA News</p><h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Satu newsfeed, banyak sumber yang dapat dikenali.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Ikuti berita dan pengumuman terkurasi dari kantor perwakilan, pemerintah, dan media yang disetujui. Identitas sumber selalu menyertai setiap item.</p></div>
          <div className="flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><Icon name="shield" /><p className="text-sm leading-6"><strong className="block">Jejak sumber dipertahankan</strong>Judul, tanggal, wilayah, dan tautan penerbit tersedia tanpa membuka data administrasi internal.</p></div>
        </Container>
      </section>

      <Container>
        <nav aria-label="Mode DUTA News" className="mt-7 flex gap-2 overflow-x-auto pb-2"><FeedMode href="/news" active={!params.view}>Terbaru</FeedMode><FeedMode href="/news?view=official" active={params.view === "official"}>Sumber pemerintah</FeedMode><FeedMode href="/news?view=malaysia" active={params.view === "malaysia"}>Malaysia</FeedMode></nav>
        <section aria-labelledby="news-filter-title" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2"><span className="text-brand-700"><Icon name="filter" /></span><h2 id="news-filter-title" className="font-bold text-slate-950">Saring informasi</h2></div>
          <form className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            {params.view && <input type="hidden" name="view" value={params.view} />}
            <div><label htmlFor="region" className="block text-sm font-semibold text-slate-700">Wilayah</label><select id="region" name="region" defaultValue={params.region ?? ""} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-brand-700 focus:ring-4 focus:ring-emerald-100"><option value="">Semua wilayah</option>{regions.map((value) => <option key={value} value={value}>{regionLabels[value] ?? value}</option>)}</select></div>
            <div><label htmlFor="category" className="block text-sm font-semibold text-slate-700">Kategori</label><select id="category" name="category" defaultValue={params.category ?? ""} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-brand-700 focus:ring-4 focus:ring-emerald-100"><option value="">Semua kategori</option>{categories.map((value) => <option key={value} value={value}>{categoryLabels[value] ?? value.replaceAll("_", " ")}</option>)}</select></div>
            <div><label htmlFor="sourceType" className="block text-sm font-semibold text-slate-700">Jenis sumber</label><select id="sourceType" name="sourceType" defaultValue={params.sourceType ?? ""} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-brand-700 focus:ring-4 focus:ring-emerald-100"><option value="">Semua sumber</option>{sourceTypes.map((value) => <option key={value} value={value}>{sourceTypeLabels[value] ?? value.replaceAll("_", " ")}</option>)}</select></div>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800">Terapkan</button>
          </form>
          {filtersActive && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-slate-500">Filter aktif</span>{params.region && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{regionLabels[params.region] ?? params.region}</span>}{params.category && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{categoryLabels[params.category] ?? params.category}</span>}{params.sourceType && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{sourceTypeLabels[params.sourceType] ?? params.sourceType}</span>}<Link href="/news" className="inline-flex min-h-11 items-center px-2 text-xs font-bold text-brand-700 hover:underline">Hapus semua</Link></div>}
        </section>

        {result.error ? (
          <section role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-bold text-rose-950">Berita belum dapat dimuat</h2><p className="mt-2 text-sm leading-6 text-rose-800">Silakan coba muat ulang halaman. Tidak ada data pribadi yang terpengaruh.</p></section>
        ) : featured ? (
          <>
            <section aria-labelledby="latest-title" className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-700">Terbaru dalam feed</p><h2 id="latest-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Informasi paling baru</h2></div><p className="hidden text-sm text-slate-500 sm:block">{newsItems.length} informasi ditemukan</p></div>
              <article className="mt-5 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.82fr_1.18fr]"><NewsVisual item={featured} featured /><div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10"><div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500"><span>{formatDate(featured.published_at)}</span><span aria-hidden="true">•</span><span>{regionLabels[featured.region] ?? featured.region}</span></div><h3 className="mt-4 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">{featured.title}</h3>{featured.summary && <p className="mt-4 text-base leading-7 text-slate-600">{featured.summary}</p>}<div className="mt-6 flex flex-wrap items-center gap-3"><VerificationBadge status="verified" isDemo={false} /><span className="text-sm font-semibold text-slate-700">{featured.source_name}</span>{featured.source_url && <Link href={featured.source_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-500 hover:text-brand-700">Lihat sumber</Link>}</div><Link href={featured.official_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white hover:bg-brand-800">Baca di situs penerbit <Icon name="external" /></Link></div></article>
            </section>
            {feedItems.length > 0 && <section aria-labelledby="feed-title" className="mt-12"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Dari berbagai sumber</p><h2 id="feed-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Newsfeed DUTA</h2></div></div><div className="mt-5 mx-auto grid max-w-5xl gap-5">{feedItems.map((item) => <NewsCard key={item.id} item={item} />)}</div></section>}
          </>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Icon name="news" /></span><h2 className="mt-4 text-xl font-bold text-slate-950">{filtersActive ? "Tidak ada informasi yang sesuai" : "Belum ada informasi yang dipublikasikan"}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{filtersActive ? "Coba hapus satu atau beberapa filter untuk melihat informasi lainnya." : "Informasi akan muncul setelah sumber dan isinya melewati pemeriksaan publikasi DUTA."}</p>{filtersActive && <Link href="/news" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800">Tampilkan semua informasi</Link>}</section>
        )}
      </Container>
    </main>
  );
}

function FeedMode({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-bold ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}>{children}</Link>;
}
