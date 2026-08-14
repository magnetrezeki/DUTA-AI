import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions, compact = false }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; compact?: boolean }) {
  return <header className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${compact ? "max-w-4xl" : ""}`}>
    <div className="max-w-3xl">{eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>}<h1 className={`${eyebrow ? "mt-3" : ""} text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-4xl`}>{title}</h1>{description && <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p>}</div>{actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
  </header>;
}

export function SectionHeader({ eyebrow, title, description, aside }: { eyebrow?: string; title: string; description?: string; aside?: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{eyebrow}</p>}<h2 className={`${eyebrow ? "mt-2" : ""} text-2xl font-bold tracking-tight text-slate-950`}>{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}</div>{aside}</div>;
}
