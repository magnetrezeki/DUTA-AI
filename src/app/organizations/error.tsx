"use client";
import { ModuleError } from "@/components/ui/module-error";
export default function Error({ reset }: { error: Error; reset: () => void }) { return <ModuleError title="Organisasi belum dapat dimuat" description="Coba lagi untuk melihat direktori komunitas." reset={reset} />; }
