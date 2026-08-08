import Link from "next/link";
import { Container } from "@/components/ui/container";
import { NearbyPlaces } from "@/components/map/nearby-places";
import { createClient } from "@/lib/supabase/server";
import { trustLabels, type CommunityPlace, type MapCategory } from "@/lib/day3/types";

export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; area?: string }> }) {
  const { q = "", category = "", area = "" } = await searchParams;
  const supabase = await createClient();
  const categoriesResult = await supabase.from("place_categories").select("id,parent_id,slug,name").eq("is_active", true).order("sort_order");
  let query = supabase.from("community_places").select("id,name,description,address_text,city,state_region,latitude,longitude,phone,website_url,trust_label,category:place_categories(id,name,slug)").eq("country_code", "MY").eq("moderation_status", "approved").order("name");
  if (q.trim()) query = query.ilike("name", `%${q.trim().replaceAll("%", "")}%`);
  if (category) query = query.eq("category_id", category);
  if (area.trim()) query = query.or(`city.ilike.%${area.trim().replaceAll("%", "")}%,state_region.ilike.%${area.trim().replaceAll("%", "")}%`);
  const placesResult = await query.limit(100);
  const categories = (categoriesResult.data ?? []) as MapCategory[];
  const places = (placesResult.data ?? []) as unknown as CommunityPlace[];

  return <main className="flex-1 py-12"><Container>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">DUTA Map</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Direktori tepercaya yang dibangun komunitas</h1><p className="mt-4 text-lg leading-8 text-slate-600">Semua tempat adalah data komunitas. Kiriman baru tidak otomatis diverifikasi dan harus melalui moderasi sebelum tampil.</p></div>
      <Link href="/map/add" className="rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">Tambah tempat</Link>
    </div>
    <form className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4">
      <div><label htmlFor="q" className="text-sm font-semibold">Nama tempat</label><input id="q" name="q" defaultValue={q} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" placeholder="Cari nama" /></div>
      <div><label htmlFor="area" className="text-sm font-semibold">Kota/negeri</label><input id="area" name="area" defaultValue={area} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" placeholder="Contoh: Selangor" /></div>
      <div><label htmlFor="category" className="text-sm font-semibold">Kategori</label><select id="category" name="category" defaultValue={category} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Semua kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.parent_id ? `— ${item.name}` : item.name}</option>)}</select></div>
      <button className="min-h-11 self-end rounded-lg bg-slate-900 px-5 font-semibold text-white">Cari</button>
    </form>
    <NearbyPlaces places={places} />
    <section className="mt-8"><h2 className="text-2xl font-bold text-slate-950">Hasil ({places.length})</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{places.map((place) => <article key={place.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{trustLabels[place.trust_label]}</span><h3 className="mt-4 text-xl font-bold"><Link href={`/map/${place.id}`} className="hover:text-brand-700">{place.name}</Link></h3><p className="mt-2 text-sm font-semibold text-brand-700">{place.category?.name}</p><p className="mt-2 text-slate-600">{place.address_text}, {place.city}, {place.state_region}</p></article>)}{places.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Belum ada tempat yang disetujui untuk pencarian ini.</p>}</div></section>
  </Container></main>;
}
