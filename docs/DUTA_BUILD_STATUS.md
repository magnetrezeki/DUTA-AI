# DUTA AI Build Status

Last updated: 8 August 2026

## Current milestone

Day 4 Community OS is complete. Its hosted migration and metadata verification
confirmed all seven tables, required keys and constraints, RLS on every table,
and all 23 intended least-privilege policies. The hosted transaction test passed
with simulated anonymous, member, organization-admin, and platform-moderator
identities and rolled back all test data.

Day 1 authentication, Day 2 Connect and News, and Day 3 Map regression tests
remain passing. Day 4 is closed with no known Critical or High security issue.

**FINAL DAY 4 STATUS: PASS**

## Completed

- Next.js App Router with TypeScript strict mode
- Tailwind CSS configuration and base design tokens
- Reusable layout and UI component directories
- Indonesian metadata and starter landing page
- Environment variable template without credentials
- Project documentation and engineering guidance
- Lint and type-check commands
- Dependency lockfile for reproducible npm installs
- Local development server verified with a successful HTTP response
- Lint, typecheck, and production build verified successfully
- Permanent engineering rules documented for platform architecture, data provenance,
  privacy, security, migrations, reuse, regression protection, and milestone reporting
- Supabase JavaScript and SSR packages installed
- Reusable browser and server Supabase client foundations prepared
- Local Supabase environment placeholders prepared without credentials
- Supabase project connection verified safely with the publishable key
- Email/password registration, login, logout, and password recovery flows
- Protected user dashboard and onboarding flow
- Server-enforced platform admin route protection
- Seven-role user authorization foundation
- Versioned migration for profiles, countries, Malaysia activation, and RLS
- Authorization unit tests and executable database RLS test script
- Hosted `countries` and `profiles` tables verified
- Hosted anonymous profile access verified as denied by PostgreSQL permissions
- Hosted Malaysia configuration and Supabase Auth health verified
- Hosted Day 2 tables and safe public demo reads verified
- Day 2 migration audited with RLS enabled on all six public tables, twelve
  least-privilege policies, expected keys/checks, and no destructive statements
- Day 1 and Day 2 regression/security-definition tests verified
- Hosted Day 2 PostgreSQL transaction test verified public demo reads, member
  write denial, authorized moderator writes, and rollback cleanup
- Final Day 2 security review completed with no known Critical or High issue
- DUTA Map search, category filters, public place details, and browser-only
  nearby-place sorting
- Authenticated place submissions, corrections, reviews, recommendations,
  confirmations, and inaccurate-information reports
- Pending-by-default moderation, duplicate candidate detection, community trust
  labels, and protected admin moderation queues
- All requested map and health category taxonomy without invented place records
- Versioned Day 3 migration with RLS on all seven community tables
- Executable Day 3 PostgreSQL RLS transaction test with rollback cleanup
- Community OS organization directory, pages, claims, memberships, announcements,
  events, registrations, sharing, and QR join links
- Organization-admin dashboard with tenant-scoped server and RLS authorization
- Platform verification workflow and atomic organization-claim approval
- AI Secretary placeholder with no AI integration or data transmission
- Versioned Day 4 migration and executable cross-organization RLS test
- Hosted Day 4 migration and read-only schema verification completed
- Hosted Day 4 RLS/authorization transaction test completed with rollback cleanup
- Organization Admin A verified unable to manage Organization B
- Organization self-verification and unauthorized role promotion verified blocked
- Membership, announcement, event, claim, join-link, and private-data boundaries verified

## Verification

Completed on 8 August 2026:

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- Local application response: PASS
- `npm run test:authz`: PASS (25 tests)
- Day 1 regression tests: PASS
- Day 2 regression tests: PASS
- Day 3 regression tests: PASS
- Day 4 security tests: PASS
- Hosted Day 2 public-table reads: PASS
- Hosted Day 2 PostgreSQL/RLS transaction test: PASS
- Hosted Day 4 migration and seven-table schema verification: PASS
- Hosted Day 4 RLS enabled on all seven tables: PASS
- Hosted Day 4 policy verification (23 policies): PASS
- Hosted Day 4 PostgreSQL/RLS authorization transaction test: PASS
- Public organization route: PASS
- Signed-out admin-route protection: PASS
- Dependency security audit: PASS (0 vulnerabilities)

## Deferred by design

- Executing the separate Day 1 PostgreSQL RLS isolation test
- Live two-user profile isolation test
- Live email delivery and end-to-end password recovery testing
- Day 5 and later modules pending explicit product-owner approval

## Day 3 implementation

- Community data is separate from the Day 2 official-source registry
- New submissions are pending and community-unverified by default
- Public reads are restricted to moderator-approved places and reviews
- Nearby sorting keeps the visitor's precise location in browser memory only
- Place coordinates describe public directory listings, not user locations
- Duplicate candidates are flagged for human review rather than auto-merged
- Member writes are owner-bound and moderation remains country-scoped
- No place, clinic, address, telephone number, or production listing is seeded

## Day 4 implementation

- Organization submissions and claims are pending by default
- Public organization pages expose only approved content and safe public columns
- Memberships, claims, and event registrations remain private
- Approved organization-admin membership is required for every tenant action
- Organization Admin A cannot manage Organization B at the database or action layer
- Organization admins cannot change platform verification or promote new admins
- Join links support local QR generation without an external QR service
- AI Secretary is visibly inactive until a future integration is approved
- No organization, member, announcement, event, or registration data is seeded

## Day 2 implementation

- Shared official-source registry with provenance and verification metadata
- Representative offices, office jurisdictions, service categories, and contact channels
- Location → office → service → verified contact DUTA Connect flow
- Manual official-URL DUTA News flow
- Authorized feed/API integration fields prepared and disabled by default
- Protected admin data-entry screens for Connect and News
- Country-scoped admin database policies and public verified/demo read policies
- Clearly labeled `.invalid` demo records with no invented real KBRI/KJRI data
- PostgreSQL data model and migrations
- Country-specific business modules
- Real production data
- GitHub remote repository and Vercel deployment
- Automated test suite and continuous integration

## Next decision required

The product owner must approve the next development phase before feature or
service integration work begins.
