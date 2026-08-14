import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { selectClass as sharedSelectClass, labelClass } from "@/components/ui/form-control";

export function AdminForm({ title, children }: { title: string; children: ReactNode }) {
  return <Card><CardHeader><h2 className="text-xl font-bold text-slate-950">{title}</h2></CardHeader><CardContent className="space-y-4">{children}</CardContent></Card>;
}

export const selectClass = sharedSelectClass;

export function VerificationFields({ prefix }: { prefix: string }) {
  return <><div><label className={labelClass} htmlFor={`${prefix}-verificationStatus`}>Status verifikasi</label><select id={`${prefix}-verificationStatus`} name="verificationStatus" className={selectClass} defaultValue="unverified"><option value="unverified">Belum terverifikasi</option><option value="verified">Terverifikasi</option></select></div><div><label className={labelClass} htmlFor={`${prefix}-lastVerifiedAt`}>Terakhir diverifikasi</label><input id={`${prefix}-lastVerifiedAt`} name="lastVerifiedAt" type="datetime-local" className={selectClass} /></div><label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-800"><input type="checkbox" name="isDemo" value="true" className="size-4 accent-brand-700" /> Catat sebagai DEMO</label></>;
}
