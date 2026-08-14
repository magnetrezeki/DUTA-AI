"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { accountNavigation, moduleNavigation } from "@/config/navigation";
import { NavigationIcon } from "@/components/layout/navigation-icon";
import { BrandMark } from "@/components/layout/brand-mark";

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) { if (event.key === "Escape") closeMenu(true); }
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [open]);

  return <div className="ml-auto lg:hidden">
    <button ref={triggerRef} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-bold text-slate-800 hover:border-slate-400 hover:bg-slate-50">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5"><path d="M4 7h16M4 12h16M4 17h16" /></svg> Menu
    </button>
    {open && <div className="fixed inset-0 z-[100]" role="presentation">
      <button type="button" aria-label="Tutup menu navigasi" onClick={() => closeMenu(true)} className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]" />
      <section id={panelId} role="dialog" aria-modal="true" aria-label="Menu navigasi" className="absolute inset-y-0 right-0 flex w-[min(22rem,92vw)] flex-col bg-white shadow-2xl">
        <div className="flex h-[4.5rem] items-center justify-between border-b border-slate-200 px-5"><BrandMark /><button ref={closeRef} type="button" aria-label="Tutup menu" onClick={() => closeMenu(true)} className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="px-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Jelajahi DUTA</p>
          <nav aria-label="Modul utama" className="mt-2 grid gap-1">
            {moduleNavigation.map((item) => { const active = isCurrent(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} onClick={() => closeMenu()} className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 ${active ? "bg-red-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}><span className={`grid size-9 place-items-center rounded-lg ${active ? "bg-white" : "bg-slate-100"}`}><NavigationIcon name={item.icon} /></span><span><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs text-slate-500">{item.description}</span></span></Link>; })}
          </nav>
          <div className="my-5 h-px bg-slate-200" />
          <nav aria-label="Akun" className="grid gap-2">{accountNavigation.map((item) => <Link key={item.href} href={item.href} onClick={() => closeMenu()} className={item.emphasized ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover" : "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"}><NavigationIcon name={item.icon} />{item.label}</Link>)}</nav>
        </div>
        <p className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500">Platform informasi untuk masyarakat Indonesia di luar negeri.</p>
      </section>
    </div>}
  </div>;
}
