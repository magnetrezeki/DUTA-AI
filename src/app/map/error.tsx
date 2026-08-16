"use client";
import { ModuleError } from "@/components/ui/module-error";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <ModuleError title="DUTA Map belum dapat dimuat" description="Coba lagi. Pencarian berdasarkan wilayah tetap tersedia tanpa izin GPS." reset={reset} />; }
