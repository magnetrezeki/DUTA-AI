import { isIP } from "node:net";
import type { FeedResponseMetadata } from "./types";
import { JIM_RSS_ENDPOINT } from "./types";

export const FETCH_LIMITS = Object.freeze({
  connectTimeoutMs: 5_000,
  totalTimeoutMs: 15_000,
  maxCompressedBytes: 1_048_576,
  maxDecompressedBytes: 2_097_152,
  maxRedirects: 2,
  maxItems: 50,
});

const ALLOWED_MIME = new Set([
  "application/rss+xml",
  "application/atom+xml",
  "application/xml",
  "text/xml",
]);

export class FeedSecurityError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "FeedSecurityError";
  }
}

export function assertApprovedJimUrl(rawUrl: string): URL {
  if (rawUrl !== JIM_RSS_ENDPOINT) throw new FeedSecurityError("URL_NOT_APPROVED");
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new FeedSecurityError("HTTPS_REQUIRED");
  if (url.hostname !== "www.imi.gov.my") throw new FeedSecurityError("HOST_NOT_APPROVED");
  if (url.port && url.port !== "443") throw new FeedSecurityError("PORT_NOT_APPROVED");
  if (url.pathname !== "/index.php/feed/" || url.search || url.hash) {
    throw new FeedSecurityError("PATH_NOT_APPROVED");
  }
  return url;
}

function ipv4Number(address: string): number {
  return address.split(".").reduce((value, part) => (value * 256 + Number(part)) >>> 0, 0);
}

function inV4Range(value: number, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (ipv4Number(base) & mask);
}

export function isPublicInternetAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const value = ipv4Number(address);
    const blocked: Array<[string, number]> = [
      ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
      ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24],
      ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
      ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
    ];
    return !blocked.some(([base, bits]) => inV4Range(value, base, bits));
  }
  if (version === 6) {
    const normalized = address.toLowerCase().split("%")[0];
    if (normalized === "::" || normalized === "::1") return false;
    if (normalized.startsWith("fc") || normalized.startsWith("fd") || /^fe[89ab]/.test(normalized)) return false;
    if (normalized.startsWith("ff") || normalized.startsWith("2001:db8")) return false;
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice(7);
      return isIP(mapped) === 4 && isPublicInternetAddress(mapped);
    }
    return /^[23]/.test(normalized);
  }
  return false;
}

export function assertResolvedAddresses(addresses: readonly string[]): void {
  if (addresses.length === 0) throw new FeedSecurityError("DNS_EMPTY");
  if (!addresses.every(isPublicInternetAddress)) throw new FeedSecurityError("DNS_ADDRESS_BLOCKED");
}

export function assertRedirectChain(redirects: readonly string[], finalUrl: string): void {
  if (redirects.length > FETCH_LIMITS.maxRedirects) throw new FeedSecurityError("TOO_MANY_REDIRECTS");
  for (const redirect of redirects) assertApprovedJimUrl(redirect);
  assertApprovedJimUrl(finalUrl);
}

export function validateFeedResponse(metadata: FeedResponseMetadata, decompressedBytes: number): void {
  if (metadata.status !== 200) throw new FeedSecurityError("HTTP_STATUS_REJECTED");
  assertRedirectChain(metadata.redirects, metadata.finalUrl);
  if (metadata.compressedBytes > FETCH_LIMITS.maxCompressedBytes) throw new FeedSecurityError("COMPRESSED_LIMIT");
  if (decompressedBytes > FETCH_LIMITS.maxDecompressedBytes) throw new FeedSecurityError("DECOMPRESSED_LIMIT");
  const mime = metadata.contentType.split(";", 1)[0].trim().toLowerCase();
  if (!ALLOWED_MIME.has(mime)) throw new FeedSecurityError("MIME_REJECTED");
  const charset = metadata.charset?.toLowerCase() ?? metadata.contentType.match(/charset=([^;\s]+)/i)?.[1]?.toLowerCase();
  if (charset && !["utf-8", "utf8", "us-ascii"].includes(charset)) throw new FeedSecurityError("CHARSET_REJECTED");
  if (metadata.contentEncoding && !["identity", "gzip", "deflate"].includes(metadata.contentEncoding.toLowerCase())) {
    throw new FeedSecurityError("COMPRESSION_REJECTED");
  }
}
