import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return <main className="flex flex-1 items-center bg-slate-50 py-20"><Container><section className="mx-auto max-w-xl rounded-[var(--radius-lg)] border border-slate-200 bg-white p-8 text-center shadow-[var(--shadow-low)]"><span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-600">404</span><p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Tidak ditemukan</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Halaman ini tidak tersedia</h1><p className="mt-3 leading-7 text-slate-600">Alamat mungkin telah berubah, atau Anda tidak memiliki tautan yang tepat.</p><ButtonLink href="/" className="mt-6">Kembali ke beranda</ButtonLink></section></Container></main>;
}
