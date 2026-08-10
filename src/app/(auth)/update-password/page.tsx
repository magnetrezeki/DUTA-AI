import { updatePassword } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, FormNotice, SubmitButton } from "@/components/auth/form-elements";

type UpdatePasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  weak_password: "Kata sandi minimal 8 karakter dan harus berisi huruf serta angka.",
  password_mismatch: "Konfirmasi kata sandi tidak sama.",
  password_policy: "Kata sandi belum memenuhi persyaratan keamanan. Gunakan kata sandi yang lebih kuat.",
  recovery_session: "Sesi pemulihan kata sandi tidak lagi valid. Silakan minta tautan baru.",
  rate_limit: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  network: "Layanan autentikasi tidak dapat dihubungi. Silakan coba lagi.",
  auth_rejected: "Permintaan perubahan kata sandi ditolak. Silakan minta tautan baru.",
  unknown: "Kata sandi belum dapat diperbarui. Silakan coba lagi atau minta tautan baru.",
};

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell title="Kata sandi baru" description="Masukkan kata sandi baru untuk akun DUTA AI Anda.">
      <div className="space-y-5">
        {params.error && errorMessages[params.error] && (
          <FormNotice tone="error">{errorMessages[params.error]}</FormNotice>
        )}
        <form action={updatePassword} className="space-y-5">
          <Field id="password" name="password" type="password" label="Kata sandi baru" autoComplete="new-password" minLength={8} required />
          <Field id="passwordConfirmation" name="passwordConfirmation" type="password" label="Ulangi kata sandi baru" autoComplete="new-password" minLength={8} required />
          <SubmitButton>Simpan kata sandi</SubmitButton>
        </form>
      </div>
    </AuthShell>
  );
}
