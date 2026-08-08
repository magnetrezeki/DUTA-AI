import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { moderatePlace, moderateQueueItem } from "./actions";

export default async function MapAdminPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const status = await searchParams;
  const supabase = await createClient();
  const [places, corrections, reviews, reports] = await Promise.all([
    supabase.from("community_places").select("id,name,city,state_region,potential_duplicate_id,created_at").eq("moderation_status", "pending").order("created_at"),
    supabase.from("place_corrections").select("id,place_id,reason,proposed_changes,created_at").eq("moderation_status", "pending").order("created_at"),
    supabase.from("place_reviews").select("id,place_id,rating,review_text,created_at").eq("moderation_status", "pending").order("created_at"),
    supabase.from("place_reports").select("id,place_id,reason,details,created_at").eq("moderation_status", "pending").order("created_at"),
  ]);
  return <main className="flex-1 py-12"><Container><h1 className="text-3xl font-bold">Moderasi DUTA Map</h1><p className="mt-3 text-slate-600">Tinjau data komunitas. Tidak ada kiriman baru yang dipublikasikan otomatis.</p>{status.success && <p className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">Keputusan moderasi disimpan.</p>}{status.error && <p className="mt-5 rounded-lg bg-red-50 p-4 text-red-900">Keputusan belum tersimpan.</p>}
    <Queue title="Tempat baru">{places.data?.map((p) => <article key={p.id} className="rounded-xl border border-slate-200 p-5"><h3 className="font-bold">{p.name}</h3><p className="mt-1 text-sm text-slate-600">{p.city}, {p.state_region}</p>{p.potential_duplicate_id && <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-900">Kemungkinan duplikat: {p.potential_duplicate_id}</p>}<form action={moderatePlace} className="mt-4 grid gap-3 md:grid-cols-3"><input type="hidden" name="id" value={p.id} /><SelectStatus /><select name="trustLabel" className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"><option value="community_unverified">Belum dikonfirmasi</option><option value="community_confirmed">Dikonfirmasi komunitas</option><option value="trusted_contributor_confirmed">Kontributor tepercaya</option><option value="admin_reviewed">Ditinjau moderator</option></select><input name="note" placeholder="Catatan moderasi" className="min-h-11 rounded-lg border border-slate-300 px-3" /><button className="min-h-11 rounded-lg bg-slate-900 px-4 text-white md:col-span-3">Simpan keputusan</button></form></article>)}</Queue>
    <GenericQueue title="Saran koreksi" table="place_corrections" items={corrections.data ?? []} /><GenericQueue title="Ulasan" table="place_reviews" items={reviews.data ?? []} /><GenericQueue title="Laporan" table="place_reports" items={reports.data ?? []} />
  </Container></main>;
}

function Queue({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-8"><h2 className="text-2xl font-bold">{title}</h2><div className="mt-4 grid gap-4">{children}</div></section>; }
function SelectStatus() { return <select name="status" className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"><option value="approved">Setujui</option><option value="needs_changes">Perlu perubahan</option><option value="rejected">Tolak</option></select>; }
function GenericQueue({ title, table, items }: { title: string; table: string; items: Record<string, unknown>[] }) { return <Queue title={title}>{items.map((item) => <article key={String(item.id)} className="rounded-xl border border-slate-200 p-5"><pre className="overflow-auto whitespace-pre-wrap text-sm text-slate-700">{JSON.stringify(item, null, 2)}</pre><form action={moderateQueueItem} className="mt-4 flex flex-wrap gap-3"><input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={String(item.id)} /><SelectStatus /><button className="rounded-lg bg-slate-900 px-4 font-semibold text-white">Simpan</button></form></article>)}</Queue>; }
