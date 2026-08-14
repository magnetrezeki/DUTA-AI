import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "brand" | "secondary" | "ghost" | "danger";

export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary text-white hover:bg-primary-hover disabled:bg-slate-300",
    brand: "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-slate-300",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 disabled:text-slate-400",
    ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:text-slate-400",
    danger: "bg-danger text-white hover:bg-red-800 disabled:bg-slate-300",
  };
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${variants[variant]} ${className}`;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
