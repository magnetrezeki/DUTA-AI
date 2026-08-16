import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { FormNotice } from "@/components/auth/form-elements";
import { NavigationIcon } from "@/components/layout/navigation-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { isPlatformAdminRole, roleLabels } from "@/lib/auth/roles";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = { searchParams: Promise<{ error?: string }> };
type OrganizationMembership = { organization_id: string; organization: { name: string } | null };
type NewsPreview = { id: string; title: string; published_at: string; source_name: string };

const quickActions = [
  { href: "/ai", label: "Tanya DUTA AI", description: "Mulai dari kebutuhan Anda", icon: "spark" as const },
  { href: "/connect", label: "Cari layanan resmi", description: "Kantor, wilayah, dan kontak", icon: "connect" as const },
  { href: "/career", label: "Lihat peluang karier", description: "Lowongan dan kesiapan kerja", icon: "career" as const },
];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { user, profile } = await requireOnboardedUser();
  const params = await searchParams;
  const isAdmin = isPlatformAdminRole(profile.role);
  const supabase = await createClient();
  const [membershipsResult, applicationsResult, savedResult, alertsResult, newsResult] = await Promise.all([
    supabase.from("organization_memberships").select("organization_id, organization:organizations(name)").eq("user_id", user.id).eq("role", "admin").eq("status", "approved"),
    supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("applicant_id", user.id),
    supabase.from("saved_jobs").select("job_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("job_alerts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true),
    supabase.from("news_public_items").select("id,title,published_at,source_name").order("published_at", { ascending: false }).limit(3),
  ]);
  const memberships = (membershipsResult.data ?? []) as unknown as OrganizationMembership[];
  const news = (newsResult.data ?? []) as NewsPreview[];

  return <main className="flex-1 bg-slate-50 py-8 sm:py-12">
    <Container>
      <header className="rounded-[var(--radius-xl)] border border-slate-200 bg-white px-5 py-6 shadow-[var(--shadow-low)] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div><Badge tone="verified">Ruang pribadi terlindungi</Badge><h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Selamat datang, {profile.display_name}</h1><p className="mt-2 max-w-2xl leading-7 text-slate-600">Mulai dari layanan yang paling sering dibutuhkan. Data pribadi di ruang ini hanya ditampilkan sesuai akses akun Anda.</p></div>
          <form action={logout}><Button type="submit" variant="secondary">Keluar</Button></form>
        </div>
      </header>

      {params.error === "admin_access_denied" && <div className="mt-6 max-w-2xl"><FormNotice tone="error">Akun anggota tidak memiliki akses ke area admin.</FormNotice></div>}

      <section aria-labelledby="quick-actions" className="mt-8">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Mulai dari sini</p><h2 id="quick-actions" className="mt-2 text-2xl font-bold text-slate-950">Apa yang ingin Anda lakukan?</h2></div><Link href="/map" className="hidden text-sm font-bold text-primary hover:underline sm:block">Jelajahi Map</Link></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{quickActions.map((item, index) => <Link key={item.href} href={item.href} className={`group flex min-h-36 flex-col justify-between rounded-[var(--radius-lg)] border p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${index === 0 ? "border-slate-900 bg-slate-950 text-white hover:bg-slate-900" : "border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:shadow-[var(--shadow-low)]"}`}><span className={`grid size-10 place-items-center rounded-xl ${index === 0 ? "bg-white/10 text-red-200" : "bg-red-50 text-brand-700"}`}><NavigationIcon name={item.icon} /></span><span className="mt-5"><span className="block font-bold">{item.label}</span><span className={`mt-1 block text-sm ${index === 0 ? "text-slate-300" : "text-slate-600"}`}>{item.description}</span></span></Link>)}</div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card><CardHeader className="flex flex-row items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Ringkasan karier</p><h2 className="mt-1 text-xl font-bold text-slate-950">Aktivitas Anda</h2></div><ButtonLink href="/career" variant="ghost" size="sm">Buka Karier</ButtonLink></CardHeader><CardContent><div className="grid grid-cols-3 gap-3 text-center"><DashboardMetric value={applicationsResult.count ?? 0} label="Lamaran" /><DashboardMetric value={savedResult.count ?? 0} label="Tersimpan" /><DashboardMetric value={alertsResult.count ?? 0} label="Alert aktif" /></div>{(applicationsResult.count ?? 0) + (savedResult.count ?? 0) + (alertsResult.count ?? 0) === 0 && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Belum ada aktivitas karier. Jelajahi lowongan yang tersedia atau buat alert agar peluang relevan lebih mudah ditemukan.</p>}</CardContent></Card>
        <Card><CardHeader><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Konteks akun</p><h2 className="mt-1 text-xl font-bold text-slate-950">Profil Anda</h2></CardHeader><CardContent><dl className="space-y-4 text-sm"><ProfileRow label="Negara saat ini" value={profile.current_country_code === "MY" ? "Malaysia" : profile.current_country_code} /><ProfileRow label="Peran" value={roleLabels[profile.role]} /><ProfileRow label="Email" value={user.email ?? "Tidak tersedia"} /></dl></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card><CardHeader className="flex flex-row items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Informasi terkini</p><h2 className="mt-1 text-xl font-bold text-slate-950">News terkurasi</h2></div><ButtonLink href="/news" variant="ghost" size="sm">Lihat semua</ButtonLink></CardHeader><CardContent>{news.length ? <ul className="divide-y divide-slate-100">{news.map((item) => <li key={item.id} className="py-4 first:pt-0 last:pb-0"><p className="font-bold leading-6 text-slate-950">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.source_name} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.published_at))}</p></li>)}</ul> : <div className="rounded-xl bg-slate-50 p-5"><p className="font-bold text-slate-900">Belum ada berita publik terbaru</p><p className="mt-2 text-sm leading-6 text-slate-600">DUTA hanya menampilkan informasi yang memenuhi lapisan kurasi dan sumber.</p></div>}</CardContent></Card>
        <Card><CardHeader><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Kontribusi</p><h2 className="mt-1 text-xl font-bold text-slate-950">Bantu komunitas</h2></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">Tambahkan tempat berguna ke DUTA Map. Kiriman baru selalu menunggu moderasi dan tidak otomatis dianggap terverifikasi.</p><ButtonLink href="/map/add" variant="secondary" className="mt-5 w-full">Tambahkan tempat</ButtonLink>{isAdmin && <ButtonLink href="/admin" variant="ghost" className="mt-2 w-full">Buka area admin</ButtonLink>}</CardContent></Card>
      </div>

      {memberships.length > 0 && <section className="mt-8"><h2 className="text-xl font-bold text-slate-950">Organisasi yang Anda kelola</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{memberships.map((membership) => <Link key={membership.organization_id} href={`/organization-admin/${membership.organization_id}`} className="flex min-h-16 items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 font-bold text-primary hover:border-slate-300"><span>{membership.organization?.name ?? "Dashboard organisasi"}</span><span aria-hidden="true">→</span></Link>)}</div></section>}
    </Container>
  </main>;
}

function DashboardMetric({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-slate-50 px-2 py-4"><dd className="text-2xl font-bold text-slate-950">{value}</dd><dt className="mt-1 text-xs font-semibold text-slate-500">{label}</dt></div>; }
function ProfileRow({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-bold text-slate-900">{value}</dd></div>; }
