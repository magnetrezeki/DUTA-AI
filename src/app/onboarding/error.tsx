"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function OnboardingError({ reset }: { reset: () => void }) {
  return <ModuleError title="Onboarding belum dapat dibuka" description="Data profil Anda tidak diubah. Silakan coba lagi." reset={reset} />;
}
