import Link from "next/link";
import { Container } from "@/components/ui/container";
import { BrandMark } from "@/components/layout/brand-mark";

export function SiteFooter() {
  return <footer className="border-t border-slate-200 bg-white">
    <Container className="grid gap-8 py-8 sm:grid-cols-[1fr_auto] sm:items-end">
      <div><BrandMark /><p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Informasi dan layanan digital untuk masyarakat Indonesia di luar negeri, dimulai dari Malaysia.</p></div>
      <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-600"><Link href="/connect" className="hover:text-brand-700">Connect</Link><Link href="/news" className="hover:text-brand-700">News</Link><Link href="/ai" className="hover:text-brand-700">DUTA AI</Link></div>
      <p className="border-t border-slate-100 pt-5 text-xs text-slate-500 sm:col-span-2">© {new Date().getFullYear()} DUTA AI · Dibangun untuk masyarakat Indonesia di luar negeri.</p>
    </Container>
  </footer>;
}
