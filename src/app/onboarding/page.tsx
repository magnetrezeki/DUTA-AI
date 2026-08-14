import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Field, FormNotice, SubmitButton } from "@/components/auth/form-elements";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { selectClass, labelClass, helpTextClass } from "@/components/ui/form-control";

type OnboardingPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid_name: "Nama harus terdiri dari 2 sampai 100 karakter.",
  invalid_country: "Pilih negara yang sedang aktif.",
  save_failed: "Profil belum dapat disimpan. Silakan coba lagi.",
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { profile } = await requireUser();
  const params = await searchParams;

  if (profile.onboarding_completed) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: countries, error } = await supabase
    .from("countries")
    .select("code, name")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error("Daftar negara aktif tidak tersedia.");
  }

  return (
    <main className="flex flex-1 items-center bg-[linear-gradient(145deg,#f8fafc_0%,#fff_50%,#f0fdfa_100%)] py-10 sm:py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Selamat datang di DUTA</p><p className="mt-1 text-sm text-slate-600">Persiapan akun · langkah terakhir</p></div>
            <Badge tone="curated">2 informasi</Badge>
          </div>
          <div className="mb-8 grid grid-cols-3 gap-2" aria-label="Kemajuan onboarding">
            <div className="h-2 rounded-full bg-primary" />
            <div className="h-2 rounded-full bg-primary" />
            <div className="h-2 rounded-full bg-slate-200" />
          </div>
          <Card className="overflow-hidden shadow-[var(--shadow-raised)]">
            <CardContent className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[0.8fr_1.2fr]">
              <section>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Profil dasar</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Sesuaikan pengalaman DUTA Anda</h1>
                <p className="mt-4 leading-7 text-slate-600">Nama membantu mengenali ruang akun Anda. Negara saat ini dipakai untuk menampilkan konteks layanan yang relevan.</p>
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  Informasi ini tidak menjadikan lokasi tepat Anda publik dan tetap dilindungi oleh aturan akses database.
                </div>
              </section>
              <div className="space-y-5">
            {params.error && errorMessages[params.error] && (
              <FormNotice tone="error">{errorMessages[params.error]}</FormNotice>
            )}
            <form action={completeOnboarding} className="space-y-5">
              <Field id="displayName" name="displayName" label="Nama lengkap" defaultValue={profile.display_name} minLength={2} maxLength={100} required />
              <div>
                <label htmlFor="currentCountry" className={labelClass}>Negara saat ini</label>
                <select id="currentCountry" name="currentCountry" defaultValue={profile.current_country_code} className={selectClass} required>
                  {countries?.map((country) => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
                <p className={helpTextClass}>Hanya negara yang saat ini didukung DUTA yang tersedia.</p>
              </div>
              <SubmitButton>Simpan dan lanjutkan</SubmitButton>
            </form>
              </div>
            </CardContent>
          </Card>
          </div>
      </Container>
    </main>
  );
}
