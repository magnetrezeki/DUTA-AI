import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modules = [
  { href: "/admin/official-sources", title: "Master Source Registry", description: "Kelola sumber, status Registry, dan kelayakan publikasi.", tone: "verified" as const },
  { href: "/admin/connect", title: "DUTA Connect", description: "Kelola kantor, yurisdiksi, layanan, dan kontak resmi.", tone: "curated" as const },
  { href: "/admin/news", title: "DUTA News", description: "Kelola sumber dan URL berita melalui jalur editorial.", tone: "curated" as const },
  { href: "/admin/map", title: "DUTA Map", description: "Tinjau tempat, koreksi, ulasan, dan laporan komunitas.", tone: "community" as const },
  { href: "/admin/organizations", title: "Organisasi", description: "Verifikasi organisasi dan klaim kepemilikan.", tone: "warning" as const },
  { href: "/admin/career", title: "DUTA Karier", description: "Verifikasi pemberi kerja dan moderasi lowongan.", tone: "warning" as const },
] as const;

export default async function AdminPage() {
  return (
    <main className="flex-1 bg-slate-50 py-10 sm:py-12">
      <Container>
        <PageHeader eyebrow="Konsol operasional" title="Administrasi DUTA AI" description="Pilih ruang kerja berdasarkan tugas. Semua akses dan tindakan tetap diverifikasi oleh server." actions={<Badge tone="danger">Akses platform</Badge>} />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.href} className="transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
              <CardContent className="flex h-full flex-col">
                <Badge tone={module.tone} className="self-start">Operasional</Badge>
                <h2 className="mt-5 text-xl font-bold text-slate-950">{module.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{module.description}</p>
                <Link href={module.href} className="mt-6 inline-flex min-h-11 items-center font-bold text-brand-700 hover:underline">Buka ruang kerja →</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
