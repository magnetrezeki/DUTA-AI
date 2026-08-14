"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";

export type ModuleSubnavItem = { href: string; label: string };

export function ModuleSubnav({ label, items, action }: { label: string; items: readonly ModuleSubnavItem[]; action?: ModuleSubnavItem }) {
  const pathname = usePathname();
  return (
    <div className="border-b border-slate-200 bg-white">
      <Container className="flex min-h-14 items-center gap-4">
        <p className="hidden shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 sm:block">{label}</p>
        <nav aria-label={`Navigasi ${label}`} className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-2">
          {items.map((item) => {
            const ownsNestedRoute =
              (item.href === "/career" && pathname.startsWith("/career/jobs/")) ||
              (item.href === "/organizations" && pathname.startsWith("/organizations/")) ||
              (item.href === "/map" && pathname.startsWith("/map/") && pathname !== "/map/add");
            const active =
              pathname === item.href ||
              ownsNestedRoute ||
              (!["/career", "/organizations", "/map"].includes(item.href) && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-bold ${active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {action && (
          <Link href={action.href} className="hidden min-h-10 shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover md:inline-flex">
            {action.label}
          </Link>
        )}
      </Container>
    </div>
  );
}
