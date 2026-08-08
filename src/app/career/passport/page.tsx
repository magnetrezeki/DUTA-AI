import { Container } from "@/components/ui/container";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { saveCareerPassport } from "../actions";

export default async function PassportPage() {
  const { user } = await requireOnboardedUser(); const supabase = await createClient();
  const { data: passport } = await supabase.from("career_passports").select("headline,summary,skills,experience_summary,education_summary,languages,is_public").eq("user_id", user.id).maybeSingle();
  return <main className="flex-1 py-12"><Container><div className="max-w-3xl"><p className="text-sm font-semibold uppercase text-brand-700">DUTA KARIER</p><h1 className="mt-3 text-4xl font-bold">Career Passport</h1><div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Privat secara default.</strong> Passport tidak tampil untuk publik. Pemberi kerja hanya dapat membacanya bila Anda melamar ke lowongan mereka dan memilih berbagi.</div><form action={saveCareerPassport} className="mt-8 grid gap-5 rounded-2xl border bg-white p-6"><Input name="headline" label="Judul profesional" defaultValue={passport?.headline}/><Area name="summary" label="Ringkasan" defaultValue={passport?.summary}/><Input name="skills" label="Keahlian (pisahkan dengan koma)" defaultValue={passport?.skills?.join(", ")}/><Area name="experience" label="Ringkasan pengalaman" defaultValue={passport?.experience_summary}/><Area name="education" label="Ringkasan pendidikan" defaultValue={passport?.education_summary}/><Input name="languages" label="Bahasa (pisahkan dengan koma)" defaultValue={passport?.languages?.join(", ")}/><button className="min-h-11 rounded-lg bg-brand-700 font-semibold text-white">Simpan secara privat</button></form></div></Container></main>;
}
function Input({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) { return <label className="text-sm font-semibold">{label}<input name={name} defaultValue={defaultValue} className="mt-2 min-h-11 w-full rounded-lg border px-3"/></label>; }
function Area({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) { return <label className="text-sm font-semibold">{label}<textarea name={name} defaultValue={defaultValue} rows={5} className="mt-2 w-full rounded-lg border p-3"/></label>; }
