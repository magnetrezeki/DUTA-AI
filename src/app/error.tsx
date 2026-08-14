"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("duta_app_error", { name: error.name, digest: error.digest }); }, [error]);
  return <main className="flex flex-1 items-center bg-slate-50 py-20"><Container><section className="mx-auto max-w-xl rounded-[var(--radius-lg)] border border-red-200 bg-white p-8 text-center shadow-[var(--shadow-low)]"><span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-2xl font-bold text-danger" aria-hidden="true">!</span><p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-danger">Gangguan sementara</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Layanan belum dapat ditampilkan</h1><p className="mt-3 leading-7 text-slate-600">Data pribadi dan rincian teknis tidak ditampilkan. Silakan coba kembali dengan aman.</p><Button type="button" onClick={reset} className="mt-6">Coba lagi</Button></section></Container></main>;
}
