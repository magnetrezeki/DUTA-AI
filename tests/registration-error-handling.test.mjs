import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const actions = read("src/app/(auth)/actions.ts");
const categories = read("src/lib/auth/registration-errors.ts");
const registerPage = read("src/app/(auth)/register/page.tsx");
const submitButton = read("src/components/auth/registration-submit-button.tsx");
const appUrl = read("src/lib/app-url.ts");
const updatePasswordPage = read("src/app/(auth)/update-password/page.tsx");

test("registration categorizes rate limits, validation, existing accounts, redirects, network, and unknown failures", () => {
  for (const category of ["rate_limited", "invalid_email", "email_not_authorized", "weak_password", "existing_account", "invalid_redirect", "network_failure", "unexpected_auth"]) {
    assert.match(categories, new RegExp(`"${category}"`));
  }
  assert.match(categories, /error\.status === 429/);
  assert.match(categories, /email_address_not_authorized: "email_not_authorized"/);
});

test("registration returns only safe categories and does not log raw Supabase messages", () => {
  const logger = actions.match(
    /function logRegistrationFailure\([\s\S]*?\n\}/,
  )?.[0] ?? "";

  assert.match(actions, /requestId, category, code/);
  assert.match(actions, /JSON\.stringify\(\{ requestId, category, code \}\)/);
  assert.doesNotMatch(actions, /message: error\.message/);
  assert.doesNotMatch(logger, /password|email|token|cookie|session|formData/i);
});

test("registration catches network failures and detects non-created duplicate identities", () => {
  assert.match(actions, /classifyThrownAuthError/);
  assert.match(actions, /data\.user\?\.identities\?\.length === 0/);
});

test("registration has localized safe messages for every failure category", () => {
  for (const category of ["rate_limited", "email_not_authorized", "existing_account", "network_failure", "invalid_redirect", "unexpected_auth"]) {
    assert.match(registerPage, new RegExp(`${category}:`));
  }
});

test("registration submit is disabled and labelled while pending", () => {
  assert.match(submitButton, /useFormStatus/);
  assert.match(submitButton, /disabled=\{pending\}/);
  assert.match(submitButton, /Mendaftarkan\.\.\./);
});

test("application callback origin rejects vercel.com and insecure remote origins", () => {
  assert.match(appUrl, /origin\.hostname === "vercel\.com"/);
  assert.match(appUrl, /origin\.protocol !== "https:"/);
  assert.match(actions, /emailRedirectTo = appUrl\("\/auth\/callback\?next=\/onboarding"\)/);
});

test("successful password update redirects to the confirmed login destination", () => {
  assert.match(actions, /result = await supabase\.auth\.updateUser\(\{ password \}\)/);
  assert.match(actions, /redirect\(destination\("\/login", "success", "password_updated"\)\)/);
});

test("password update categorizes policy, recovery session, rate limit, network, rejected auth, and unknown errors", () => {
  for (const category of [
    "password_policy",
    "recovery_session",
    "rate_limit",
    "network",
    "auth_rejected",
    "unknown",
  ]) {
    assert.match(actions, new RegExp(`"${category}"`));
    assert.match(updatePasswordPage, new RegExp(`${category}:`));
  }

  assert.match(actions, /error\.status === 429/);
  assert.match(actions, /error\.status === 401/);
  assert.match(actions, /error instanceof TypeError/);
});

test("password update logs only safe diagnostic metadata", () => {
  const logger = actions.match(
    /function logPasswordUpdateFailure\([\s\S]*?\n\}/,
  )?.[0] ?? "";

  assert.match(logger, /requestId/);
  assert.match(logger, /operation: "password_update"/);
  assert.match(logger, /category/);
  assert.match(logger, /status/);
  assert.match(logger, /code/);
  assert.doesNotMatch(logger, /email|access.?token|refresh.?token|cookie|session|formData|confirmation/i);
  assert.doesNotMatch(actions, /message: error\.message/);
});
