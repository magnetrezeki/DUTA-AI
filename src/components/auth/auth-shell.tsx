import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { BrandMark } from "@/components/layout/brand-mark";

type AuthShellProps = { title: string; description: string; children: ReactNode };

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex flex-1 items-center bg-[linear-gradient(145deg,#f8fafc_0%,#fff_45%,#f0fdfa_100%)] py-8 sm:py-14">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border border-slate-200 bg-white shadow-[var(--shadow-raised)] lg:grid-cols-[0.88fr_1.12fr]">
          <aside className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <BrandMark inverted />
              <p className="mt-12 text-xs font-bold uppercase tracking-[0.18em] text-red-300">Ruang aman DUTA</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Satu akun, akses yang tetap berada dalam kendali Anda.</h2>
              <ul className="mt-7 space-y-4 text-sm leading-6 text-slate-300">
                <li className="flex gap-3"><span aria-hidden="true" className="text-emerald-300">●</span> Simpan pekerjaan dan pantau lamaran pribadi.</li>
                <li className="flex gap-3"><span aria-hidden="true" className="text-emerald-300">●</span> Ikuti organisasi dan layanan yang relevan.</li>
                <li className="flex gap-3"><span aria-hidden="true" className="text-emerald-300">●</span> Akses data pribadi dilindungi pada server dan database.</li>
              </ul>
            </div>
            <p className="mt-10 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-400">DUTA tidak akan meminta kata sandi atau tautan pemulihan Anda melalui pesan pribadi.</p>
          </aside>
          <section className="p-6 sm:p-9 lg:p-12">
            <div className="lg:hidden"><BrandMark /></div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 lg:mt-0">Akun DUTA</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl leading-7 text-slate-600">{description}</p>
            <div className="mt-8">{children}</div>
          </section>
        </div>
      </Container>
    </main>
  );
}
