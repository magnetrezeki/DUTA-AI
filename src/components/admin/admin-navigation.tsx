"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";

const modules = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/official-sources", label: "Sumber resmi" },
  { href: "/admin/connect", label: "Connect" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/map", label: "Map" },
  { href: "/admin/organizations", label: "Organisasi" },
  { href: "/admin/career", label: "Karier" },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-800 bg-slate-950 text-white">
      <Container className="flex min-h-16 items-center gap-5">
        <div className="hidden shrink-0 sm:block">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Area terbatas</p>
          <p className="mt-1 text-sm font-bold">Konsol Operasional</p>
        </div>
        <nav aria-label="Navigasi administrasi" className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-2">
          {modules.map((module) => {
            const active = module.href === "/admin" ? pathname === module.href : pathname.startsWith(module.href);
            return (
              <Link
                key={module.href}
                href={module.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-bold ${active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
              >
                {module.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/dashboard" className="hidden min-h-11 shrink-0 items-center rounded-lg border border-slate-700 px-3 text-sm font-bold text-slate-200 hover:bg-slate-800 lg:inline-flex">
          Keluar konsol
        </Link>
      </Container>
    </div>
  );
}
