"use client";
import { ModuleError } from "@/components/ui/module-error";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <ModuleError title="DUTA Karier belum dapat dimuat" description="Coba lagi. Data pribadi dan lamaran Anda tidak berubah." reset={reset} />; }
