export function logAiRequest(event: {
  requestId: string;
  intent: string;
  tool: string;
  result: "success" | "blocked" | "error";
  latencyMs: number;
  sourceCount: number;
  provider: string;
  errorCode?: string;
}) {
  // Metadata only: never log prompts, CVs, profile content, credentials, or tool results.
  console.info("duta_ai_request", event);
}
