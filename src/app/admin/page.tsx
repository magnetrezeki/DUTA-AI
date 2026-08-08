import Link from "next/link";
import { Container } from "@/components/ui/container";

export default async function AdminPage() {
  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Area terbatas</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Administrasi DUTA AI</h1>
          <p className="mt-4 leading-7 text-slate-600">Akses server telah memverifikasi bahwa akun Anda memiliki peran administrasi platform.</p>
          <div className="mt-6 flex flex-wrap gap-4"><Link href="/admin/connect" className="rounded-lg bg-brand-700 px-4 py-3 font-semibold text-white">Kelola DUTA Connect</Link><Link href="/admin/news" className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700">Kelola DUTA News</Link><Link href="/admin/map" className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700">Moderasi DUTA Map</Link><Link href="/admin/organizations" className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700">Verifikasi organisasi</Link><Link href="/admin/career" className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700">Kelola DUTA KARIER</Link><Link href="/dashboard" className="px-4 py-3 font-semibold text-brand-700 hover:underline">Kembali ke dashboard</Link></div>
        </div>
      </Container>
    </main>
  );
}
