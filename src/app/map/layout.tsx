import type { ReactNode } from "react";
import { ModuleSubnav } from "@/components/layout/module-subnav";

export default function MapLayout({ children }: { children: ReactNode }) { return <div className="flex flex-1 flex-col bg-slate-50"><ModuleSubnav label="DUTA Map" items={[{ href: "/map", label: "Jelajahi tempat" }]} action={{ href: "/map/add", label: "Tambah tempat" }} />{children}</div>; }
