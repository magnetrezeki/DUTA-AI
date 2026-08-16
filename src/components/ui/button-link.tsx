import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { buttonClass, type ButtonVariant } from "@/components/ui/button";

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & { variant?: ButtonVariant; size?: "default" | "sm" };

export function ButtonLink({ className = "", variant = "primary", size = "default", ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, `${size === "sm" ? "min-h-9 px-3 py-1.5" : ""} ${className}`)} {...props} />;
}
