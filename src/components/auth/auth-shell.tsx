import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex flex-1 items-center py-12">
      <Container>
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-2 leading-7 text-slate-600">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </Container>
    </main>
  );
}
