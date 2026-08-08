import Link from "next/link";
import { register } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, FormNotice } from "@/components/auth/form-elements";
import { RegistrationSubmitButton } from "@/components/auth/registration-submit-button";

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid_name: "Nama harus terdiri dari 2 sampai 100 karakter.",
  invalid_email: "Masukkan alamat email yang valid.",
  weak_password: "Kata sandi minimal 8 karakter dan harus berisi huruf serta angka.",
  rate_limited: "Terlalu banyak percobaan pendaftaran. Tunggu sebentar lalu coba lagi.",
  existing_account: "Jika akun dengan email ini sudah ada, gunakan halaman Masuk atau Lupa kata sandi.",
  network_failure: "Tidak dapat menghubungi layanan pendaftaran. Silakan coba lagi.",
  invalid_redirect: "Konfigurasi alamat pendaftaran belum benar. Silakan hubungi pengelola DUTA AI.",
  unexpected_auth: "Pendaftaran belum berhasil. Silakan coba lagi atau gunakan halaman Masuk.",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <AuthShell title="Buat akun baru" description="Gunakan halaman ini hanya jika Anda belum memiliki akun DUTA AI.">
      <div className="space-y-5">
        {params.error && errorMessages[params.error] && (
          <FormNotice tone="error">{errorMessages[params.error]}</FormNotice>
        )}
        <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          User A dan User B yang sudah dibuat harus masuk melalui halaman Masuk,
          bukan mendaftar kembali.
        </p>
        <form action={register} className="space-y-5">
          <Field id="displayName" name="displayName" label="Nama lengkap" autoComplete="name" minLength={2} maxLength={100} required />
          <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
          <Field id="password" name="password" type="password" label="Kata sandi" autoComplete="new-password" minLength={8} required />
          <p className="text-xs leading-5 text-slate-500">Minimal 8 karakter, dengan sedikitnya satu huruf dan satu angka.</p>
          <RegistrationSubmitButton />
        </form>
        <p className="text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">Masuk</Link>
        </p>
      </div>
    </AuthShell>
  );
}
