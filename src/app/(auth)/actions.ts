"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/app-url";
import {
  classifyAuthError,
  classifyThrownAuthError,
  safeAuthErrorCode,
  type RegistrationErrorCategory,
} from "@/lib/auth/registration-errors";

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function rawFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function destination(path: string, key: "error" | "success", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return `${path}?${params.toString()}`;
}

function logRegistrationFailure(
  requestId: string,
  category: RegistrationErrorCategory,
  code: string,
) {
  console.error(
    `[auth.register] signup failed ${JSON.stringify({ requestId, category, code })}`,
  );
}

type PasswordUpdateErrorCategory =
  | "password_policy"
  | "recovery_session"
  | "rate_limit"
  | "network"
  | "auth_rejected"
  | "unknown";

type PasswordUpdateErrorLike = {
  code?: string;
  message?: string;
  name?: string;
  status?: number;
};

function classifyPasswordUpdateError(
  error: PasswordUpdateErrorLike,
): PasswordUpdateErrorCategory {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";

  if (error.status === 429 || code.includes("rate_limit")) return "rate_limit";
  if (
    code.includes("password") ||
    code === "validation_failed" ||
    message.includes("password")
  ) {
    return "password_policy";
  }
  if (
    error.status === 401 ||
    code.includes("session") ||
    code.includes("token") ||
    code.includes("jwt") ||
    code.includes("otp") ||
    code.includes("recovery")
  ) {
    return "recovery_session";
  }
  if (error.status === 400 || error.status === 403) return "auth_rejected";
  return "unknown";
}

function classifyThrownPasswordUpdateError(
  error: unknown,
): PasswordUpdateErrorCategory {
  if (error instanceof TypeError) return "network";
  if (error && typeof error === "object" && "name" in error) {
    const name = String(error.name);
    if (name === "AuthRetryableFetchError" || name === "FetchError") {
      return "network";
    }
  }
  return "unknown";
}

function safeAuthErrorStatus(error: PasswordUpdateErrorLike) {
  return typeof error.status === "number" && Number.isInteger(error.status)
    ? error.status
    : null;
}

function logPasswordUpdateFailure(
  requestId: string,
  category: PasswordUpdateErrorCategory,
  status: number | null,
  code: string,
) {
  console.error(
    `[auth.recovery] operation failed ${JSON.stringify({
      requestId,
      operation: "password_update",
      category,
      status,
      code,
    })}`,
  );
}

export async function register(formData: FormData) {
  const requestId = crypto.randomUUID();
  const displayName = formValue(formData, "displayName");
  const email = formValue(formData, "email").toLowerCase();
  const password = rawFormValue(formData, "password");

  if (displayName.length < 2 || displayName.length > 100) {
    redirect(destination("/register", "error", "invalid_name"));
  }

  if (!validEmail(email)) {
    redirect(destination("/register", "error", "invalid_email"));
  }

  if (!validPassword(password)) {
    redirect(destination("/register", "error", "weak_password"));
  }

  let emailRedirectTo: string;
  try {
    emailRedirectTo = appUrl("/auth/callback?next=/onboarding");
  } catch {
    logRegistrationFailure(requestId, "invalid_redirect", "invalid_app_url");
    redirect(destination("/register", "error", "invalid_redirect"));
  }

  const supabase = await createClient();
  let result: Awaited<ReturnType<typeof supabase.auth.signUp>>;
  try {
    result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo,
      },
    });
  } catch (error) {
    const category = classifyThrownAuthError(error);
    logRegistrationFailure(requestId, category, "request_failed");
    redirect(destination("/register", "error", category));
  }

  const { data, error } = result;

  if (error) {
    const category = classifyAuthError(error);
    logRegistrationFailure(requestId, category, safeAuthErrorCode(error));
    redirect(destination("/register", "error", category));
  }

  if (data.user?.identities?.length === 0) {
    logRegistrationFailure(requestId, "existing_account", "identity_not_created");
    redirect(destination("/register", "error", "existing_account"));
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect(destination("/login", "success", "check_email"));
}

export async function login(formData: FormData) {
  const email = formValue(formData, "email").toLowerCase();
  const password = rawFormValue(formData, "password");

  if (!validEmail(email) || !password) {
    redirect(destination("/login", "error", "invalid_credentials"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(destination("/login", "error", "invalid_credentials"));
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = formValue(formData, "email").toLowerCase();

  if (!validEmail(email)) {
    redirect(destination("/forgot-password", "error", "invalid_email"));
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl("/auth/callback?next=/update-password"),
  });

  redirect(destination("/forgot-password", "success", "check_email"));
}

export async function updatePassword(formData: FormData) {
  const password = rawFormValue(formData, "password");
  const confirmation = rawFormValue(formData, "passwordConfirmation");

  if (!validPassword(password)) {
    redirect(destination("/update-password", "error", "weak_password"));
  }

  if (password !== confirmation) {
    redirect(destination("/update-password", "error", "password_mismatch"));
  }

  const requestId = crypto.randomUUID();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logPasswordUpdateFailure(
      requestId,
      "recovery_session",
      null,
      "user_not_found",
    );
    redirect(destination("/update-password", "error", "recovery_session"));
  }

  let result: Awaited<ReturnType<typeof supabase.auth.updateUser>>;
  try {
    result = await supabase.auth.updateUser({ password });
  } catch (error) {
    const category = classifyThrownPasswordUpdateError(error);
    logPasswordUpdateFailure(requestId, category, null, "request_failed");
    redirect(destination("/update-password", "error", category));
  }

  const { error } = result;

  if (error) {
    const category = classifyPasswordUpdateError(error);
    logPasswordUpdateFailure(
      requestId,
      category,
      safeAuthErrorStatus(error),
      safeAuthErrorCode(error),
    );
    redirect(destination("/update-password", "error", category));
  }

  redirect(destination("/login", "success", "password_updated"));
}
