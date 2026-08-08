import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { registerEmployer } from "../actions";

export default async function EmployerRegistrationPage() {
  const { user } = await requireOnboardedUser();
  const supabase = await createClient();
  const [{ data: submissions }, { data: memberships }] = await Promise.all([
    supabase.from("employers").select("id,name,status,created_at").in("status", ["pending", "rejected", "suspended"]).order("created_at", { ascending: false }),
    supabase.from("employer_members").select("employer_id,employers!inner(id,name,status)").eq("user_id", user.id),
  ]);
  const data = [...(submissions ?? []), ...(memberships ?? []).map((membership) => membership.employers as unknown as { id: string; name: string; status: string; created_at?: string })];
  return <main className="flex-1 py-12"><Container><div className="max-w-3xl"><p className="text-sm font-semibold uppercase text-brand-700">DUTA KARIER</p><h1 className="mt-3 text-4xl font-bold">Daftarkan pemberi kerja</h1><p className="mt-4 text-slate-600">Pendaftaran tidak langsung terverifikasi. Tim DUTA harus memeriksa sumber resmi sebelum dashboard perekrutan aktif.</p>{data?.map((employer) => <div key={employer.id} className="mt-5 rounded-xl border bg-white p-4"><strong>{employer.name}</strong><p className="text-sm text-slate-600">Status: {employer.status}</p>{employer.status === "verified" && <Link href="/employer/dashboard" className="mt-2 inline-block font-semibold text-brand-700">Buka dashboard</Link>}</div>)}<form action={registerEmployer} className="mt-8 grid gap-4 rounded-2xl border bg-white p-6"><Input name="name" label="Nama pemberi kerja"/><Input name="registrationNumber" label="Nomor registrasi (opsional)" required={false}/><Input name="contactEmail" label="Email kontak" type="email"/><Input name="website" label="Website HTTPS (opsional)" type="url" required={false}/><label className="text-sm font-semibold">Deskripsi<textarea name="description" required minLength={20} rows={5} className="mt-2 w-full rounded-lg border p-3"/></label><button className="min-h-11 rounded-lg bg-brand-700 font-semibold text-white">Kirim untuk verifikasi</button></form></div></Container></main>;
}
function Input({ name, label, type = "text", required = true }: { name: string; label: string; type?: string; required?: boolean }) { return <label className="text-sm font-semibold">{label}<input name={name} type={type} required={required} className="mt-2 min-h-11 w-full rounded-lg border px-3"/></label>; }
