"use client";

import { useFormStatus } from "react-dom";

export function RegistrationSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Mendaftarkan..." : "Daftar"}
    </button>
  );
}
