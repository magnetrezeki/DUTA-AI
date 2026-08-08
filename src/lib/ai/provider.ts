export type AiProviderStatus = { name: "openai" | "deterministic"; available: boolean };

export function getAiProviderStatus(): AiProviderStatus {
  return process.env.OPENAI_API_KEY
    ? { name: "openai", available: true }
    : { name: "deterministic", available: false };
}

// Day 6 deliberately keeps provider output outside tool selection and authorization.
// A future approved integration may use this interface to improve wording only.
export interface AiLanguageProvider {
  compose(input: { facts: string; instruction: string }): Promise<string>;
}
