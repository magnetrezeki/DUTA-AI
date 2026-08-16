"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountNavigation, moduleNavigation } from "@/config/navigation";

function isCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function DesktopNavigation() {
  const pathname = usePathname();
  return <div className="flex items-center gap-3">
    <nav aria-label="Modul utama" className="flex items-center gap-1">
      {moduleNavigation.map((item) => {
        const active = isCurrent(pathname, item.href);
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-slate-100 text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>{item.label}{active && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand-700" />}</Link>;
      })}
    </nav>
    <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
    <nav aria-label="Akun" className="flex items-center gap-1">
      {accountNavigation.map((item) => {
        const active = isCurrent(pathname, item.href);
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={item.emphasized ? "rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover" : `rounded-lg px-3 py-2 text-sm font-semibold ${active ? "text-brand-700" : "text-slate-600 hover:text-slate-950"}`}>{item.label}</Link>;
      })}
    </nav>
  </div>;
}
