"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function Error({ reset }: { reset: () => void }) {
  return <ModuleError title="Smart Gateway belum dapat dimuat" description="Silakan coba lagi. DUTA tidak akan menebak kantor ketika pemetaan tidak tersedia." reset={reset} />;
}

