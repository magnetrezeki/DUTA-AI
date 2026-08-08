import type { ReactNode } from "react";
import { requirePlatformAdmin } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  return children;
}
