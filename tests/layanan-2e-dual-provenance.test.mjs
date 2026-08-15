import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/202608150001_duta_layanan_dual_provenance.sql", "utf8");
const population = fs.readFileSync("supabase/seeds/duta_layanan_2d_verified_services.sql", "utf8");
const connect = fs.readFileSync("src/app/connect/page.tsx", "utf8");
const preflight = fs.readFileSync("supabase/tests/duta_layanan_2e_hosted_preflight.sql", "utf8");

test("dual provenance is additive and keeps official evidence as an independent path", () => {
  assert.match(migration, /create type public\.layanan_provenance_class/);
  assert.match(migration, /OFFICIAL_SOURCE_VERIFIED/);
  assert.match(migration, /DUTA_REVIEWED_VERIFIED/);
  assert.match(migration, /has_approved_service_evidence[\s\S]*or private\.has_approved_duta_review/);
  assert.doesNotMatch(migration, /drop table|disable row level security/i);
});

test("DUTA review is limited to stable service and jurisdiction facts", () => {
  assert.match(migration, /num_nonnulls\(office_jurisdiction_id, mission_service_id\) = 1/);
  assert.doesNotMatch(migration.match(/create or replace function private\.read_layanan_public_fees[\s\S]*?\$\$;/)?.[0] ?? "", /has_approved_duta_review/);
  assert.doesNotMatch(migration.match(/read_layanan_public_contact_channels[\s\S]*?\$\$;/)?.[0] ?? "", /has_approved_duta_review/);
});

test("ordinary and organization admins cannot create DUTA review authority", () => {
  assert.match(migration, /viewer\.role in \('moderator', 'super_admin'\)/);
  assert.doesNotMatch(migration, /organization_admin/);
  assert.match(migration, /actor_id = auth\.uid\(\)/);
});

test("public provenance API and UI preserve truthful labels", () => {
  assert.match(migration, /create view public\.layanan_public_provenance/);
  assert.match(migration, /Sumber resmi terverifikasi/);
  assert.match(migration, /Diverifikasi DUTA berdasarkan sumber resmi yang telah ditinjau/);
  assert.match(connect, /layanan_public_provenance/);
});

test("population retains 17 official locators and records 11 DUTA review events", () => {
  assert.equal((population.match(/75610000-0000-0000-0000-0000000000/g) ?? []).length, 17);
  assert.match(population, /DUTA_REVIEWED_VERIFIED/);
  assert.match(population, /docs\/data\/duta-layanan-2d-product-owner-decision\.json/);
});

test("conflicts, demo rows and temporal publication gates remain mandatory", () => {
  const serviceReader = migration.match(/create or replace function private\.is_layanan_public_mission_service[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.match(serviceReader, /not category\.is_demo/);
  assert.match(serviceReader, /effective_from/);
  assert.match(serviceReader, /effective_until/);
  assert.match(serviceReader, /not private\.has_open_service_conflict/);
  assert.match(serviceReader, /verification_status = 'verified'/);
});

test("hosted preflight is SELECT-only", () => {
  assert.doesNotMatch(preflight, /\b(insert|update|delete|alter|drop|create|truncate|grant|revoke|set role)\b/i);
  assert.match(preflight, /verification_event_id_collisions/);
  assert.match(preflight, /open_package_conflicts/);
});
