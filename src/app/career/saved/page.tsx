import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireOnboardedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { removeSavedJob } from "../actions";

export default async function SavedJobsPage() {
  const { user } = await requireOnboardedUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_jobs")
    .select("job_id,created_at,jobs(id,title,location_text,employment_type,status,deadline)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return <main className="flex-1 py-12"><Container><h1 className="text-4xl font-bold">Lowongan tersimpan</h1><p className="mt-3 text-slate-600">Daftar ini privat dan hanya tersedia untuk akun Anda.</p><div className="mt-8 grid gap-4">{data?.map((saved) => { const job = saved.jobs as unknown as { id: string; title: string; location_text: string; employment_type: string; status: string; deadline: string | null } | null; return <article key={saved.job_id} className="rounded-2xl border bg-white p-6">{job ? <><h2 className="text-xl font-bold"><Link href={`/career/jobs/${job.id}`}>{job.title}</Link></h2><p className="mt-2 text-sm text-slate-600">{job.location_text} · {job.employment_type.replaceAll("_", " ")}</p></> : <p>Lowongan tidak lagi tersedia.</p>}<form action={removeSavedJob} className="mt-4"><input type="hidden" name="jobId" value={saved.job_id}/><button className="text-sm font-semibold text-red-700">Hapus dari tersimpan</button></form></article>; })}{!data?.length && <p>Belum ada lowongan tersimpan.</p>}</div></Container></main>;
}
