"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function AuthError({ reset }: { reset: () => void }) {
  return <ModuleError title="Halaman akun belum dapat dibuka" description="Tidak ada informasi akun yang diubah. Silakan coba lagi." reset={reset} />;
}
