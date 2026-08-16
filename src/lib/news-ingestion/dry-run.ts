import { readFile } from "node:fs/promises";
import { validateFeedResponse } from "./fetch-security";
import { deduplicateCandidates, normalizeFeedItem } from "./normalize";
import { parseBoundedFeed } from "./rss-parser";
import type { DryRunResult, FeedResponseMetadata } from "./types";

export async function runLocalNewsDryRun(
  fixturePath: string,
  metadata: FeedResponseMetadata,
  retrievedAt: string,
): Promise<DryRunResult> {
  const bytes = await readFile(fixturePath);
  validateFeedResponse(metadata, bytes.byteLength);
  const parsed = parseBoundedFeed(bytes);
  return deduplicateCandidates(parsed.map((item) => normalizeFeedItem(item, retrievedAt)));
}
