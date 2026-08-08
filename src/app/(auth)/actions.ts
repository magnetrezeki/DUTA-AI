"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

async function requestOrigin() {
  const requestHeaders = await headers();
  return requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
}

export async function register(formData: FormData) {
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

  const origin = await requestOrigin();

  if (!origin) {
    redirect(destination("/register", "error", "registration_failed"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    console.error("[auth.register] Supabase signUp failed", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    redirect(destination("/register", "error", "registration_failed"));
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

  const origin = await requestOrigin();

  if (!origin) {
    redirect(destination("/forgot-password", "error", "reset_failed"));
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(destination("/login", "error", "reset_session_expired"));
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(destination("/update-password", "error", "reset_failed"));
  }

  redirect(destination("/login", "success", "password_updated"));
}
