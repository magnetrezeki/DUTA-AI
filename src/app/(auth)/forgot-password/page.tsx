import Link from "next/link";
import { requestPasswordReset } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, FormNotice, SubmitButton } from "@/components/auth/form-elements";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell title="Atur ulang kata sandi" description="Kami akan mengirimkan tautan pemulihan ke email Anda.">
      <div className="space-y-5">
        {params.error && <FormNotice tone="error">Permintaan belum berhasil. Periksa email Anda dan coba lagi.</FormNotice>}
        {params.success && <FormNotice tone="success">Jika akun tersedia, petunjuk pemulihan telah dikirim ke email tersebut.</FormNotice>}
        <form action={requestPasswordReset} className="space-y-5">
          <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
          <SubmitButton>Kirim tautan pemulihan</SubmitButton>
        </form>
        <Link href="/login" className="text-sm font-semibold text-brand-700 hover:underline">Kembali ke halaman masuk</Link>
      </div>
    </AuthShell>
  );
}
