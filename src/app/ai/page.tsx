import { AssistantPanel } from "@/components/ai/assistant-panel";
import { Container } from "@/components/ui/container";
export const metadata = { title: "Asisten DUTA AI", description: "Cari informasi DUTA AI melalui asisten baca-saja dengan sumber dan batas privasi." };
export default function DutaAiPage() {
  return <main className="py-12"><Container><p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Day 6 · Orchestration layer</p><h1 className="mt-2 text-4xl font-bold text-slate-950">Asisten DUTA AI</h1><p className="mt-3 max-w-3xl text-slate-600">Satu pintu untuk informasi publik terverifikasi dan data akun Anda sendiri, dengan batas privasi ketat.</p><div className="mt-8"><AssistantPanel /></div></Container></main>;
}
