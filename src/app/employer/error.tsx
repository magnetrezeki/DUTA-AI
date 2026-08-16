"use client";
import { ModuleError } from "@/components/ui/module-error";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <ModuleError title="Employer workspace belum dapat dimuat" description="Coba lagi. Lowongan dan data pelamar tidak berubah." reset={reset} />; }
