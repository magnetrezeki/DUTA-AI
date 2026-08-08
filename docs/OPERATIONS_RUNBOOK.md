# DUTA AI Operations Runbook

## Daily monitoring checklist

- Review Vercel deployment status and recent server errors.
- Review Supabase Auth, API, and PostgreSQL logs for repeated failures or denied operations.
- Review DUTA AI metadata logs: request ID, intent, selected tool, result, latency,
  source count, provider status, and safe error category.
- Confirm official sources due for re-verification and records missing a last-verified date.
- Review moderation queues for Map, organizations, employers, jobs, and reports.
- Look for unusual repeated login, reset, submission, or AI requests. Do not copy private payloads into tickets.

Never log passwords, access/refresh tokens, service-role keys, full CV documents,
Career Passport content, precise visitor location, or unnecessary private data.

## Recommended monitoring stack

- **Vercel Logs:** first line of investigation for deployment and Server Action failures.
- **Vercel Analytics:** optional, privacy-reviewed traffic and performance visibility; enable only after consent/privacy review.
- **Supabase Logs:** authentication, API, PostgreSQL, RLS denial, and database health.
- **Error monitoring:** begin with platform logs. Add a third-party service only if error volume requires it and configure strict redaction.
- **AI usage:** retain metadata counters only. Do not retain prompts by default.
- **Security events:** record request ID, actor ID where appropriate, action class,
  result, and timestamp—not credentials or protected record contents.

## Incident response

1. Identify environment, deployment commit, affected route, time window, and request ID.
2. Protect users first: disable only the affected integration or route if necessary; never disable RLS.
3. Check Vercel and Supabase logs without exporting private content.
4. If a credential may be exposed, rotate it in the provider, update Vercel securely, and redeploy. Never commit the replacement.
5. If data integrity may be affected, stop writes to the affected workflow and preserve logs/backup evidence.
6. Document cause, scope, correction, verification, and prevention.

## Backup and recovery

Backup status is **NOT YET MANUALLY VERIFIED**. Availability and retention depend on
the Supabase project plan and settings.

Before launch or any migration:

1. In Supabase, review **Database → Backups** (wording may vary by plan).
2. Confirm the latest successful backup, retention period, and point-in-time recovery availability.
3. Create an approved pre-launch backup/snapshot using the Supabase-supported mechanism.
4. Record timestamp, project, responsible person, and retention without recording credentials.
5. Test restore in an isolated non-production project. Never overwrite production merely to test restoration.

Critical data includes Auth users/identities, profiles/countries, official sources and
contacts, news, Map/community contributions and moderation, organizations/memberships/
events, employers/jobs/applications, private Career Passports, saved jobs, and alerts.
Storage objects are not currently used; when uploads are introduced, private buckets,
object policies, malware/content controls, retention, and backup must be designed first.

## Common user-facing failures

- **Network/Supabase unavailable:** global recovery screen; retry and platform-log review.
- **Expired session/permission denied:** redirect to login or safe denial route; never reveal authorization internals.
- **Invalid form:** return a localized validation message without echoing secrets.
- **Missing official data/job/place:** display unavailable/not-found; never invent a replacement.
- **AI provider unavailable:** deterministic/read-only fallback remains available; no fabricated answer.
- **404:** localized not-found page with a safe route home.
- **Unexpected 500:** localized error boundary with retry; internal stack is not shown.

## Rollback

- Application rollback: use Vercel to redeploy the last known-good commit.
- Database rollback: use a reviewed forward repair migration whenever possible. Do not
  run destructive resets. Restore from backup only under an approved incident plan.
- After rollback, rerun authentication, public data, admin denial, tenant isolation,
  Career privacy, and DUTA AI safety smoke tests.
