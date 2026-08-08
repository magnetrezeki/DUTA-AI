import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, FormNotice, SubmitButton } from "@/components/auth/form-elements";
import { login } from "@/app/(auth)/actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid_credentials: "Email atau kata sandi tidak benar.",
  reset_session_expired: "Tautan pengaturan ulang telah kedaluwarsa. Silakan minta tautan baru.",
};

const successMessages: Record<string, string> = {
  check_email: "Periksa email Anda untuk mengonfirmasi akun sebelum masuk.",
  password_updated: "Kata sandi berhasil diperbarui. Silakan masuk.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell title="Masuk" description="Akses akun DUTA AI Anda dengan aman.">
      <div className="space-y-5">
        {params.error && errorMessages[params.error] && (
          <FormNotice tone="error">{errorMessages[params.error]}</FormNotice>
        )}
        {params.success && successMessages[params.success] && (
          <FormNotice tone="success">{successMessages[params.success]}</FormNotice>
        )}
        <form action={login} className="space-y-5">
          <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
          <Field id="password" name="password" type="password" label="Kata sandi" autoComplete="current-password" required />
          <SubmitButton>Masuk</SubmitButton>
        </form>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/forgot-password" className="font-semibold text-brand-700 hover:underline">
            Lupa kata sandi?
          </Link>
          <p className="text-slate-600">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-brand-700 hover:underline">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
