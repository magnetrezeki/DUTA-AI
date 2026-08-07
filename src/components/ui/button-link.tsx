import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link>;

export function ButtonLink({ className = "", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-800 ${className}`}
      {...props}
    />
  );
}
