export const JIM_SOURCE_ID = "72000000-0000-0000-0000-000000000001";
export const JIM_RSS_ENDPOINT = "https://www.imi.gov.my/index.php/feed/";

export type FeedResponseMetadata = {
  status: number;
  contentType: string;
  contentEncoding?: string;
  charset?: string;
  compressedBytes: number;
  finalUrl: string;
  redirects: string[];
};

export type ParsedFeedItem = {
  guid: string | null;
  title: string;
  link: string | null;
  publishedAt: string | null;
  description: string;
  author: string | null;
  categories: string[];
};

export type NormalizedNewsCandidate = {
  sourceId: typeof JIM_SOURCE_ID;
  externalIdentity: string;
  identityKind: "GUID" | "CANONICAL_URL" | "FINGERPRINT";
  originalUrl: string | null;
  canonicalUrl: string | null;
  title: string;
  publishedAt: string | null;
  retrievedAt: string;
  summary: string;
  contentFingerprint: string;
  ingestionMethod: "RSS";
  provenance: {
    sourceEndpoint: typeof JIM_RSS_ENDPOINT;
    firstParty: true;
    editorialStatus: "FETCHED";
    persistenceEligibility: "ELIGIBLE" | "REVIEW_REQUIRED";
  };
};

export type DryRunResult = {
  accepted: NormalizedNewsCandidate[];
  duplicates: number;
  conflicts: number;
  rejected: number;
};
