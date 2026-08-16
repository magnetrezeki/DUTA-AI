import Link from "next/link";
import { Container } from "@/components/ui/container";
import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { BrandMark } from "@/components/layout/brand-mark";

export function SiteHeader() {
  return <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
    <Container className="flex h-[4.5rem] items-center">
      <Link href="/" aria-label="DUTA AI — Beranda" className="inline-flex min-h-11 items-center rounded-lg"><BrandMark /></Link>
      <div className="ml-auto hidden items-center lg:flex"><DesktopNavigation /></div>
      <MobileNavigation />
    </Container>
  </header>;
}
