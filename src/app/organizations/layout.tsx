import type { ReactNode } from "react";
import { ModuleSubnav } from "@/components/layout/module-subnav";

export default function OrganizationsLayout({ children }: { children: ReactNode }) { return <div className="flex flex-1 flex-col bg-slate-50"><ModuleSubnav label="Organisasi" items={[{ href: "/organizations", label: "Jelajahi organisasi" }]} action={{ href: "/map", label: "Lihat DUTA Map" }} />{children}</div>; }
