import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/connect", "/news", "/map", "/organizations", "/career", "/ai"], disallow: ["/admin", "/dashboard", "/employer", "/organization-admin", "/onboarding", "/join", "/career/passport", "/career/applications", "/career/saved", "/career/alerts"] }],
    sitemap: appUrl("/sitemap.xml"),
  };
}
