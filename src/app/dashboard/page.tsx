import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { FormNotice } from "@/components/auth/form-elements";
import { Container } from "@/components/ui/container";
import { isPlatformAdminRole, roleLabels } from "@/lib/auth/roles";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { user, profile } = await requireOnboardedUser();
  const params = await searchParams;
  const isAdmin = isPlatformAdminRole(profile.role);
  const supabase = await createClient();
  const { data: organizationAdminMemberships } = await supabase
    .from("organization_memberships")
    .select("organization_id, organization:organizations(name)")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("status", "approved");

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Dashboard pribadi</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Selamat datang, {profile.display_name}</h1>
            <p className="mt-2 text-slate-600">Akun Anda terlindungi dan hanya menampilkan data milik Anda.</p>
          </div>
          <form action={logout}>
            <button type="submit" className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Keluar</button>
          </form>
        </div>

        {params.error === "admin_access_denied" && (
          <div className="mt-6 max-w-2xl">
            <FormNotice tone="error">Akun anggota tidak memiliki akses ke area admin.</FormNotice>
          </div>
        )}

        <section className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">Profil</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Email</dt><dd className="mt-1 font-medium text-slate-900">{user.email}</dd></div>
              <div><dt className="text-slate-500">Negara saat ini</dt><dd className="mt-1 font-medium text-slate-900">Malaysia</dd></div>
              <div><dt className="text-slate-500">Peran</dt><dd className="mt-1 font-medium text-slate-900">{roleLabels[profile.role]}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">Kontribusi komunitas</h2>
            <p className="mt-3 leading-7 text-slate-600">Bantu melengkapi DUTA Map. Kiriman baru selalu menunggu moderasi dan tidak otomatis dianggap terverifikasi.</p>
            <Link href="/map/add" className="mt-5 inline-flex font-semibold text-brand-700 hover:underline">Tambahkan tempat</Link>
            {isAdmin && (
              <Link href="/admin" className="ml-5 mt-5 inline-flex font-semibold text-brand-700 hover:underline">Buka area admin</Link>
            )}
          </div>
        </section>
        {organizationAdminMemberships && organizationAdminMemberships.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-950">Organisasi yang Anda kelola</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {organizationAdminMemberships.map((membership) => (
                <Link key={membership.organization_id} href={`/organization-admin/${membership.organization_id}`} className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-brand-700">
                  {(membership.organization as unknown as { name: string } | null)?.name ?? "Buka dashboard organisasi"}
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
