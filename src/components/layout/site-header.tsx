import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <Container className="flex h-16 items-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-700">
          DUTA AI
        </Link>
      </Container>
    </header>
  );
}
