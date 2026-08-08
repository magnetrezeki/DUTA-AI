# DUTA AI Production Release Checklist

Status: **CONDITIONAL GO** — local release hardening is complete, but the manual
pre-launch conditions below must be closed before public launch.

## Release blockers to close manually

- [ ] Create or select the production Vercel project and configure all required variables.
- [ ] Set the final production application URL in Vercel and the matching Supabase Auth Site URL/redirect allowlist.
- [ ] Review and remove the clearly labelled Day 2 `.invalid` DEMO records from the production database. Do not replace them with unverified real-world data.
- [ ] Verify Supabase backup availability and create a pre-launch backup/snapshot using the options available on the project plan.
- [ ] Complete a smoke test on the final Vercel URL using one ordinary member, one organization admin, and one employer test account.

## Environment inventory

| Name | Purpose | Exposure | Requirement | Development | Preview | Production |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical application URL used for metadata, links, and auth email redirects | PUBLIC | REQUIRED | Local URL | Exact Preview URL | Final HTTPS URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | PUBLIC | REQUIRED | Development project | Intended Preview project | Production project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase browser-safe publishable key; RLS remains the security boundary | PUBLIC | REQUIRED | Development | Preview | Production |
| `OPENAI_API_KEY` | Optional future server-side language-provider credential | SERVER_SECRET | OPTIONAL | Leave blank | Leave blank unless approved | Leave blank until approved |

Server secrets must never use a `NEXT_PUBLIC_` prefix. DUTA AI Day 6 works without
`OPENAI_API_KEY`; no key is required for the current read-only deterministic MVP.

## Security acceptance

- [x] `.env` and `.env.local` are ignored and not tracked.
- [x] No OpenAI, Supabase secret/service-role, password, or access token is tracked.
- [x] Admin, employer, and organization administration is authorized server-side.
- [x] Career Passport, applications, saved jobs, alerts, memberships, and registrations remain private through RLS.
- [x] DUTA AI uses a fixed read-only tool registry and cannot run arbitrary SQL.
- [x] Prompt injection cannot change tool authorization.
- [x] Precise visitor location remains browser-only.
- [x] External URLs are HTTPS-constrained where stored and open in a separate context without opener access.
- [x] No file-upload feature is enabled. Private storage must be designed before uploads are introduced.
- [x] Baseline browser security headers are configured.
- [x] Production dependency audit reports zero vulnerabilities.
- [ ] Platform-level rate limits should be reviewed before enabling a paid AI provider or high-volume integration. Supabase Auth protections remain the current auth control.

## Critical journey smoke tests

Run these on Preview, then repeat the most important paths on Production.

1. **New user:** register → confirm email → login → onboarding → dashboard/profile.
2. **Connect:** choose Malaysia location → choose service → view contact → open official source; confirm DEMO is never mistaken for official.
3. **News:** browse published entries → inspect verification label → open official URL/source.
4. **Map/Health:** search → filter → view place → verify community warning → sign in and submit a pending contribution; location permission must remain local.
5. **Community:** find organization → request membership → view published announcements → register for event.
6. **Career:** search → view → save → open private Career Passport → apply → track application.
7. **Employer:** open authorized dashboard → create pending job → confirm only that employer's applicants are visible.
8. **DUTA AI:** test official, job, place, and community queries; test missing data, provider unavailable, and an instruction-bypass prompt.
9. **Admin:** confirm signed-out/member denial, then test authorized moderation and official-data management.

Record the date, tester, environment, result, and evidence for each journey. Never
include passwords, tokens, CV contents, or private user data in evidence.

## Demo and placeholder audit

### Safe development-only material

- `.env.example` placeholders with blank values.
- Day 4 inactive AI Secretary interface placeholder; it transmits no data.
- Day 5 inactive SISKOP2MI adapter; it performs no scraping or network call.
- Tests that use fixed fake UUIDs inside rolled-back transactions.

### Must remove before production

- Day 2 seeded records labelled `DEMO` with `https://example.invalid/...` URLs.
  They are safe and clearly labelled for development, but should not appear in a public launch database.

### Review required

- Any content entered manually after migrations. Confirm official records have a source,
  verification status, and last-verified date; community records must remain labelled separately.

## SEO and public/private separation

- Public indexable routes: `/`, `/connect`, `/news`, `/map`, `/organizations`, `/career`, `/ai`.
- Private/protected routes are disallowed in `robots.txt` and carry `noindex` metadata.
- Public dynamic detail pages inherit site metadata. Add record-specific share images only after verified production branding/assets are approved.
- Recheck canonical URLs after the final domain is known; `NEXT_PUBLIC_APP_URL` is the source of truth.

## Final go/no-go gate

Production may change from **CONDITIONAL GO** to **GO** only after every release
blocker above is checked, Preview smoke tests pass, backup status is verified, and
the production URL contains no development DEMO records.
