import { Container } from "@/components/ui/container";

export default function NewsLoading() {
  return <main className="flex-1 bg-slate-50 pb-20" aria-busy="true" aria-label="Memuat DUTA News">
    <div className="h-72 animate-pulse border-b border-slate-200 bg-white" />
    <Container><div className="mt-8 h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" /><div className="mt-8 h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" /></Container>
  </main>;
}
