import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <Container className="flex h-16 items-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-700">
          DUTA AI
        </Link>
        <nav aria-label="Navigasi utama" className="ml-auto flex items-center gap-4 text-sm font-semibold">
          <Link href="/connect" className="text-slate-600 hover:text-brand-700">Connect</Link>
          <Link href="/news" className="text-slate-600 hover:text-brand-700">News</Link>
          <Link href="/map" className="text-slate-600 hover:text-brand-700">Map</Link>
          <Link href="/organizations" className="text-slate-600 hover:text-brand-700">Komunitas</Link>
          <Link href="/career" className="text-slate-600 hover:text-brand-700">Karier</Link>
          <Link href="/ai" className="text-slate-600 hover:text-brand-700">Asisten AI</Link>
          <Link href="/login" className="text-slate-600 hover:text-brand-700">Masuk</Link>
          <Link href="/dashboard" className="text-brand-700 hover:text-brand-800">Dashboard</Link>
        </nav>
      </Container>
    </header>
  );
}
