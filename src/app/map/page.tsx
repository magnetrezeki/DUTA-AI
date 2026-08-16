import Link from "next/link";
import { NearbyPlaces } from "@/components/map/nearby-places";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { inputClass, labelClass, selectClass } from "@/components/ui/form-control";
import { createClient } from "@/lib/supabase/server";
import { trustLabels, type CommunityPlace, type MapCategory } from "@/lib/day3/types";

export const metadata = { title: "DUTA Map", description: "Direktori tempat komunitas Indonesia di Malaysia dengan label kepercayaan yang jelas." };
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
  const hasError = Boolean(categoriesResult.error || placesResult.error);
  const filtersActive = Boolean(q || category || area);

  return <main className="flex-1 pb-20">
    <section className="border-b border-slate-200 bg-white"><Container className="grid gap-7 py-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-3xl"><Badge tone="community">Direktori komunitas · Malaysia</Badge><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Temukan tempat berguna dengan status yang jelas.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Cari berdasarkan nama, wilayah, atau kategori. Tempat berasal dari komunitas dan hanya tampil setelah moderasi.</p></div><ButtonLink href="/map/add">Tambah tempat</ButtonLink></Container></section>
    <Container>
      <section aria-labelledby="map-search" className="rounded-b-2xl border border-t-0 border-slate-200 bg-white p-5 shadow-[var(--shadow-low)] sm:p-7"><h2 id="map-search" className="text-xl font-bold text-slate-950">Cari direktori</h2><form className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"><div><label htmlFor="q" className={labelClass}>Nama tempat</label><input id="q" name="q" defaultValue={q} className={inputClass} placeholder="Cari nama" /></div><div><label htmlFor="area" className={labelClass}>Kota atau negeri</label><input id="area" name="area" defaultValue={area} className={inputClass} placeholder="Contoh: Selangor" /></div><div><label htmlFor="category" className={labelClass}>Kategori</label><select id="category" name="category" defaultValue={category} className={selectClass}><option value="">Semua kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.parent_id ? `— ${item.name}` : item.name}</option>)}</select></div><button className="min-h-11 rounded-xl bg-slate-950 px-6 font-bold text-white hover:bg-slate-800">Cari tempat</button></form>{filtersActive && <Link href="/map" className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-primary hover:underline">Hapus filter</Link>}</section>

      {!hasError && <NearbyPlaces places={places} />}
      {hasError ? <section role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-bold text-red-950">Direktori belum dapat dimuat</h2><p className="mt-2 text-sm text-red-800">Silakan muat ulang. Anda tetap dapat menolak izin lokasi dan mencari kembali nanti.</p></section> : <section aria-labelledby="map-results" className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Hasil direktori</p><h2 id="map-results" className="mt-2 text-2xl font-bold text-slate-950">{filtersActive ? "Tempat yang sesuai" : "Tempat yang tersedia"}</h2></div><p className="text-sm font-semibold text-slate-500">{places.length} tempat</p></div><div className="mt-5 grid gap-5 md:grid-cols-2">{places.map((place) => <article key={place.id} className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-low)]"><div className="flex flex-wrap items-center justify-between gap-2"><Badge tone="community">{trustLabels[place.trust_label]}</Badge><span className="text-xs font-bold text-slate-500">{place.category?.name}</span></div><h3 className="mt-5 text-xl font-bold text-slate-950 group-hover:text-primary"><Link href={`/map/${place.id}`}>{place.name}</Link></h3>{place.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{place.description}</p>}<p className="mt-3 text-sm font-semibold text-slate-600">{place.city}, {place.state_region}</p><Link href={`/map/${place.id}`} className="mt-auto border-t border-slate-100 pt-5 text-sm font-bold text-primary">Lihat detail dan kontribusi →</Link></article>)}{places.length === 0 && <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><h3 className="text-xl font-bold text-slate-950">Belum ada tempat yang sesuai</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Ubah filter atau tambahkan tempat yang belum ada. Kiriman baru akan menunggu moderasi.</p><ButtonLink href="/map/add" variant="secondary" className="mt-5">Tambahkan tempat</ButtonLink></div>}</div></section>}
    </Container>
  </main>;
}
