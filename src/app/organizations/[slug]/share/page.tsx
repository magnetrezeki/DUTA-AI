import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Container } from "@/components/ui/container";
import { appUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

export default async function ShareOrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const supabase = await createClient(); const { data: organization } = await supabase.from("organizations").select("name,slug").eq("slug", slug).eq("status", "approved").single(); if (!organization) notFound();
  const url = appUrl(`/organizations/${organization.slug}`); const qr = await QRCode.toString(url, { type: "svg", margin: 1, width: 240 });
  return <main className="flex-1 py-12"><Container><div className="mx-auto max-w-lg rounded-2xl border bg-white p-7 text-center"><h1 className="text-2xl font-bold">Bagikan {organization.name}</h1><div className="mx-auto mt-6 w-fit" dangerouslySetInnerHTML={{ __html: qr }} /><p className="mt-5 break-all text-sm text-slate-600">{url}</p><Link href={`/organizations/${slug}`} className="mt-5 inline-flex font-semibold text-brand-700">Kembali</Link></div></Container></main>;
}
