import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return <main className="flex flex-1 items-center py-20"><Container><div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="text-sm font-semibold text-brand-700">404</p><h1 className="mt-2 text-3xl font-bold">Halaman tidak ditemukan</h1><p className="mt-3 text-slate-600">Alamat mungkin sudah berubah atau tidak tersedia.</p><Link href="/" className="mt-6 inline-flex rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white">Kembali ke beranda</Link></div></Container></main>;
}
