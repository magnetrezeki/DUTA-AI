/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import { NavigationIcon } from "@/components/layout/navigation-icon";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { moduleNavigation } from "@/config/navigation";


const trustLayers = [
  { tone: "verified" as const, title: "Resmi / terverifikasi", text: "Bersumber dari lembaga dan bukti yang dapat ditelusuri." },
  { tone: "curated" as const, title: "Terkurasi", text: "Ditinjau melalui aturan publikasi DUTA sebelum ditampilkan." },
  { tone: "community" as const, title: "Komunitas", text: "Kontribusi pengguna diberi label dan melalui moderasi." },
  { tone: "ai" as const, title: "Sintesis AI", text: "Ringkasan bantuan, bukan pernyataan resmi pemerintah." },
];

export default function HomePage() {
  return <main className="flex-1 bg-white">
    <section className="relative overflow-hidden border-b border-slate-200">
      <div aria-hidden="true" className="absolute -right-24 -top-32 size-96 rounded-full bg-red-50 blur-3xl" />
      <Container className="relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:py-24">
        <div className="max-w-3xl"><Badge tone="verified">Malaysia · Fase awal</Badge><h1 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">Pendamping digital untuk warga Indonesia di luar negeri.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Temukan layanan resmi, informasi terkurasi, peluang karier, dan jejaring komunitas—dengan sumber serta batas kepercayaan yang jelas.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/ai">Tanya DUTA AI <span aria-hidden="true">→</span></ButtonLink><ButtonLink href="/connect" variant="secondary">Cari layanan resmi</ButtonLink></div><p className="mt-5 text-sm leading-6 text-slate-500">Belum punya akun? <Link href="/register" className="font-bold text-primary hover:underline">Daftar gratis</Link> untuk mengakses ruang pribadi Anda.</p></div>
        <div className="relative mx-auto w-full max-w-xl"><div className="rounded-[1.5rem] border border-slate-800 bg-slate-950 p-5 shadow-[var(--shadow-raised)] sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-red-300">Satu pintu</p><p className="mt-1 font-bold text-white">Mulai dari kebutuhan Anda</p></div><span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-white/10 text-xl text-red-200">✦</span></div><div className="mt-6 space-y-3">{moduleNavigation.slice(0, 3).map((item, index) => <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-white transition hover:border-red-300/40 hover:bg-white/10"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-red-200"><NavigationIcon name={item.icon} /></span><span className="min-w-0 flex-1"><span className="block font-bold">{item.label}</span><span className="mt-0.5 block text-sm text-slate-400">{item.description}</span></span><span aria-hidden="true" className="text-slate-500 group-hover:text-white">→</span></Link>)}</div><div className="mt-5 border-t border-white/10 pt-5"><p className="text-sm leading-6 text-slate-300"><strong className="text-white">Prinsip DUTA:</strong> informasi yang belum terverifikasi tidak disamarkan sebagai fakta resmi.</p></div></div></div>
      </Container>
    </section>

    <section className="bg-slate-50 py-14 sm:py-18"><Container><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Layanan yang terhubung</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Kebutuhan penting, lebih mudah ditemukan</h2><p className="mt-3 leading-7 text-slate-600">Setiap modul memiliki fungsi yang jelas dan tetap mempertahankan batas data serta otorisasinya.</p></div><div className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">{moduleNavigation.map((item) => <Link key={item.href} href={item.href} className="group flex min-h-36 flex-col justify-between bg-white p-5 hover:bg-slate-50 sm:p-6"><span className="grid size-10 place-items-center rounded-xl bg-red-50 text-brand-700"><NavigationIcon name={item.icon} /></span><span className="mt-5"><span className="font-bold text-slate-950 group-hover:text-brand-700">{item.label}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{serviceDescription(item.href)}</span></span></Link>)}</div></Container></section>

    <section className="border-y border-slate-200 bg-white py-14 sm:py-18"><Container className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Kepercayaan yang terlihat</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Ketahui jenis informasi yang Anda baca</h2><p className="mt-4 leading-7 text-slate-600">DUTA tidak menganggap semua konten sama. Label membantu Anda membedakan sumber resmi, hasil kurasi, kontribusi komunitas, dan bantuan AI.</p></div><div className="grid gap-4 sm:grid-cols-2">{trustLayers.map((item) => <div key={item.title} className="rounded-xl border border-slate-200 p-5"><Badge tone={item.tone}>{item.title}</Badge><p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p></div>)}</div></Container></section>

    <section className="bg-slate-950 py-14 text-white sm:py-18"><Container className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div className="max-w-2xl"><Badge tone="ai">DUTA AI</Badge><h2 className="mt-4 text-3xl font-bold tracking-tight">Tidak tahu harus mulai dari mana?</h2><p className="mt-3 leading-7 text-slate-300">Ceritakan kebutuhan Anda. DUTA AI membantu menemukan jalur informasi yang tersedia tanpa mengubah data atau melewati izin akun.</p></div><ButtonLink href="/ai" variant="brand">Mulai bertanya</ButtonLink></Container></section>

    <section className="bg-white py-14 sm:py-18"><Container><div className="rounded-[var(--radius-xl)] border border-slate-200 bg-slate-50 px-5 py-8 text-center sm:px-10 sm:py-12"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Ruang pribadi DUTA</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Simpan aktivitas penting dalam satu akun</h2><p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">Masuk untuk mengakses dashboard pribadi, aktivitas karier, dan pengelolaan organisasi sesuai izin Anda.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href="/register">Buat akun</ButtonLink><ButtonLink href="/login" variant="secondary">Masuk</ButtonLink></div></div></Container></section>
  </main>;
}

function serviceDescription(href: string) {
  const descriptions: Record<string, string> = {
    "/ai": "Tanyakan kebutuhan dan telusuri sumber yang digunakan dalam jawaban.",
    "/connect": "Temukan kantor, yurisdiksi, layanan, dan kontak resmi sesuai wilayah.",
    "/news": "Baca informasi terkurasi dari sumber yang dapat ditelusuri.",
    "/career": "Jelajahi peluang kerja dan kelola kesiapan serta aktivitas karier.",
    "/map": "Temukan direktori tempat komunitas dengan status moderasi yang jelas.",
    "/organizations": "Kenali organisasi dan jejaring diaspora yang tersedia.",
  };
  return descriptions[href] ?? "Jelajahi layanan DUTA.";
}
