import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/feedback-state";

export function ModuleLoading({ label }: { label: string }) { return <main className="flex-1 py-10" aria-busy="true" aria-label={`Memuat ${label}`}><Container><Skeleton className="h-5 w-32" /><Skeleton className="mt-5 h-12 max-w-2xl" /><Skeleton className="mt-4 h-6 max-w-xl" /><Skeleton className="mt-8 h-40 w-full" /><div className="mt-6 grid gap-5 md:grid-cols-2"><Skeleton className="h-60" /><Skeleton className="h-60" /></div></Container></main>; }
