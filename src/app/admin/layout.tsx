import type { ReactNode } from "react";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { privatePageMetadata } from "@/lib/seo";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export const metadata = privatePageMetadata;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  return <><AdminNavigation />{children}</>;
}
