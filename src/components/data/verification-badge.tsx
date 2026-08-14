import type { VerificationStatus } from "@/lib/day2/types";
import { Badge } from "@/components/ui/badge";

export function VerificationBadge({ status, isDemo }: { status: VerificationStatus; isDemo: boolean }) {
  if (isDemo) return <Badge tone="warning"><span aria-hidden="true">◇</span> DEMO — bukan data resmi</Badge>;
  return status === "verified"
    ? <Badge tone="verified"><span aria-hidden="true">✓</span> Terverifikasi</Badge>
    : <Badge tone="neutral"><span aria-hidden="true">○</span> Belum terverifikasi</Badge>;
}
