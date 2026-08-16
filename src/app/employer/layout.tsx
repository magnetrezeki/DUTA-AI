import type { ReactNode } from "react";
import { ModuleSubnav } from "@/components/layout/module-subnav";
import { privatePageMetadata } from "@/lib/seo";
export const metadata = privatePageMetadata;
export default function PrivateLayout({ children }: { children: ReactNode }) { return <div className="flex flex-1 flex-col bg-slate-50"><ModuleSubnav label="Employer workspace" items={[{ href: "/employer/dashboard", label: "Dashboard" }, { href: "/employer/register", label: "Status pendaftaran" }]} action={{ href: "/career", label: "Lihat Karier publik" }} />{children}</div>; }
