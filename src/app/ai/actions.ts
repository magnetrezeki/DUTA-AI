"use server";
import { orchestrate } from "@/lib/ai/orchestrator";
import type { DutaResponse } from "@/lib/ai/types";
export type AssistantState = { response: DutaResponse | null; error: string | null };
export async function askDutaAi(_state: AssistantState, formData: FormData): Promise<AssistantState> {
  const message = formData.get("message");
  if (typeof message !== "string" || !message.trim()) return { response: null, error: "Tulis pertanyaan terlebih dahulu." };
  return { response: await orchestrate(message), error: null };
}
