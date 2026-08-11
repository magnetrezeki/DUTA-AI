import { createClient } from "@/lib/supabase/server";
import type { DutaTool, ToolResult } from "./types";

const empty = (message: string, href: string): ToolResult => ({
  answer: message,
  sources: [],
  actions: [{ label: "Buka halaman terkait", href }],
  warnings: ["DUTA AI tidak akan mengarang data yang belum tersedia atau belum terverifikasi."],
});

function publicTool(
  name: string,
  intent: DutaTool["intent"],
  execute: DutaTool["execute"],
): DutaTool {
  return { name, intent, classification: "PUBLIC_READ", execute };
}

export const tools: DutaTool[] = [
  publicTool("verified_representative_offices", "representative_office", async ({ countryCode }) => {
    const db = await createClient();
    const { data } = await db.from("layanan_public_offices")
      .select("id,name,office_type,last_verified_at,source_name,evidence_url")
      .eq("country_code", countryCode).limit(5);
    const rows = data ?? [];
    if (!rows.length) return empty("Belum ada kantor perwakilan yang telah diverifikasi untuk ditampilkan.", "/connect");
    return {
      answer: rows.map((row) => `${row.name} (${row.office_type})`).join("\n"),
      sources: rows.map((row) => ({ label: row.source_name, url: row.evidence_url, verificationStatus: "verified" as const, lastVerifiedAt: row.last_verified_at ?? undefined })),
      actions: [{ label: "Lihat DUTA Connect", href: "/connect" }], warnings: [],
    };
  }),
  publicTool("verified_official_contacts", "official_contact", async ({ countryCode, query }) => {
    const db = await createClient();
    const { data } = await db.from("layanan_public_contact_channels")
      .select("label,channel_type,raw_value,last_verified_at,country_code,source_name,evidence_url")
      .eq("country_code", countryCode).limit(8);
    const rows = data ?? [];
    if (!rows.length) return empty("Belum ada kanal kontak resmi yang telah diverifikasi. Gunakan situs resmi, bukan nomor yang tidak bersumber.", "/connect");
    return {
      answer: rows.map((row) => `${row.label}: ${row.raw_value} (${row.channel_type})`).join("\n"),
      sources: rows.map((row) => ({ label: row.source_name, url: row.evidence_url, verificationStatus: "verified" as const, lastVerifiedAt: row.last_verified_at ?? undefined })),
      actions: [{ label: "Periksa layanan dan wilayah", href: `/connect?q=${encodeURIComponent(query.slice(0, 80))}` }], warnings: [],
    };
  }),
  publicTool("verified_consular_help", "consular_help", async (context) => {
    const contact = tools.find((tool) => tool.intent === "official_contact");
    return contact ? contact.execute(context) : empty("Kontak konsuler terverifikasi belum tersedia.", "/connect");
  }),
  publicTool("verified_official_news", "official_news", async () => {
    const db = await createClient();
    const { data } = await db.from("news_public_items")
      .select("id,title,summary,official_url,published_at,last_verified_at,source_name")
      .order("published_at", { ascending: false }).limit(6);
    const rows = data ?? [];
    if (!rows.length) return empty("Belum ada berita resmi terverifikasi untuk ditampilkan.", "/news");
    return { answer: rows.map((row) => row.title).join("\n"), sources: rows.map((row) => ({ label: row.title, url: row.official_url, verificationStatus: "verified" as const, lastVerifiedAt: row.last_verified_at ?? undefined })), actions: [{ label: "Buka DUTA News", href: "/news" }], warnings: [] };
  }),
  publicTool("published_job_search", "find_job", async ({ countryCode, query }) => {
    const db = await createClient();
    let request = db.from("jobs").select("id,title,city,state_region,deadline,source_kind,original_url").eq("country_code", countryCode).eq("status", "published").limit(8);
    const term = query.trim().slice(0, 60);
    if (term) request = request.ilike("title", `%${term.replace(/[%_]/g, "")}%`);
    const { data } = await request;
    if (!data?.length) return empty("Belum ada lowongan aktif yang cocok. DUTA AI tidak membuat lowongan palsu.", "/career/jobs");
    return { answer: data.map((job) => `${job.title} — ${job.city}, ${job.state_region}`).join("\n"), sources: data.flatMap((job) => job.original_url ? [{ label: job.title, url: job.original_url, verificationStatus: "verified" as const }] : []), actions: data.map((job) => ({ label: job.title, href: `/career/jobs/${job.id}` })), warnings: [] };
  }),
  publicTool("published_job_detail", "job_detail", async ({ entities }) => {
    if (!entities.id) return empty("Sertakan ID lowongan yang valid agar detail dapat diperiksa.", "/career/jobs");
    const db = await createClient();
    const { data } = await db.from("jobs").select("id,title,description,city,state_region,deadline,original_url,status").eq("id", entities.id).eq("status", "published").maybeSingle();
    if (!data) return empty("Lowongan aktif tersebut tidak ditemukan.", "/career/jobs");
    return { answer: `${data.title}\n${data.description}\nLokasi: ${data.city}, ${data.state_region}`, sources: data.original_url ? [{ label: "Sumber asli lowongan", url: data.original_url, verificationStatus: "verified" }] : [], actions: [{ label: "Buka detail lowongan", href: `/career/jobs/${data.id}` }], warnings: [] };
  }),
  publicTool("approved_community_places", "find_place", async ({ countryCode, query }) => {
    const db = await createClient();
    const term = query.trim().slice(0, 60).replace(/[%_]/g, "");
    const { data } = await db.from("community_places").select("id,name,city,state_region,address_text,trust_label,category:place_categories!category_id(name)").eq("country_code", countryCode).eq("moderation_status", "approved").ilike("name", `%${term}%`).limit(8);
    if (!data?.length) return empty("Belum ada tempat komunitas yang cocok.", "/map");
    return { answer: data.map((place) => `${place.name} — ${place.city}, ${place.state_region}`).join("\n"), sources: [{ label: "Direktori komunitas DUTA Map", verificationStatus: "community" }], actions: data.map((place) => ({ label: place.name, href: `/map/${place.id}` })), warnings: ["Data tempat berasal dari komunitas dan bukan informasi resmi pemerintah."] };
  }),
  publicTool("approved_health_directory", "find_health_facility", async (context) => {
    const place = tools.find((tool) => tool.intent === "find_place");
    const result = place ? await place.execute(context) : empty("Fasilitas kesehatan tidak ditemukan.", "/map");
    return { ...result, warnings: [...result.warnings, "Direktori kesehatan bukan sertifikasi medis dan DUTA AI tidak memberikan diagnosis."] };
  }),
  publicTool("approved_organizations", "find_organization", async ({ countryCode, query }) => {
    const db = await createClient();
    const term = query.trim().slice(0, 60).replace(/[%_]/g, "");
    const { data } = await db.from("organizations").select("slug,name,description,city,state_region,verification_status,source_url,last_verified_at").eq("country_code", countryCode).eq("status", "approved").ilike("name", `%${term}%`).limit(8);
    if (!data?.length) return empty("Belum ada organisasi yang cocok.", "/organizations");
    const sources = data.map((org) => org.verification_status === "verified" && org.source_url
      ? { label: org.name, url: org.source_url, verificationStatus: "verified" as const, lastVerifiedAt: org.last_verified_at ?? undefined }
      : { label: `${org.name} (komunitas)`, verificationStatus: "community" as const });
    return { answer: data.map((org) => `${org.name} — ${org.city}, ${org.state_region}`).join("\n"), sources, actions: data.map((org) => ({ label: org.name, href: `/organizations/${org.slug}` })), warnings: [] };
  }),
  publicTool("published_organization_events", "find_event", async () => {
    const db = await createClient();
    const { data } = await db.from("organization_events").select("id,title,starts_at,venue_name,organization:organizations!organization_id(name,slug,status)").eq("status", "published").gte("starts_at", new Date().toISOString()).order("starts_at").limit(8);
    if (!data?.length) return empty("Belum ada acara komunitas mendatang yang dipublikasikan.", "/organizations");
    return { answer: data.map((event) => `${event.title} — ${new Date(event.starts_at).toLocaleDateString("id-ID")}`).join("\n"), sources: [{ label: "Pengumuman organisasi di DUTA AI", verificationStatus: "community" }], actions: [{ label: "Lihat organisasi", href: "/organizations" }], warnings: ["Informasi acara berasal dari organisasi/komunitas terkait."] };
  }),
  {
    name: "own_career_information", intent: "general_duta_question", classification: "USER_OWNED_READ",
    async execute({ userId }) {
      if (!userId) return { ...empty("Masuk untuk melihat Career Passport dan lamaran milik Anda.", "/login"), actions: [{ label: "Masuk", href: "/login" }] };
      const db = await createClient();
      const [{ data: passport }, { data: applications }] = await Promise.all([
        db.from("career_passports").select("headline,visibility,updated_at").eq("user_id", userId).maybeSingle(),
        db.from("job_applications").select("id,status,submitted_at,job:jobs!job_id(title)").eq("applicant_id", userId).order("submitted_at", { ascending: false }).limit(5),
      ]);
      return { answer: `Career Passport: ${passport ? "tersedia dan " + passport.visibility : "belum dibuat"}. Lamaran terbaru: ${applications?.length ?? 0}.`, sources: [{ label: "Data pribadi akun Anda", verificationStatus: "platform" }], actions: [{ label: "Buka Career Passport", href: "/career/passport" }, { label: "Lihat lamaran", href: "/career/applications" }], warnings: ["Informasi ini hanya tersedia untuk akun yang sedang masuk."] };
    },
  },
];

export function getTool(intent: DutaTool["intent"]) {
  return tools.find((tool) => tool.intent === intent);
}
