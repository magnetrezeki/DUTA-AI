import Link from "next/link";
import { Container } from "@/components/ui/container";
import { VerificationBadge } from "@/components/data/verification-badge";
import { createClient } from "@/lib/supabase/server";

type PublicNewsItem = {
  id: string;
  title: string;
  summary: string | null;
  official_url: string;
  original_publisher_url: string | null;
  published_at: string;
  source_name: string;
  source_url: string | null;
  last_verified_at: string;
};

export const metadata = { title: "DUTA News", description: "Berita dan pengumuman dengan tautan ke sumber resminya." };

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_public_items")
    .select("id,title,summary,official_url,original_publisher_url,published_at,source_name,source_url,last_verified_at")
    .order("published_at", { ascending: false, nullsFirst: false });
  const newsItems = (data ?? []) as PublicNewsItem[];

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
              <VerificationBadge status="verified" isDemo={false} />
              <h2 className="mt-4 text-xl font-bold text-slate-950">{item.title}</h2>
              {item.summary && <p className="mt-3 leading-7 text-slate-600">{item.summary}</p>}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href={item.official_url} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">Buka URL resmi</Link>
                {item.source_url && <Link href={item.source_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-600 hover:underline">Sumber: {item.source_name}</Link>}
              </div>
            </article>
          ))}
          {newsItems.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Belum ada berita yang dipublikasikan.</p>}
        </div>
      </Container>
    </main>
  );
}
