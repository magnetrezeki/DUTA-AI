import Link from "next/link";
import { Container } from "@/components/ui/container";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { primaryNavigation } from "@/config/navigation";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <Container className="flex h-16 items-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-700">
          DUTA AI
        </Link>
        <nav aria-label="Navigasi utama" className="ml-auto hidden items-center gap-4 text-sm font-semibold lg:flex">
          {primaryNavigation.map((item) => (
            <Link key={item.href} href={item.href} className={item.emphasized ? "text-brand-700 hover:text-brand-800" : "text-slate-600 hover:text-brand-700"}>{item.label}</Link>
          ))}
        </nav>
        <MobileNavigation />
      </Container>
    </header>
  );
}
