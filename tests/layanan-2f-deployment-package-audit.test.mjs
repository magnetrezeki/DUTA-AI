import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const populationRollback = fs.readFileSync("supabase/recovery/duta_layanan_2e_population_fail_closed.sql", "utf8");
const migrationRollback = fs.readFileSync("supabase/recovery/duta_layanan_2e_migration_behavior_rollback.sql", "utf8");

test("population recovery is transactional, namespace-scoped and audit-preserving", () => {
  assert.match(populationRollback.trim(), /^begin;/i);
  assert.match(populationRollback.trim(), /commit;$/i);
  assert.doesNotMatch(populationRollback, /\b(delete|truncate|drop)\b/i);
  for (const prefix of ["75000000", "75100000", "75400000"]) assert.match(populationRollback, new RegExp(prefix));
});

test("migration recovery restores evidence-only behavior without deleting audit schema", () => {
  assert.match(migrationRollback, /has_approved_service_evidence\('mission_service'/);
  assert.match(migrationRollback, /has_approved_service_evidence\('office_jurisdiction'/);
  assert.match(migrationRollback, /provenance_class is distinct from 'DUTA_REVIEWED_VERIFIED'/);
  assert.doesNotMatch(migrationRollback, /drop (table|type)|delete from|truncate/i);
});
