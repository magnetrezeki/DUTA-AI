export type RegistrationErrorCategory =
  | "rate_limited"
  | "invalid_email"
  | "email_not_authorized"
  | "weak_password"
  | "existing_account"
  | "invalid_redirect"
  | "network_failure"
  | "unexpected_auth";

type AuthErrorLike = { code?: string; message?: string; name?: string; status?: number };

const knownCodes: Partial<Record<string, RegistrationErrorCategory>> = {
  email_address_invalid: "invalid_email",
  email_address_not_authorized: "email_not_authorized",
  email_exists: "existing_account",
  over_email_send_rate_limit: "rate_limited",
  over_request_rate_limit: "rate_limited",
  user_already_exists: "existing_account",
  weak_password: "weak_password",
};

export function classifyAuthError(error: AuthErrorLike): RegistrationErrorCategory {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  if (error.status === 429 || code.includes("rate_limit")) return "rate_limited";
  if (knownCodes[code]) return knownCodes[code];
  if (code.includes("password")) return "weak_password";
  if (code.includes("email") && code.includes("invalid")) return "invalid_email";
  if (code.includes("already") || code.includes("exists")) return "existing_account";
  if (code.includes("redirect") || message.includes("redirect")) return "invalid_redirect";
  return "unexpected_auth";
}

export function classifyThrownAuthError(error: unknown): RegistrationErrorCategory {
  if (error instanceof TypeError) return "network_failure";
  if (error && typeof error === "object" && "name" in error) {
    const name = String(error.name);
    if (name === "AuthRetryableFetchError" || name === "FetchError") return "network_failure";
  }
  return "unexpected_auth";
}

export function safeAuthErrorCode(error: AuthErrorLike) {
  const code = error.code?.toLowerCase() ?? "unknown";
  return /^[a-z0-9_]{1,80}$/.test(code) ? code : "unknown";
}
