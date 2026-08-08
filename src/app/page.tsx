import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center py-20 sm:py-28">
      <Container>
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            Untuk Warga Indonesia di Luar Negeri
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            Informasi tepercaya untuk kehidupan Anda di Malaysia.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            DUTA AI sedang dipersiapkan sebagai platform digital tepercaya bagi
            masyarakat Indonesia di luar negeri. Tahap pertama akan melayani
            komunitas Indonesia di Malaysia.
          </p>
          <div className="mt-8">
            <ButtonLink href="/ai">Mulai dengan Asisten DUTA AI</ButtonLink>
          </div>
          <section
            id="status"
            className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-950">
              Layanan utama tersedia
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              Temukan informasi perwakilan, berita resmi, direktori komunitas,
              organisasi, acara, dan peluang karier melalui modul DUTA AI.
            </p>
          </section>
        </div>
      </Container>
    </main>
  );
}
