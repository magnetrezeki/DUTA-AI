import type { DutaIntent } from "./types";

const rules: Array<[DutaIntent, RegExp]> = [
  ["job_detail", /detail|rincian|lowongan ini|job id/i],
  ["find_job", /kerja|lowongan|karier|job/i],
  ["find_health_facility", /klinik|dokter|rumah sakit|farmasi|apotek|kesehatan|dental|diagnostik/i],
  ["representative_office", /kedutaan|konsulat|kbri|kjri|kantor perwakilan/i],
  ["official_contact", /telepon|whatsapp|email|kontak resmi/i],
  ["consular_help", /paspor|konsuler|darurat|imigrasi/i],
  ["official_news", /berita|pengumuman resmi/i],
  ["find_event", /acara|event|kegiatan/i],
  ["find_organization", /organisasi|komunitas/i],
  ["find_place", /tempat|restoran|toko|masjid|akomodasi/i],
  ["platform_help", /cara|bantuan aplikasi|fitur|gunakan duta/i],
];

export function routeIntent(message: string): { intent: DutaIntent; confidence: number } {
  const found = rules.find(([, pattern]) => pattern.test(message));
  return found ? { intent: found[0], confidence: 0.86 } : { intent: "general_duta_question", confidence: 0.55 };
}

export function extractEntities(message: string): Record<string, string> {
  const uuid = message.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i)?.[0];
  return uuid ? { id: uuid } : {};
}
