"use client";
import { useActionState } from "react";
import { askDutaAi, type AssistantState } from "@/app/ai/actions";
const initialState: AssistantState = { response: null, error: null };
export function AssistantPanel() {
  const [state, action, pending] = useActionState(askDutaAi, initialState);
  return <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <label htmlFor="message" className="font-semibold text-slate-900">Apa yang ingin Anda cari?</label>
      <textarea id="message" name="message" required maxLength={800} rows={7} className="mt-3 w-full rounded-xl border border-slate-300 p-3" placeholder="Contoh: Cari kantor perwakilan resmi untuk layanan paspor di Malaysia" />
      {state.error ? <p className="mt-2 text-sm text-red-700">{state.error}</p> : null}
      <button disabled={pending} className="mt-4 rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Memeriksa sumber…" : "Tanya DUTA AI"}</button>
      <p className="mt-4 text-xs text-slate-500">DUTA AI Day 6 bersifat baca-saja dan tidak dapat mengubah data.</p>
    </form>
    <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      {!state.response ? <p className="text-slate-600">Jawaban bersumber dan peringatan keselamatan akan tampil di sini.</p> : <>
        <p className="whitespace-pre-line text-slate-900">{state.response.answer}</p>
        {state.response.warnings.length ? <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{state.response.warnings.join(" ")}</div> : null}
        {state.response.sources.length ? <div className="mt-5"><h2 className="font-semibold">Sumber</h2><ul className="mt-2 space-y-2 text-sm">{state.response.sources.map((source, index) => <li key={`${source.label}-${index}`}>{source.url ? <a className="text-brand-700 underline" href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label} <span className="text-slate-500">({source.verificationStatus})</span></li>)}</ul></div> : null}
        <div className="mt-5 flex flex-wrap gap-2">{state.response.actions.map((item) => <a key={`${item.href}-${item.label}`} href={item.href} className="rounded-lg border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-700">{item.label}</a>)}</div>
        <p className="mt-5 text-xs text-slate-500">Intent: {state.response.intent} · Confidence: {Math.round(state.response.confidence * 100)}% · Request: {state.response.requestId}</p>
      </>}
    </section>
  </div>;
}
