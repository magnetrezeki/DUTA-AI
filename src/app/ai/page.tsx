import { AssistantPanel } from "@/components/ai/assistant-panel";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";

export const metadata = { title: "Asisten DUTA AI", description: "Cari informasi DUTA AI melalui asisten baca-saja dengan sumber dan batas privasi." };

export default function DutaAiPage() {
  return <main className="flex-1 bg-slate-50 py-8 sm:py-12">
    <Container>
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl"><div className="flex flex-wrap gap-2"><Badge tone="ai">Asisten informasi</Badge><Badge tone="verified">Privasi dan izin tetap berlaku</Badge></div><h1 className="mt-5 text-4xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">Temukan jawaban, lalu telusuri sumbernya.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">DUTA AI membantu mencari informasi layanan, berita, karier, komunitas, dan organisasi dengan alat baca-saja yang mengikuti otorisasi Anda.</p></div>
        <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Bukan kanal resmi pemerintah.</strong> Jawaban AI dapat membantu memahami informasi, tetapi sumber tertaut tetap menjadi rujukan utama.</div>
      </header>
      <div className="mt-8"><AssistantPanel /></div>
    </Container>
  </main>;
}
