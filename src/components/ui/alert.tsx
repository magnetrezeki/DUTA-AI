import type { ComponentPropsWithoutRef } from "react";

type AlertTone = "information" | "success" | "warning" | "danger";

export function Alert({ tone = "information", className = "", ...props }: ComponentPropsWithoutRef<"div"> & { tone?: AlertTone }) {
  const tones: Record<AlertTone, string> = {
    information: "border-blue-200 bg-blue-50 text-blue-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    danger: "border-red-200 bg-red-50 text-red-950",
  };
  return <div role={tone === "danger" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm leading-6 ${tones[tone]} ${className}`} {...props} />;
}
