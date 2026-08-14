"use client";
import { ModuleError } from "@/components/ui/module-error";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <ModuleError title="Organization workspace belum dapat dimuat" description="Coba lagi. Data organisasi dan anggota tidak berubah." reset={reset} />; }
