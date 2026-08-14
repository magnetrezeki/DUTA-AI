import type { ComponentPropsWithoutRef } from "react";

type BadgeTone = "neutral" | "verified" | "curated" | "community" | "ai" | "warning" | "danger";

export function Badge({ tone = "neutral", className = "", ...props }: ComponentPropsWithoutRef<"span"> & { tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
    curated: "border-blue-200 bg-blue-50 text-blue-800",
    community: "border-amber-200 bg-amber-50 text-amber-900",
    ai: "border-violet-200 bg-violet-50 text-violet-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
    danger: "border-red-200 bg-red-50 text-red-800",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone]} ${className}`} {...props} />;
}
