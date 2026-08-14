"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function AdminError({ reset }: { reset: () => void }) {
  return <ModuleError title="Konsol belum dapat dimuat" description="Tidak ada tindakan administrasi yang dijalankan. Silakan coba lagi." reset={reset} />;
}
