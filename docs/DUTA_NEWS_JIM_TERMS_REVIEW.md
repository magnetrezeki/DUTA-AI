# JIM RSS pilot terms-review checklist

Status: **REQUIRED**. Public availability does not itself establish reuse permission.

- [ ] Record evidence that `https://www.imi.gov.my/index.php/feed/` is a public, first-party JIM RSS endpoint.
- [ ] Review current JIM website terms, copyright notice, robots policy, and any feed-specific policy.
- [ ] Confirm metadata-only storage: title, bounded plain-text summary, dates, attribution, identifiers, and original URL.
- [ ] Confirm that no full article body, raw feed HTML, image copy, or thumbnail auto-publication is permitted.
- [ ] Define a reasonable polling interval and conditional-request/backoff behavior.
- [ ] Record required publisher attribution and ensure the original JIM URL is always preserved.
- [ ] Define retention for raw fetch bytes (recommended: none) and operational logs (bounded, no content bodies).
- [ ] Record reviewer identity, review time, evidence URLs, and final PASS/REJECTED decision.
- [ ] Keep `news_ingestion_authorized=false` and integration status HOLD until this review is approved.

This checklist is not permission and does not mark the terms review as PASS.
