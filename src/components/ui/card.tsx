import type { ComponentPropsWithoutRef } from "react";

export function Card({ className = "", ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={`rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-low)] ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={`border-b border-slate-100 px-5 py-4 sm:px-6 ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={`p-5 sm:p-6 ${className}`} {...props} />;
}
