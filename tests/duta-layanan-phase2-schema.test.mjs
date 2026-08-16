import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/202608110001_duta_layanan_wni_phase2_schema.sql",
  import.meta.url,
);

const migration = await readFile(migrationUrl, "utf8");
const connectPage = await readFile(new URL("../src/app/connect/page.tsx", import.meta.url), "utf8");
const aiTools = await readFile(new URL("../src/lib/ai/tools.ts", import.meta.url), "utf8");

test("Phase 2 migration is additive, transactional, and contains no operational seed", () => {
  assert.match(migration, /^begin;/i);
  assert.match(migration, /commit;\s*$/i);
  assert.doesNotMatch(migration, /\b(drop table|truncate|disable row level security)\b/i);
  assert.doesNotMatch(migration, /\bdrop policy\b|\bon delete cascade\b/i);
  assert.doesNotMatch(migration, /^\s*insert\s+into\s+/im);
  assert.doesNotMatch(migration, /KBRI-KUL|KJRI-JHB|KJRI-PEN|KJRI-KCH|KJRI-BKI|KRI-TWU/);
});

test("existing Day 2 structures are extended instead of duplicated", () => {
  for (const table of [
    "representative_offices",
    "office_jurisdictions",
    "service_categories",
    "office_contact_channels",
  ]) {
    assert.match(migration, new RegExp(`alter table public\\.${table}`));
    assert.doesNotMatch(migration, new RegExp(`create table public\\.${table}\\s*\\(`));
  }
  assert.doesNotMatch(migration, /create table public\.(official_sources|official_source_items|diplomatic_missions|mission_jurisdictions|mission_service_channels)/i);
});

test("all thirteen approved operational tables are created with RLS", () => {
  const tables = [
    "location_aliases",
    "mission_services",
    "mission_service_fees",
    "mission_service_requirements",
    "mission_appointments",
    "mission_service_hours",
    "mission_service_hour_exceptions",
    "official_service_evidence",
    "service_verification_events",
    "service_data_conflicts",
    "official_service_events",
    "official_service_event_services",
    "user_service_reports",
  ];

  for (const table of tables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test("public operational reads require approved evidence and hide open conflicts", () => {
  assert.match(migration, /private\.has_approved_service_evidence/);
  assert.match(migration, /source\.registry_status = 'VERIFIED'/);
  assert.match(migration, /source\.verification_level in \('A', 'B'\)/);
  assert.match(migration, /private\.has_open_service_conflict/);
  assert.match(migration, /conflict\.status = 'OPEN'/);
  assert.match(migration, /OFFICIAL_BUT_DATE_UNCERTAIN/);
  assert.match(migration, /has_newer_current_fee/);
});

test("typed evidence, conflict, history, and report targets retain foreign-key integrity", () => {
  assert.match(migration, /official_service_evidence_one_target check \(num_nonnulls/);
  assert.match(migration, /service_verification_events_one_target check \(num_nonnulls/);
  assert.match(migration, /service_data_conflicts_one_target check \(num_nonnulls/);
  assert.match(migration, /user_service_reports_one_target check \(num_nonnulls/);
  assert.match(migration, /service_verification_events_evidence_matches_target/);
  assert.match(migration, /service_data_conflicts_evidence_a_matches_target/);
  assert.match(migration, /service_data_conflicts_evidence_b_matches_target/);
  assert.match(migration, /service_evidence_matches_target/);
  assert.doesNotMatch(migration, /entity_type\s+text[\s\S]*entity_id\s+uuid/i);
});

test("jurisdiction periods use a serialized database trigger to reject temporal overlap", () => {
  assert.match(
    migration,
    /create or replace function private\.prevent_office_jurisdiction_overlap\(\)[\s\S]*pg_advisory_xact_lock[\s\S]*tstzrange\([\s\S]*&& tstzrange\(/,
  );
  assert.match(migration, /existing\.office_id = new\.office_id/);
  assert.match(migration, /existing\.country_code = new\.country_code/);
  assert.match(migration, /existing\.state_normalized = new\.state_normalized/);
  assert.match(migration, /coalesce\(existing\.district_normalized, ''\) = coalesce\(new\.district_normalized, ''\)/);
  assert.match(migration, /existing\.jurisdiction_type = new\.jurisdiction_type/);
  assert.match(migration, /create trigger office_jurisdictions_prevent_overlap/);
  assert.doesNotMatch(migration, /office_jurisdictions_normalized_identity_idx[\s\S]{0,300}effective_until is null/);
});

test("jurisdiction overlap range is half-open so adjacent history remains valid", () => {
  const overlapFunction = migration.match(
    /create or replace function private\.prevent_office_jurisdiction_overlap\(\)[\s\S]*?\$\$;/,
  )?.[0] ?? "";
  assert.match(overlapFunction, /coalesce\(existing\.effective_from, '-infinity'::timestamptz\)/);
  assert.match(overlapFunction, /coalesce\(new\.effective_from, '-infinity'::timestamptz\)/);
  assert.equal((overlapFunction.match(/'\[\)'/g) ?? []).length, 2);
  assert.match(overlapFunction, /existing\.id <> new\.id/);
  assert.match(overlapFunction, /existing\.enabled/);
});

test("public base tables are isolated and curated reads expose explicit safe fields", () => {
  assert.doesNotMatch(
    migration,
    /grant select on public\.location_aliases, public\.mission_services/i,
  );
  for (const reader of [
    "offices",
    "jurisdictions",
    "mission_services",
    "contact_channels",
    "fees",
    "requirements",
    "appointments",
    "hours",
    "hour_exceptions",
    "events",
    "event_services",
  ]) {
    assert.match(migration, new RegExp(`private\\.read_layanan_public_${reader}`));
  }
  assert.doesNotMatch(
    migration,
    /grant select \([^;]*created_by[^;]*\) on public\.(location_aliases|mission_services|mission_service_fees)/i,
  );
  assert.match(
    migration,
    /revoke select on public\.representative_offices, public\.office_jurisdictions,\s+public\.service_categories, public\.office_contact_channels from anon, authenticated/,
  );
  assert.doesNotMatch(
    migration,
    /on public\.(representative_offices|office_jurisdictions|service_categories|office_contact_channels) to anon, authenticated/,
  );
  assert.doesNotMatch(migration, /create policy "Public reads (enabled location aliases|publishable mission services|publishable fees|publishable requirements|publishable appointments|publishable service hours|publishable hour exceptions|publishable official service events|services for publishable events)"/);
});

test("normal application readers use only curated Layanan views", () => {
  for (const unsafeTable of ["office_jurisdictions", "service_categories", "office_contact_channels", "representative_offices"]) {
    assert.doesNotMatch(connectPage, new RegExp(`\\.from\\("${unsafeTable}"\\)`));
    assert.doesNotMatch(aiTools, new RegExp(`\\.from\\("${unsafeTable}"\\)`));
  }
  for (const view of ["layanan_public_offices", "layanan_public_jurisdictions", "layanan_public_mission_services", "layanan_public_contact_channels"]) {
    assert.match(`${connectPage}\n${aiTools}`, new RegExp(`\\.from\\("${view}"\\)`));
  }
});

test("restrictive Day 2 base-table policies allow administrators only", () => {
  for (const [policy, helper] of [
    ["Layanan restricts public office reads", "can_manage_country"],
    ["Layanan restricts public jurisdiction reads", "can_manage_country"],
    ["Layanan restricts direct service category reads", "is_platform_admin"],
    ["Layanan restricts public contact channel reads", "can_manage_office"],
  ]) {
    const section = migration.match(
      new RegExp(`create policy "${policy}"[\\s\\S]*?\\);`),
    )?.[0] ?? "";
    assert.match(section, /as restrictive/);
    assert.match(section, new RegExp(`private\\.${helper}`));
    assert.doesNotMatch(section, /\benabled\b|\bis_demo\b|publishability_status/);
  }
});

test("date-uncertain fees are available only through the curated fee reader", () => {
  assert.doesNotMatch(migration, /create policy "Public reads publishable fees"/);
  assert.match(
    migration,
    /read_layanan_public_fees[\s\S]*requires_date_uncertain_disclaimer[\s\S]*OFFICIAL_BUT_DATE_UNCERTAIN/,
  );
  for (const reader of ["contact_channels", "jurisdictions", "appointments"]) {
    const section = migration.match(
      new RegExp(`read_layanan_public_${reader}[\\s\\S]*?\\$\\$;`),
    )?.[0] ?? "";
    assert.doesNotMatch(section, /OFFICIAL_BUT_DATE_UNCERTAIN/);
  }
});

test("typed evidence, conflict, and history indexes cover every approved target", () => {
  assert.match(migration, /official_service_evidence_hour_exception_idx/);
  for (const target of [
    "office",
    "jurisdiction",
    "location_alias",
    "mission_service",
    "contact",
    "fee",
    "requirement",
    "appointment",
    "hours",
    "hour_exception",
    "event",
  ]) {
    assert.match(migration, new RegExp(`service_verification_events_${target}_idx`));
    assert.match(migration, new RegExp(`service_data_conflicts_${target}_idx`));
  }
});

test("official evidence associations reject exact duplicates without blocking many-to-many provenance", () => {
  for (const target of [
    "office",
    "jurisdiction",
    "location_alias",
    "mission_service",
    "contact",
    "fee",
    "requirement",
    "appointment",
    "hours",
    "hour_exception",
    "event",
  ]) {
    assert.match(
      migration,
      new RegExp(`create unique index official_service_evidence_${target}_unique_idx`),
    );
  }
  assert.match(migration, /official_source_id, coalesce\(official_source_item_id::text, evidence_url\)/);
  assert.match(migration, /where contact_channel_id is not null/);
  assert.match(migration, /where official_service_event_id is not null/);
});

test("curated child readers enforce the reusable office and mission-service parent chain", () => {
  assert.match(migration, /create or replace function private\.is_layanan_public_office/);
  assert.match(migration, /create or replace function private\.is_layanan_public_mission_service/);

  for (const reader of ["jurisdictions", "mission_services", "contact_channels", "appointments", "hours", "hour_exceptions", "events", "event_services"]) {
    const section = migration.match(
      new RegExp(`read_layanan_public_${reader}[\\s\\S]*?\\$\\$;`),
    )?.[0] ?? "";
    assert.match(section, /private\.is_layanan_public_office|private\.is_layanan_public_mission_service/);
  }
  for (const reader of ["fees", "requirements"]) {
    const section = migration.match(
      new RegExp(`read_layanan_public_${reader}[\\s\\S]*?\\$\\$;`),
    )?.[0] ?? "";
    assert.match(section, /private\.is_layanan_public_mission_service/);
  }
  for (const reader of ["contact_channels", "appointments", "hours", "hour_exceptions", "event_services"]) {
    const section = migration.match(
      new RegExp(`read_layanan_public_${reader}[\\s\\S]*?\\$\\$;`),
    )?.[0] ?? "";
    assert.match(section, /service_category_id/);
    assert.match(section, /private\.is_layanan_public_mission_service/);
  }
});

test("event-service junction supports reverse service-to-event lookup", () => {
  assert.match(
    migration,
    /create index official_service_event_services_service_idx\s+on public\.official_service_event_services \(service_category_id, event_id\)/,
  );
});

test("event service history is restrictive and operational delete grants are absent", () => {
  assert.match(
    migration,
    /event_id uuid not null references public\.official_service_events\(id\) on delete restrict/,
  );
  assert.doesNotMatch(migration, /grant insert, update, delete on public\.location_aliases/i);
});

test("authorization remains country scoped and organization admins get no platform policy", () => {
  assert.match(migration, /private\.can_manage_country/);
  assert.match(migration, /private\.can_manage_office/);
  assert.match(migration, /private\.can_manage_mission_service/);
  assert.match(migration, /private\.can_manage_service_target/);
  assert.doesNotMatch(migration, /organization_admin/i);
  assert.doesNotMatch(migration, /for all to anon|for insert to anon|for update to anon|for delete to anon/i);
});

test("authenticated reports cannot become official evidence or mutate operational records", () => {
  assert.match(migration, /reporter_id uuid not null/);
  assert.match(migration, /Users submit own new service reports/);
  assert.match(migration, /reporter_id = auth\.uid\(\) and status = 'NEW'/);
  assert.doesNotMatch(migration, /grant insert[^;]*user_service_reports[^;]*to anon/i);
});

test("public views are security invoker and the router does not guess Sabah", () => {
  const viewNames = [
    "layanan_public_offices",
    "layanan_public_jurisdictions",
    "layanan_public_mission_services",
    "layanan_public_contact_channels",
    "layanan_public_fees",
    "layanan_public_requirements",
    "layanan_public_appointments",
    "layanan_public_hours",
    "layanan_public_hour_exceptions",
    "layanan_public_events",
    "layanan_public_event_services",
  ];
  for (const view of viewNames) {
    assert.match(migration, new RegExp(`create view public\\.${view}[\\s\\S]*?security_invoker = true`));
  }
  assert.match(migration, /resolve_wni_service_route/);
  assert.match(migration, /AMBIGUOUS_JURISDICTION/);
  assert.match(migration, /Anda berada di daerah mana di Sabah\?/);
  assert.match(migration, /Daerah Sabah tidak dapat dicocokkan dengan yakin; jangan menebak\./);
  assert.match(migration, /Rute dipilih berdasarkan yurisdiksi resmi, bukan jarak geografis\./);
});

test("security definer helpers use fixed search paths and minimal grants", () => {
  const definerCount = (migration.match(/security definer/g) ?? []).length;
  const fixedPathCount = (migration.match(/set search_path = ''/g) ?? []).length;
  assert.equal(definerCount, 18);
  assert.ok(fixedPathCount >= definerCount);
  assert.doesNotMatch(migration, /grant execute[^;]*to public/i);
  assert.doesNotMatch(migration, /service_role/i);
});
