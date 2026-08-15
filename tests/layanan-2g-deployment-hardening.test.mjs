import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const preflight = read("supabase/tests/duta_layanan_2e_hosted_preflight.sql");
const population = read("supabase/seeds/duta_layanan_2d_verified_services.sql");
const validation = read("supabase/tests/duta_layanan_2d_post_population_validation.sql");
const runbook = read("docs/runbooks/DUTA_LAYANAN_2E_DEPLOYMENT_ROLLBACK.md");

test("preflight inventories every deterministic package identity semantically", () => {
  for (const prefix of ["75000000", "75100000", "75300000", "75400000", "75600000", "75610000", "75620000", "75710000", "75720000"]) {
    assert.match(preflight, new RegExp(prefix));
  }
  for (const semantic of ["mission_code", "country_code", "source_id", "state_normalized", "district_normalized", "jurisdiction_type", "service_code", "slug", "intent_group", "provenance_class", "evidence_url", "review_decision", "reviewer_role"]) {
    assert.match(preflight, new RegExp(semantic));
  }
  assert.match(preflight, /generate_series\(1,42\)/);
  assert.match(preflight, /contact_writes=0/);
  assert.match(preflight, /service_data_conflicts[\s\S]*status='OPEN'/);
  assert.doesNotMatch(preflight, /package_counts|namespace_count/);
});

test("population is atomic and conflicts cannot rewrite trusted service identity", () => {
  assert.match(population.trim(), /^begin;/i);
  assert.match(population.trim(), /commit;$/i);
  assert.match(population, /LAYANAN_2G_CATEGORY_SEMANTIC_COLLISION/);
  assert.match(population, /where mission_services\.office_id=excluded\.office_id[\s\S]*service_category_id=excluded\.service_category_id[\s\S]*source_id=excluded\.source_id/);
  assert.doesNotMatch(population, /on conflict\(id\) do nothing;/i);
  for (const gate of ["OFFICE_EVIDENCE_IDENTITY_COLLISION", "JURISDICTION_EVIDENCE_IDENTITY_COLLISION", "SERVICE_EVIDENCE_IDENTITY_COLLISION"]) assert.match(population, new RegExp(gate));
  assert.match(population, /right\(e\.id::text,12\)<>right\(e\.mission_service_id::text,12\)/);
  assert.match(population, /right\(e\.id::text,12\)<>right\(e\.office_jurisdiction_id::text,12\)/);
});

test("post-population validation is assertive and accepts only approved dual provenance", () => {
  for (const marker of ["PUBLIC_OFFICE_COUNT", "PUBLIC_JURISDICTION_COUNT", "PUBLIC_SERVICE_COUNT", "OFFICIAL_PROVENANCE_COUNT", "DUTA_PROVENANCE_COUNT", "DUTA_REVIEW_MISSING", "OFFICIAL_EVIDENCE_MISSING", "FEE_CONTACT_PROVENANCE_BYPASS", "PRIVATE_PUBLIC_COLUMN_EXPOSURE"]) assert.match(validation, new RegExp(marker));
  assert.match(validation, /public_offices<>6/);
  assert.match(validation, /public_jurisdictions<>42/);
  assert.match(validation, /public_services<>28/);
  assert.match(validation, /official_services<>17/);
  assert.match(validation, /duta_services<>11/);
  assert.match(validation, /has_approved_duta_review\('mission_service'/);
  assert.match(validation, /has_approved_service_evidence\('fee'/);
  assert.match(validation, /has_approved_service_evidence\('contact_channel'/);
});

test("rollback runbook requires coordinated database and application behavior rollback", () => {
  assert.match(runbook, /database behavior rollback alone is unsafe/i);
  assert.match(runbook, /application back to the recorded pre-2E compatible commit/i);
  assert.match(runbook, /duta_layanan_2e_population_fail_closed\.sql/);
  assert.match(runbook, /duta_layanan_2e_migration_behavior_rollback\.sql/);
  assert.match(runbook, /layanan_public_provenance/);
});
