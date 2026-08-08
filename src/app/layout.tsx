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
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "DUTA AI",
    title: "DUTA AI",
    description: "Informasi tepercaya untuk masyarakat Indonesia di luar negeri.",
  },
  twitter: { card: "summary", title: "DUTA AI", description: "Informasi tepercaya untuk masyarakat Indonesia di luar negeri." },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
