import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const metadataBase = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "DUTA AI",
    template: "%s | DUTA AI",
  },
  description:
    "Platform digital tepercaya untuk masyarakat Indonesia di luar negeri.",
  icons: { icon: "/brand/duta-rantau-mark.webp", apple: "/brand/duta-rantau-mark.webp" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "DUTA AI",
    title: "DUTA AI",
    description: "Informasi tepercaya untuk masyarakat Indonesia di luar negeri.",
    images: [{ url: "/brand/duta-rantau-brand.webp", width: 1254, height: 1254, alt: "DUTA Rantau" }],
  },
  twitter: { card: "summary", title: "DUTA AI", description: "Informasi tepercaya untuk masyarakat Indonesia di luar negeri." },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <a href="#main-content" className="fixed left-4 top-3 z-[200] -translate-y-24 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition-transform focus:translate-y-0">Lewati ke konten utama</a>
        <SiteHeader />
        <div id="main-content" className="flex min-h-0 flex-1 flex-col" tabIndex={-1}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
