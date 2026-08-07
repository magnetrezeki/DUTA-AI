# DUTA AI Engineering Guide

## Product boundaries

- DUTA AI serves Indonesians living abroad. It is Malaysia-first for Phase 1,
  but every module, schema, route, and configuration must be multi-country by design.
- Keep country-specific behavior configurable and avoid hard-coding Malaysia-only
  assumptions when a reusable country-aware design is appropriate.
- Do not add advanced modules, production data, credentials, or external service
  integrations without explicit product-owner approval.

## Approved platform architecture

- Use Next.js App Router with TypeScript strict mode.
- PostgreSQL is the primary relational database.
- Supabase will provide the managed PostgreSQL database, authentication, and file storage.
- Vercel will host the application.
- Use versioned database migrations for every database schema change. Never make
  undocumented manual production schema changes.
- Do not create duplicate database tables. Extend or normalize the existing data
  model when it safely represents the same domain concept.

## Data integrity and provenance

- Never invent, infer, or present unverified government information as fact.
- Never invent KBRI or KJRI telephone numbers or other official contact details.
- Never invent jobs, employers, clinics, events, addresses, or directory listings.
- Official data must include its source and an explicit verification status.
- Community-submitted or community-maintained data must be stored and displayed
  separately from official data and clearly labeled as community data.
- If reliable information or a source is unavailable, show that it is unavailable
  or unverified instead of filling the gap with plausible content.

## Privacy and security

- Career Passport data is private by default. Access requires explicit user action
  and the minimum permissions necessary for the requested purpose.
- Never publicly expose a user's precise location. Use a coarser area only when the
  feature genuinely needs location context and the user has consented.
- Enforce authentication and authorization server-side for every protected action
  and data request. Client-side visibility checks are not security controls.
- Never expose secrets, private credentials, or Supabase service-role keys in
  browser code, public environment variables, logs, or committed files.
- Variables prefixed with `NEXT_PUBLIC_` are browser-visible and must contain only
  values that are safe to disclose publicly.

## Engineering standards

- Use Tailwind CSS for styling alongside Next.js and TypeScript.
- Prefer Server Components; add `use client` only when browser interactivity needs it.
- Put reusable UI in `src/components/ui` and shared page chrome in
  `src/components/layout`.
- Keep configuration in `src/config`.
- Design accessible, responsive interfaces with Indonesian as the default locale.
- Avoid fake production content. Clearly label placeholders and development-only data.
- Do not duplicate routes or components unnecessarily. Reuse or extend an existing
  route or component when responsibilities and behavior are substantially the same.
- Preserve working features when adding or changing modules. Check affected flows,
  maintain backward compatibility where required, and avoid unrelated regressions.

## Required verification

After every important change and before handing it off, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Update `docs/DUTA_BUILD_STATUS.md` after each completed milestone and whenever a
deferred item's status changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
