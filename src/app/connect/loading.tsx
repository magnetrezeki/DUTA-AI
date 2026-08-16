import { Container } from "@/components/ui/container";

export default function ConnectLoading() {
  return <main className="flex-1 bg-slate-50 pb-20" aria-busy="true" aria-label="Memuat DUTA Connect">
    <div className="h-72 animate-pulse bg-emerald-950" />
    <Container><div className="-mt-7 h-56 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" /><div className="mt-10 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div></Container>
  </main>;
}
