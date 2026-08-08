"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { primaryNavigation } from "@/config/navigation";

export function MobileNavigation() {
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

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="ml-auto lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-600 hover:text-brand-700"
      >
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            onClick={() => closeMenu(true)}
            className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[1px]"
          />
          <section
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <span className="text-lg font-bold tracking-tight text-brand-700">DUTA AI</span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => closeMenu(true)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-600 hover:text-brand-700"
              >
                <span aria-hidden="true">✕</span> Tutup
              </button>
            </div>
            <nav aria-label="Navigasi seluler" className="grid gap-1 overflow-y-auto p-4">
              {primaryNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => closeMenu()}
                  className={item.emphasized
                    ? "rounded-lg bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800"
                    : "rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-brand-700"}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>
        </div>
      )}
    </div>
  );
}
