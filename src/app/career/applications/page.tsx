import { Container } from "@/components/ui/container";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { withdrawApplication } from "../actions";

export default async function ApplicationsPage() {
  const { user } = await requireOnboardedUser(); const supabase = await createClient();
  const { data } = await supabase.from("job_applications").select("id,status,status_note,created_at,share_career_passport,jobs(title,location_text)").eq("applicant_id", user.id).order("created_at", { ascending: false });
  return <main className="flex-1 py-12"><Container><h1 className="text-4xl font-bold">Lamaran saya</h1><p className="mt-3 text-slate-600">Pantau status setiap lamaran tanpa biaya.</p><div className="mt-8 grid gap-4">{data?.map((application) => <article key={application.id} className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">{(application.jobs as unknown as { title: string } | null)?.title ?? "Lowongan"}</h2><p className="mt-2 font-semibold text-brand-700">{application.status}</p><p className="mt-2 text-sm text-slate-600">Career Passport: {application.share_career_passport ? "dibagikan untuk lamaran ini" : "tetap privat"}</p>{application.status_note && <p className="mt-3 text-sm">{application.status_note}</p>}{!['withdrawn','rejected','offered'].includes(application.status) && <form action={withdrawApplication} className="mt-4"><input type="hidden" name="applicationId" value={application.id}/><button className="text-sm font-semibold text-red-700">Tarik lamaran</button></form>}</article>)}{!data?.length && <p>Belum ada lamaran.</p>}</div></Container></main>;
}
