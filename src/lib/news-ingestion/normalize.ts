import { createHash } from "node:crypto";
import { FeedSecurityError } from "./fetch-security";
import type { DryRunResult, NormalizedNewsCandidate, ParsedFeedItem } from "./types";
import { JIM_RSS_ENDPOINT, JIM_SOURCE_ID } from "./types";

const TRACKING_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "fbclid", "gclid"]);

export function canonicalizeNewsUrl(rawUrl: string): string {
  if (/\s|[\u0000-\u001f\u007f]/.test(rawUrl)) throw new FeedSecurityError("ARTICLE_URL_INVALID");
  const match = rawUrl.match(/^(https?):\/\/([^/?#]+)([^#]*)/i);
  if (!match) throw new FeedSecurityError("ARTICLE_URL_INVALID");
  const scheme = match[1].toLowerCase();
  const authority = match[2];
  if (authority.includes("@") || !/^[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/.test(authority)) throw new FeedSecurityError("ARTICLE_URL_INVALID");
  const portMatch = authority.match(/:(\d{1,5})$/);
  const hostname = (portMatch ? authority.slice(0, -(portMatch[0].length)) : authority).toLowerCase();
  if (hostname.length > 253 || hostname.startsWith(".") || hostname.endsWith(".") || hostname.includes("..")) throw new FeedSecurityError("ARTICLE_URL_INVALID");
  for (const label of hostname.split(".")) if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)) throw new FeedSecurityError("ARTICLE_URL_INVALID");
  let port = portMatch?.[1] ?? null;
  if (port && (Number(port) < 1 || Number(port) > 65535)) throw new FeedSecurityError("ARTICLE_URL_INVALID");
  if ((scheme === "http" && port === "80") || (scheme === "https" && port === "443")) port = null;
  const remainder = match[3] || "/";
  const question = remainder.indexOf("?");
  const path = (question >= 0 ? remainder.slice(0, question) : remainder) || "/";
  const query = question >= 0 ? remainder.slice(question + 1) : null;
  const kept = query === null ? [] : query.split("&").filter((pair) => !TRACKING_KEYS.has(pair.split("=", 1)[0].toLowerCase()));
  return `${scheme}://${hostname}${port ? `:${port}` : ""}${path}${kept.length ? `?${kept.join("&")}` : ""}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function normalizeFeedItem(item: ParsedFeedItem, retrievedAt: string): NormalizedNewsCandidate {
  const canonicalUrl = item.link ? canonicalizeNewsUrl(item.link) : null;
  const contentFingerprint = sha256([JIM_SOURCE_ID, item.title, canonicalUrl ?? "", item.publishedAt ?? "", item.description, item.author ?? "", item.categories.join("\u001f")].join("\n"));
  const externalIdentity = item.guid ? `guid:${sha256(`${JIM_SOURCE_ID}\n${item.guid}`)}` : canonicalUrl ? `url:${sha256(`${JIM_SOURCE_ID}\n${canonicalUrl}`)}` : `sha256:${contentFingerprint}`;
  return {
    sourceId: JIM_SOURCE_ID,
    externalIdentity,
    identityKind: item.guid ? "GUID" : canonicalUrl ? "CANONICAL_URL" : "FINGERPRINT",
    originalUrl: item.link,
    canonicalUrl,
    title: item.title,
    publishedAt: item.publishedAt,
    retrievedAt,
    summary: item.description,
    contentFingerprint,
    ingestionMethod: "RSS",
    provenance: { sourceEndpoint: JIM_RSS_ENDPOINT, firstParty: true, editorialStatus: "FETCHED", persistenceEligibility: canonicalUrl ? "ELIGIBLE" : "REVIEW_REQUIRED" },
  };
}

export function deduplicateCandidates(candidates: NormalizedNewsCandidate[]): DryRunResult {
  const accepted: NormalizedNewsCandidate[] = [];
  const identities = new Map<string, NormalizedNewsCandidate>();
  const urls = new Set<string>();
  let duplicates = 0;
  let conflicts = 0;
  for (const candidate of candidates) {
    const prior = identities.get(candidate.externalIdentity);
    if (prior) {
      if (prior.canonicalUrl === candidate.canonicalUrl && prior.contentFingerprint === candidate.contentFingerprint) duplicates += 1;
      else conflicts += 1;
      continue;
    }
    if (candidate.canonicalUrl && urls.has(candidate.canonicalUrl)) { duplicates += 1; continue; }
    identities.set(candidate.externalIdentity, candidate);
    if (candidate.canonicalUrl) urls.add(candidate.canonicalUrl);
    accepted.push(candidate);
  }
  return { accepted, duplicates, conflicts, rejected: conflicts };
}
