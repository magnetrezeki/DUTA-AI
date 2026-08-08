import { updatePassword } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field, FormNotice, SubmitButton } from "@/components/auth/form-elements";

type UpdatePasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  weak_password: "Kata sandi minimal 8 karakter dan harus berisi huruf serta angka.",
  password_mismatch: "Konfirmasi kata sandi tidak sama.",
  reset_failed: "Kata sandi belum dapat diperbarui. Silakan minta tautan baru.",
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
