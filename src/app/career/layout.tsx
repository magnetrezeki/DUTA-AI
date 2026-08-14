import type { ReactNode } from "react";
import { ModuleSubnav } from "@/components/layout/module-subnav";

const items = [
  { href: "/career", label: "Cari kerja" },
  { href: "/career/saved", label: "Tersimpan" },
  { href: "/career/applications", label: "Lamaran" },
  { href: "/career/alerts", label: "Alerts" },
  { href: "/career/passport", label: "Career Passport" },
] as const;

export default function CareerLayout({ children }: { children: ReactNode }) { return <div className="flex flex-1 flex-col bg-slate-50"><ModuleSubnav label="DUTA Karier" items={items} action={{ href: "/employer/register", label: "Untuk pemberi kerja" }} />{children}</div>; }
