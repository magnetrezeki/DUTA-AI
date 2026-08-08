import { createClient } from "@/lib/supabase/server";
import { extractEntities, routeIntent } from "./intent-router";
import { logAiRequest } from "./observability";
import { getAiProviderStatus } from "./provider";
import { inspectPrompt } from "./safety-router";
import { getTool, tools } from "./tools";
import type { DutaResponse, ToolResult } from "./types";

const fallback: ToolResult = { answer: "Saya dapat membantu mencari layanan perwakilan, berita, karier, tempat, kesehatan, organisasi, dan acara di DUTA AI.", sources: [{ label: "Panduan platform DUTA AI", verificationStatus: "platform" }], actions: [{ label: "Buka dashboard", href: "/dashboard" }], warnings: [] };

export async function orchestrate(message: string): Promise<DutaResponse> {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const safety = inspectPrompt(message);
  const routed = routeIntent(message);
  const provider = getAiProviderStatus();
  if (!safety.allowed) {
    const response: DutaResponse = { answer: safety.reason, intent: routed.intent, agent: "DUTA Safety Router", confidence: 1, entities: {}, sources: [], actions: [], warnings: ["Permintaan diblokir untuk melindungi privasi dan keamanan."], follow_up_suggestions: ["Tanyakan informasi publik atau data milik akun Anda sendiri."], requestId };
    logAiRequest({ requestId, intent: routed.intent, tool: "none", result: "blocked", latencyMs: Date.now() - started, sourceCount: 0, provider: provider.name });
    return response;
  }
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const privateCareerRequest = /career passport|paspor karier|lamaran saya|aplikasi saya/i.test(safety.message);
  const tool = privateCareerRequest ? tools.find((candidate) => candidate.name === "own_career_information") : getTool(routed.intent);
  try {
    const entities = extractEntities(safety.message);
    const result = tool ? await tool.execute({ countryCode: "MY", userId: user?.id ?? null, query: safety.message, entities }) : fallback;
    const response: DutaResponse = { ...result, intent: routed.intent, agent: tool?.name ?? "duta_platform_guide", confidence: routed.confidence, entities, follow_up_suggestions: ["Persempit lokasi atau kategori untuk hasil yang lebih relevan.", "Buka sumber asli sebelum mengambil keputusan penting."], requestId };
    logAiRequest({ requestId, intent: routed.intent, tool: tool?.name ?? "platform_guide", result: "success", latencyMs: Date.now() - started, sourceCount: response.sources.length, provider: provider.name });
    return response;
  } catch (error) {
    logAiRequest({ requestId, intent: routed.intent, tool: tool?.name ?? "none", result: "error", latencyMs: Date.now() - started, sourceCount: 0, provider: provider.name, errorCode: error instanceof Error ? error.name : "unknown" });
    return { ...fallback, answer: "Layanan DUTA AI sedang tidak tersedia. Silakan gunakan halaman fitur terkait atau coba lagi nanti.", intent: routed.intent, agent: "DUTA Response Composer", confidence: 0, entities: {}, warnings: ["Tidak ada jawaban yang dibuat-buat saat sumber data gagal."], follow_up_suggestions: ["Coba lagi nanti."], requestId };
  }
}
