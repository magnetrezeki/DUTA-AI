import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  const links = <>
    <Link href="/connect" className="text-slate-600 hover:text-brand-700">Connect</Link>
    <Link href="/news" className="text-slate-600 hover:text-brand-700">News</Link>
    <Link href="/map" className="text-slate-600 hover:text-brand-700">Map</Link>
    <Link href="/organizations" className="text-slate-600 hover:text-brand-700">Komunitas</Link>
    <Link href="/career" className="text-slate-600 hover:text-brand-700">Karier</Link>
    <Link href="/ai" className="text-slate-600 hover:text-brand-700">Asisten AI</Link>
    <Link href="/login" className="text-slate-600 hover:text-brand-700">Masuk</Link>
    <Link href="/dashboard" className="text-brand-700 hover:text-brand-800">Dashboard</Link>
  </>;
  return (
    <header className="relative border-b border-slate-200 bg-white">
      <Container className="flex h-16 items-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-700">
          DUTA AI
        </Link>
        <nav aria-label="Navigasi utama" className="ml-auto hidden items-center gap-4 text-sm font-semibold lg:flex">{links}</nav>
        <details className="group ml-auto lg:hidden">
          <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 marker:content-none">Menu</summary>
          <nav aria-label="Navigasi seluler" className="absolute inset-x-0 top-16 z-50 grid gap-3 border-b border-slate-200 bg-white px-6 py-5 text-sm font-semibold shadow-lg">{links}</nav>
        </details>
      </Container>
    </header>
  );
}
