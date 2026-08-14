"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function ModuleError({ title, description, reset }: { title: string; description: string; reset: () => void }) {
  return <main className="flex-1 py-12"><Container><section role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"><span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 font-bold text-red-800">!</span><h1 className="mt-4 text-2xl font-bold text-red-950">{title}</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-800">{description}</p><Button type="button" variant="danger" className="mt-5" onClick={reset}>Coba lagi</Button></section></Container></main>;
}
