import { Container } from "@/components/ui/container";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { submitPlace } from "../actions";

export default async function AddPlacePage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireOnboardedUser();
  const status = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase.from("place_categories").select("id,name,parent_id").eq("is_active", true).order("sort_order");
  return <main className="flex-1 py-12"><Container><div className="mx-auto max-w-2xl"><h1 className="text-3xl font-bold">Tambahkan tempat yang belum ada</h1><p className="mt-3 text-slate-600">Kiriman Anda adalah data komunitas, berstatus belum terverifikasi, diperiksa untuk kemungkinan duplikat, dan tidak tampil publik sebelum disetujui moderator.</p>
    {status.success && <p className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">Kiriman diterima dan menunggu moderasi.</p>}{status.error && <p className="mt-5 rounded-lg bg-red-50 p-4 text-red-900">Kiriman belum berhasil. Periksa semua kolom.</p>}
    <form action={submitPlace} className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Field name="name" label="Nama tempat" required /><div><label htmlFor="categoryId" className="text-sm font-semibold">Kategori</label><select id="categoryId" name="categoryId" required className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Pilih kategori</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? `— ${c.name}` : c.name}</option>)}</select></div>
      <Field name="description" label="Deskripsi singkat" /><Field name="address" label="Alamat tempat" required /><div className="grid gap-4 sm:grid-cols-2"><Field name="city" label="Kota" required /><Field name="state" label="Negeri/wilayah" required /></div>
      <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">Koordinat berikut adalah lokasi tempat usaha/organisasi, bukan lokasi pribadi Anda.</p><div className="grid gap-4 sm:grid-cols-2"><Field name="latitude" label="Latitude tempat" type="number" step="any" required /><Field name="longitude" label="Longitude tempat" type="number" step="any" required /></div><Field name="phone" label="Telepon (opsional)" /><Field name="website" label="Website HTTPS (opsional)" type="url" />
      <button className="min-h-11 w-full rounded-lg bg-brand-700 px-5 font-semibold text-white">Kirim untuk moderasi</button>
    </form></div></Container></main>;
}

function Field({ name, label, type = "text", step, required = false }: { name: string; label: string; type?: string; step?: string; required?: boolean }) { return <div><label htmlFor={name} className="text-sm font-semibold">{label}</label>{name === "description" ? <textarea id={name} name={name} rows={4} className="mt-2 w-full rounded-lg border border-slate-300 p-3" /> : <input id={name} name={name} type={type} step={step} required={required} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" />}</div>; }
