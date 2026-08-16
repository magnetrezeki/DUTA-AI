"use client";

import { useActionState, useState } from "react";
import { askDutaAi, type AssistantState } from "@/app/ai/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { labelClass, textareaClass } from "@/components/ui/form-control";

const initialState: AssistantState = { response: null, error: null };
const suggestions = [
  "Di mana kantor perwakilan terdekat untuk wilayah saya?",
  "Apa dokumen asas untuk urusan paspor?",
  "Cari layanan resmi sesuai negeri tempat saya tinggal.",
  "Bagaimana mencari peluang kerja yang tersedia?",
  "Tunjukkan berita terbaru yang relevan.",
] as const;

export function AssistantPanel() {
  const [state, action, pending] = useActionState(askDutaAi, initialState);
  const [message, setMessage] = useState("");

  return <div className="overflow-hidden rounded-[var(--radius-xl)] border border-slate-200 bg-white shadow-[var(--shadow-raised)]">
    <div className="grid min-h-[38rem] lg:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.28fr)]">
      <aside className="border-b border-slate-200 bg-slate-50 p-5 sm:p-7 lg:border-b-0 lg:border-r">
        <Badge tone="ai">Dibantu AI</Badge>
        <h2 className="mt-4 text-xl font-bold text-slate-950">Mulai dengan contoh kebutuhan</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Pilih pertanyaan atau tulis dengan bahasa Anda sendiri. Asisten bersifat baca-saja dan menggunakan alat yang sesuai.</p>
        <div className="mt-6 space-y-2" aria-label="Saran pertanyaan">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setMessage(suggestion)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold leading-5 text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span>{suggestion}</span><span aria-hidden="true" className="text-brand-700">→</span></button>)}</div>
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm font-bold text-blue-950">Batas yang jelas</p><p className="mt-1 text-xs leading-5 text-blue-900">DUTA AI tidak membuat keputusan resmi, mengubah data, atau melewati izin akun Anda.</p></div>
      </aside>

      <div className="flex min-h-[32rem] flex-col bg-white">
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Percakapan baru</p><p className="mt-1 text-sm text-slate-600">Jawaban dengan konteks kepercayaan</p></div><span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><span aria-hidden="true" className="size-2 rounded-full bg-success" /> Baca-saja</span></header>

        <section aria-live="polite" aria-busy={pending} className="flex-1 px-5 py-6 sm:px-7">
          {pending ? <LoadingAnswer /> : !state.response ? <EmptyConversation /> : <Answer response={state.response} />}
        </section>

        <form action={action} className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-5">
          <label htmlFor="message" className={labelClass}>Pertanyaan untuk DUTA AI</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end"><textarea id="message" name="message" required maxLength={800} rows={3} value={message} onChange={(event) => setMessage(event.target.value)} className={`${textareaClass} min-h-24 resize-y`} placeholder="Tuliskan kebutuhan informasi Anda…" /><Button disabled={pending || !message.trim()} className="w-full shrink-0 sm:w-auto">{pending ? "Mencari…" : "Tanya DUTA"}<span aria-hidden="true">↑</span></Button></div>
          {state.error && <Alert tone="danger" className="mt-3">{state.error}</Alert>}
          <p className="mt-2 text-xs leading-5 text-slate-500">Jangan masukkan kata sandi, token, atau data pribadi sensitif.</p>
        </form>
      </div>
    </div>
  </div>;
}

function EmptyConversation() { return <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center py-10 text-center"><span aria-hidden="true" className="grid size-14 place-items-center rounded-2xl bg-slate-950 text-2xl text-red-200">✦</span><h3 className="mt-5 text-xl font-bold text-slate-950">Apa yang bisa DUTA bantu?</h3><p className="mt-2 text-sm leading-6 text-slate-600">Tanyakan layanan resmi, kantor perwakilan, berita terkurasi, peluang karier, organisasi, atau tempat komunitas.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Badge tone="verified">Sumber terverifikasi</Badge><Badge tone="curated">Konten terkurasi</Badge><Badge tone="ai">Sintesis AI</Badge></div></div>; }
function LoadingAnswer() { return <div className="mx-auto max-w-2xl animate-pulse space-y-4 py-6" role="status"><span className="sr-only">DUTA sedang memeriksa sumber</span><div className="h-4 w-28 rounded bg-slate-200" /><div className="h-4 w-full rounded bg-slate-100" /><div className="h-4 w-5/6 rounded bg-slate-100" /><div className="h-4 w-2/3 rounded bg-slate-100" /></div>; }

function Answer({ response }: { response: NonNullable<AssistantState["response"]> }) {
  return <article className="mx-auto max-w-3xl"><div className="flex flex-wrap items-center gap-2"><Badge tone="ai">Sintesis DUTA AI</Badge>{response.sources.length > 0 && <Badge tone="curated">{response.sources.length} sumber</Badge>}</div><h3 className="sr-only">Jawaban DUTA AI</h3><p className="mt-5 whitespace-pre-line text-[1.02rem] leading-8 text-slate-800">{response.answer}</p>{response.warnings.length > 0 && <Alert tone="warning" className="mt-5">{response.warnings.join(" ")}</Alert>}{response.sources.length > 0 && <section className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"><h4 className="font-bold text-slate-950">Sumber yang digunakan</h4><ul className="mt-3 space-y-3">{response.sources.map((source, index) => <li key={`${source.label}-${index}`} className="flex items-start justify-between gap-4 border-t border-slate-200 pt-3 first:border-0 first:pt-0"><div><p className="text-sm font-bold text-slate-900">{source.url ? <a className="underline decoration-slate-300 underline-offset-4 hover:text-primary" href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}</p>{source.lastVerifiedAt && <p className="mt-1 text-xs text-slate-500">Diperiksa {source.lastVerifiedAt}</p>}</div><Badge tone={source.verificationStatus === "verified" ? "verified" : source.verificationStatus === "community" ? "community" : "curated"}>{source.verificationStatus === "verified" ? "Terverifikasi" : source.verificationStatus === "community" ? "Komunitas" : "Platform"}</Badge></li>)}</ul></section>}<div className="mt-6 flex flex-wrap gap-2">{response.actions.map((item) => <a key={`${item.href}-${item.label}`} href={item.href} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">{item.label}</a>)}</div><p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Jawaban ini adalah sintesis AI, bukan pernyataan resmi pemerintah. Periksa sumber tertaut untuk keputusan penting.</p></article>;
}
