import { PlaceSubmissionForm } from "@/components/map/place-submission-form";
import { Container } from "@/components/ui/container";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AddPlacePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireOnboardedUser();
  const status = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("place_categories")
    .select("id,name,parent_id")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="flex-1 py-12">
      <Container>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">Tambahkan tempat yang belum ada</h1>
          <p className="mt-3 text-slate-600">
            Kiriman Anda adalah data komunitas, berstatus belum terverifikasi,
            diperiksa untuk kemungkinan duplikat, dan tidak tampil publik sebelum
            disetujui moderator.
          </p>
          {status.success && (
            <p className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">
              Kiriman diterima dan menunggu moderasi.
            </p>
          )}
          {status.error && (
            <p className="mt-5 rounded-lg bg-red-50 p-4 text-red-900">
              Kiriman belum berhasil. Periksa semua kolom dan pastikan lokasi telah
              dikonfirmasi.
            </p>
          )}
          <PlaceSubmissionForm categories={categories ?? []} />
        </div>
      </Container>
    </main>
  );
}
