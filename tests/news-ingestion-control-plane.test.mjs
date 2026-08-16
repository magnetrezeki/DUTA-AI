import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/202608120001_news_ingestion_control_plane.sql", import.meta.url),
  "utf8",
);
const hostedTest = readFileSync(
  new URL("../supabase/tests/news_ingestion_control_plane_hosted_rls_test.sql", import.meta.url),
  "utf8",
);
const preflight = readFileSync(
  new URL("../supabase/tests/news_ingestion_control_plane_preflight.sql", import.meta.url),
  "utf8",
);

const has = (pattern) => assert.match(migration, pattern);
const lacks = (pattern) => assert.doesNotMatch(migration, pattern);

test("control-plane migration is transactional and additive", () => {
  has(/^begin;/i);
  has(/commit;\s*$/i);
  lacks(/^\s*(delete|truncate|drop table|drop column|alter table .* disable row level security)\b/im);
  assert.equal([...migration.matchAll(/create table public\.news_ingestion_runs/gi)].length, 1);
});

test("frozen control-plane enums are exact", () => {
  for (const values of [
    ["RUNNING", "SUCCEEDED", "FAILED", "ABANDONED"],
    ["MANUAL", "SCHEDULED", "RETRY"],
    ["NETWORK", "TIMEOUT", "HTTP", "SECURITY", "MIME", "PARSER", "PAYLOAD_LIMIT", "INTERNAL"],
    ["PENDING", "PASS", "REJECTED"],
    ["READY", "DEGRADED", "HOLD"],
  ]) for (const value of values) has(new RegExp(`'${value}'`));
});

test("existing integrations receive fail-closed approved extensions", () => {
  has(/terms_review_status public\.news_terms_review_status not null default 'PENDING'/i);
  has(/operational_status public\.news_integration_operational_status not null default 'HOLD'/i);
  has(/consecutive_failures integer not null default 0/i);
  has(/terms_review_status = 'PASS'/i);
  has(/operational_status in \('READY', 'DEGRADED'\)/i);
  lacks(/set\s+(news_ingestion_authorized|enabled)\s*=\s*true/i);
});

test("run ledger enforces bounded lifecycle and safe counters", () => {
  for (const pattern of [
    /attempt_number between 1 and 4/i,
    /http_status is null or http_status between 100 and 599/i,
    /items_accepted \+ items_duplicate \+ items_rejected <= items_seen/i,
    /char_length\(endpoint_snapshot\) between 1 and 2048/i,
    /endpoint_snapshot ~ '\^https:\/\/'/i,
    /char_length\(safe_error_message\) <= 500/i,
    /status = 'RUNNING'[\s\S]*finished_at is null/i,
    /status = 'SUCCEEDED'[\s\S]*error_class is null/i,
    /status = 'FAILED'[\s\S]*error_class is not null/i,
    /status = 'ABANDONED'[\s\S]*error_class is not null/i,
  ]) has(pattern);
  lacks(/response_body|authorization_header|access_token|refresh_token|cookie|session/i);
});

test("source and integration history cannot diverge or cascade away", () => {
  has(/unique \(id, source_id\)/i);
  has(/foreign key \(integration_id, source_id\)[\s\S]*references public\.news_source_integrations\(id, source_id\)[\s\S]*on delete restrict on update restrict/i);
  has(/source_id uuid not null references public\.official_sources\(id\)[\s\S]*on delete restrict on update restrict/i);
  lacks(/on delete cascade/i);
});

test("one active run and lease acquisition are database enforced", () => {
  has(/create unique index news_ingestion_runs_one_running_idx[\s\S]*where status = 'RUNNING'/i);
  has(/from public\.news_source_integrations integration[\s\S]*for update/i);
  has(/NEWS_INGESTION_ACTIVE_LEASE/);
  has(/set status = 'ABANDONED'/i);
  has(/interval '5 minutes'/i);
});

test("worker lifecycle fails closed against source and integration gates", () => {
  has(/not integration_row\.enabled/i);
  has(/not integration_row\.authorization_verified/i);
  has(/integration_row\.terms_review_status <> 'PASS'/i);
  has(/integration_row\.operational_status = 'HOLD'/i);
  has(/not private\.is_news_integration_authorized\(integration_row\.source_id\)/i);
  for (const gate of [
    /source\.news_enabled is true/i,
    /source\.news_ingestion_authorized is true/i,
    /source\.enabled is true/i,
    /source\.registry_status = 'VERIFIED'/i,
    /source\.verification_level in \('A', 'B'\)/i,
    /source\.verification_status = 'verified'/i,
    /source\.last_verified_at is not null/i,
    /source\.is_active is true/i,
    /source\.is_demo is false/i,
  ]) has(gate);
  has(/NEWS_INGESTION_GATE_DENIED/);
  has(/NEWS_INGESTION_SOURCE_GATE_DENIED/);
  lacks(/target_endpoint|requested_endpoint|source_url text/i);
});

test("hosted compatibility preflight is SELECT-only and reports enabled integrations", () => {
  assert.match(preflight, /^with\s+/i);
  assert.match(preflight, /enabled_rss_count/i);
  assert.match(preflight, /enabled_api_count/i);
  assert.match(preflight, /proposed_constraint_violation_count/i);
  assert.match(preflight, /REQUIRES_SEPARATE_REVIEWED_TRANSITION_PLAN/i);
  assert.doesNotMatch(preflight, /^\s*(insert|update|delete|create|alter|drop|truncate|grant|revoke)\b/im);
});

test("security-definer functions have fixed paths and no client execute grant", () => {
  assert.equal([...migration.matchAll(/security definer/gi)].length, 3);
  assert.equal([...migration.matchAll(/security definer\s+set search_path = ''/gi)].length, 3);
  assert.equal([...migration.matchAll(/revoke all on function private\./gi)].length, 3);
  lacks(/grant execute on function private\.(acquire|renew|complete)_news_ingestion/i);
});

test("run ledger RLS provides scoped administrative reads and no browser writes", () => {
  has(/alter table public\.news_ingestion_runs enable row level security/i);
  has(/for select to authenticated[\s\S]*private\.can_manage_news_source\(source_id\)/i);
  has(/revoke all on public\.news_ingestion_runs from public, anon, authenticated/i);
  has(/grant select on public\.news_ingestion_runs to authenticated/i);
  lacks(/grant (insert|update|delete)[^;]*news_ingestion_runs/i);
  lacks(/policy[^;]+news_ingestion_runs[^;]+for (insert|update|delete|all)/i);
});

test("migration contains no pilot activation, schedules, fetchers or source mutation", () => {
  lacks(/72000000-0000-0000-0000-000000000001/);
  lacks(/www\.imi\.gov\.my|index\.php\/feed/i);
  lacks(/cron|edge function|http_get|net\.http|fetch\(/i);
  lacks(/insert into public\.(official_sources|news_source_integrations|news_items|official_source_items)/i);
  lacks(/update public\.(official_sources|news_source_integrations|news_items|official_source_items)/i);
});

test("hosted test is one rollback-only transaction", () => {
  assert.match(hostedTest, /^begin;/i);
  assert.match(hostedTest, /rollback;\s*$/i);
  assert.doesNotMatch(hostedTest, /\bcommit\b/i);
  assert.doesNotMatch(hostedTest, /^\s*(create|alter|drop|grant|revoke|truncate)\b/im);
});

test("hosted test covers roles, leases, gates, history and public regression", () => {
  for (const marker of [
    "anon unexpectedly read ingestion runs",
    "ordinary member unexpectedly read ingestion runs",
    "organization_admin unexpectedly read ingestion runs",
    "country_admin read a cross-country ingestion run",
    "moderator could not read cross-country ingestion runs",
    "super_admin could not read cross-country ingestion runs",
    "NEWS_INGESTION_ACTIVE_LEASE",
    "expired run was not marked ABANDONED",
    "source/integration mismatch was accepted",
    "terms PENDING integration was acquired",
    "terms REJECTED integration was acquired",
    "HOLD integration was acquired",
    "disabled integration was acquired",
    "unauthorized source was acquired",
    "historical run disappeared after integration disablement",
    "existing disabled integration fail-closed state was rejected",
    "inactive source was acquired",
    "source with revoked ingestion authorization was acquired",
    "verification_status safety constraint accepted an unverified enabled News source",
    "last_verified_at safety constraint accepted missing verification time",
    "Registry safety constraint accepted HOLD for enabled News source",
    "verification-level safety constraint accepted C for enabled News source",
    "Registry enabled safety constraint accepted disabled parent for enabled News source",
    "ingestion authorization safety accepted news_enabled=false",
    "demo safety constraint accepted demo for enabled News source",
    "public News reader behavior changed",
  ]) assert.match(hostedTest, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
