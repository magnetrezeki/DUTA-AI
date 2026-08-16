import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/202608100001_master_source_registry_v1.sql");
const day2Migration = read("supabase/migrations/202608080002_day2_connect_news.sql");
const types = read("src/lib/official-sources/types.ts");
const dataAccess = read("src/lib/official-sources/server.ts");
const adminPage = read("src/app/admin/official-sources/page.tsx");
const adminAction = read("src/app/admin/official-sources/actions.ts");

test("registry extends the existing official_sources table and adds only the ingestion item table", () => {
  assert.match(migration, /alter table public\.official_sources/);
  assert.doesNotMatch(migration, /create table public\.official_sources\s*\(/);
  assert.match(migration, /create table public\.official_source_items/);
  assert.doesNotMatch(migration, /drop table|truncate/i);
});

test("public readers receive enabled verified A or B sources only", () => {
  assert.match(migration, /using \(enabled and registry_status = 'VERIFIED' and verification_level in \('A', 'B'\)\)/);
  assert.match(dataAccess, /\.from\("official_sources_public"\)/);
  assert.doesNotMatch(dataAccess, /\.from\("official_sources"\)/);
});

test("HOLD and LEGACY sources are disabled and cannot satisfy the enable constraint", () => {
  assert.match(migration, /'KBRI-KUL-ATIM'[\s\S]*?'HOLD','HOLD','P0'[\s\S]*?false/);
  assert.match(migration, /'KBRI-KUL-ATHAN'[\s\S]*?'HOLD','HOLD','P2'[\s\S]*?false/);
  assert.match(migration, /'@IndonesiaInKL'[\s\S]*?'LEGACY','LEGACY','P2'[\s\S]*?false/);
  assert.match(migration, /verification_level in \('A', 'B'\)[\s\S]*registry_status = 'VERIFIED'/);
});

test("admin registry reuses protected admin layout and server authorization", () => {
  assert.match(adminAction, /requirePlatformAdmin\(\)/);
  assert.match(adminPage, /DUTA Master Source Registry/);
  assert.match(adminPage, /institution|platform|priority|enabled|city/);
});

test("ordinary authenticated users cannot mutate registry rows", () => {
  assert.match(day2Migration, /"Admins manage official sources"/);
  assert.match(day2Migration, /private\.can_manage_country\(country_code\)/);
  assert.match(migration, /private\.can_manage_source\(source_id\)/);
  assert.doesNotMatch(migration, /authenticated users can update/i);
});

test("only A or B verified sources can be enabled at action and database layers", () => {
  assert.match(types, /level === "A" \|\| level === "B"/);
  assert.match(types, /status === "VERIFIED"/);
  assert.match(adminAction, /canEnableSource/);
  assert.match(adminAction, /confirmEnable/);
});

test("category values are explicitly validated in TypeScript and PostgreSQL", () => {
  for (const category of ["GENERAL_OFFICIAL", "CONSULAR", "MIGRANT_WORKER", "LEGAL_AID", "SCAM_ALERT", "LOCAL_ALERT"]) {
    assert.match(types, new RegExp(`"${category}"`));
    assert.match(migration, new RegExp(`'${category}'`));
  }
  assert.match(migration, /official_source_categories_valid/);
  assert.match(types, /validCategoryScope/);
});

test("seed uses deterministic identifiers and idempotent upsert without duplicate registry identities", () => {
  assert.match(migration, /official_sources_registry_identity_idx/);
  assert.match(migration, /on conflict \(id\) do update/);
  const ids = [...migration.matchAll(/'71000000-0000-0000-0000-([0-9]{12})'/g)].map((match) => match[1]);
  assert.equal(ids.length, 31);
  assert.equal(new Set(ids).size, 31);
});

test("RLS stays enabled and ingestion integrations remain inactive", () => {
  assert.match(migration, /alter table public\.official_sources enable row level security/);
  assert.match(migration, /alter table public\.official_source_items enable row level security/);
  assert.match(migration, /and verified_source/);
  assert.doesNotMatch(migration, /disable row level security/i);
  assert.doesNotMatch(migration, /integration_enabled[^\n]*true/i);
});
