import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";

type FeedbackStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: ReactNode;
  action?: { href: string; label: string };
  tone?: "neutral" | "danger";
};

export function FeedbackState({ eyebrow, title, description, icon, action, tone = "neutral" }: FeedbackStateProps) {
  return <section className={`rounded-[var(--radius-lg)] border border-dashed px-6 py-12 text-center ${tone === "danger" ? "border-red-300 bg-red-50" : "border-slate-300 bg-white"}`}>
    {icon && <span className={`mx-auto grid size-12 place-items-center rounded-full ${tone === "danger" ? "bg-red-100 text-danger" : "bg-slate-100 text-slate-500"}`}>{icon}</span>}
    {eyebrow && <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>}
    <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">{title}</h2>
    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
    {action && <Link href={action.href} className={buttonClass("primary", "mt-5")}>{action.label}</Link>}
  </section>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}
