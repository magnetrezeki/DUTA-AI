import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Field, FormNotice, SubmitButton } from "@/components/auth/form-elements";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

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
    <main className="flex flex-1 items-center py-12">
      <Container>
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Langkah awal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Lengkapi profil Anda</h1>
          <p className="mt-2 leading-7 text-slate-600">DUTA AI dimulai di Malaysia. Informasi ini bersifat pribadi dan dilindungi oleh kebijakan akses database.</p>
          <div className="mt-8 space-y-5">
            {params.error && errorMessages[params.error] && (
              <FormNotice tone="error">{errorMessages[params.error]}</FormNotice>
            )}
            <form action={completeOnboarding} className="space-y-5">
              <Field id="displayName" name="displayName" label="Nama lengkap" defaultValue={profile.display_name} minLength={2} maxLength={100} required />
              <div>
                <label htmlFor="currentCountry" className="block text-sm font-semibold text-slate-800">Negara saat ini</label>
                <select id="currentCountry" name="currentCountry" defaultValue={profile.current_country_code} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm" required>
                  {countries?.map((country) => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
              </div>
              <SubmitButton>Simpan dan lanjutkan</SubmitButton>
            </form>
          </div>
        </div>
      </Container>
    </main>
  );
}
