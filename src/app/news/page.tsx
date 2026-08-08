import Link from "next/link";
import { Container } from "@/components/ui/container";
import { VerificationBadge } from "@/components/data/verification-badge";
import { createClient } from "@/lib/supabase/server";
import type { NewsItem } from "@/lib/day2/types";

export const metadata = { title: "DUTA News", description: "Berita dan pengumuman dengan tautan ke sumber resminya." };

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_items")
    .select("id, title, official_url, summary, published_at, verification_status, last_verified_at, is_demo, source:official_sources(id, name, source_url, verification_status, last_verified_at, is_demo)")
    .eq("publication_status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  const newsItems = (data ?? []) as unknown as NewsItem[];

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">DUTA News</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Tautan berita dari sumber resmi</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">Tahap pertama menggunakan entri URL resmi secara manual. Integrasi feed/API disiapkan tetapi tetap dinonaktifkan sampai ada otorisasi.</p>
        </div>
        <div className="mt-8 grid gap-5">
          {newsItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <VerificationBadge status={item.verification_status} isDemo={item.is_demo} />
              <h2 className="mt-4 text-xl font-bold text-slate-950">{item.title}</h2>
              {item.summary && <p className="mt-3 leading-7 text-slate-600">{item.summary}</p>}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href={item.official_url} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">Buka URL resmi</Link>
                {item.source && <Link href={item.source.source_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-600 hover:underline">Sumber: {item.source.name}</Link>}
              </div>
            </article>
          ))}
          {newsItems.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Belum ada berita yang dipublikasikan.</p>}
        </div>
      </Container>
    </main>
  );
}
