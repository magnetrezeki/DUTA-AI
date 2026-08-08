"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("duta_app_error", { name: error.name, digest: error.digest }); }, [error]);
  return <main className="flex flex-1 items-center justify-center px-6 py-20"><div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-3xl font-bold">Layanan sedang mengalami gangguan</h1><p className="mt-3 text-slate-600">Data pribadi dan rincian teknis tidak ditampilkan. Silakan coba lagi.</p><button type="button" onClick={reset} className="mt-6 rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white">Coba lagi</button></div></main>;
}
