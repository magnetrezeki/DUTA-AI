import type { ReactNode } from "react";

export function AdminForm({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export const selectClass = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950";

export function VerificationFields({ prefix }: { prefix: string }) {
  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-slate-800" htmlFor={`${prefix}-verificationStatus`}>Status verifikasi</label>
        <select id={`${prefix}-verificationStatus`} name="verificationStatus" className={selectClass} defaultValue="unverified">
          <option value="unverified">Belum terverifikasi</option>
          <option value="verified">Terverifikasi</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800" htmlFor={`${prefix}-lastVerifiedAt`}>Terakhir diverifikasi</label>
        <input id={`${prefix}-lastVerifiedAt`} name="lastVerifiedAt" type="datetime-local" className={selectClass} />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <input type="checkbox" name="isDemo" value="true" /> Catat sebagai DEMO
      </label>
    </>
  );
}
