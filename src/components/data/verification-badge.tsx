import type { VerificationStatus } from "@/lib/day2/types";

export function VerificationBadge({
  status,
  isDemo,
}: {
  status: VerificationStatus;
  isDemo: boolean;
}) {
  if (isDemo) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
        DEMO — bukan data resmi
      </span>
    );
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        status === "verified"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-200 text-slate-700"
      }`}
    >
      {status === "verified" ? "Terverifikasi" : "Belum terverifikasi"}
    </span>
  );
}
