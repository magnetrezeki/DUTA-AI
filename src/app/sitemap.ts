import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/connect", "/news", "/map", "/organizations", "/career", "/ai"].map((path) => ({ url: appUrl(path), changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 }));
}
