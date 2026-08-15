import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/202608150003_office_jurisdiction_normalized_unique.sql");
const parent = read("supabase/seeds/duta_layanan_1_malaysia_jurisdictions.sql");
const child = read("supabase/seeds/duta_layanan_2d_verified_services.sql");

test("legacy display-field uniqueness is replaced only by the normalized natural key", () => {
  assert.match(migration, /^begin;/i);
  assert.match(migration, /drop constraint if exists office_jurisdictions_country_code_state_name_office_id_key/i);
  assert.match(migration, /unique nulls not distinct\s*\(\s*office_id,\s*country_code,\s*state_normalized,\s*district_normalized,\s*jurisdiction_type\s*\)/i);
  assert.match(migration, /commit;\s*$/i);
  assert.doesNotMatch(migration, /\b(delete|update|insert|truncate|drop table|disable row level security|grant|revoke)\b/i);
});

test("the normalized key rejects duplicate district and NULL state-wide identities", () => {
  assert.match(migration, /group by office_id, country_code, state_normalized,\s*district_normalized, jurisdiction_type/i);
  assert.match(migration, /having count\(\*\) > 1/i);
  assert.match(migration, /LAYANAN_2K_NORMALIZED_JURISDICTION_COLLISION/);
  assert.match(migration, /nulls not distinct/i);
});

test("all frozen Sabah district records remain distinct and unchanged", () => {
  const tawauDistricts = ["Tawau", "Kunak", "Semporna", "Lahad Datu", "Kalabakan"];
  for (const district of tawauDistricts) assert.match(parent, new RegExp(`'Sabah','sabah','${district}'`));
  assert.equal((parent.match(/'75100000-0000-0000-0000-0000000000\d{2}'/g) ?? []).length >= 42, true);
  assert.equal((parent.match(/'75000000-0000-0000-0000-000000000006'[^\n]*'Sabah'/g) ?? []).length, 5);
  assert.equal((parent.match(/'75000000-0000-0000-0000-000000000005'[^\n]*'Sabah'/g) ?? []).length, 22);
});

test("jurisdiction type participates and parent/child guards remain compatible", () => {
  assert.match(migration, /district_normalized,\s*jurisdiction_type/);
  assert.match(parent, /jurisdiction_type::public\.jurisdiction_type/);
  assert.match(child, /LAYANAN_2D_FROZEN_PARENT_SET_MISSING/);
  assert.match(child, /office_jurisdictions[\s\S]*<> 42/);
});

test("collision and failed-attempt diagnostics are SELECT-only", () => {
  for (const path of [
    "supabase/tests/duta_layanan_2k_jurisdiction_collision_preflight.sql",
    "supabase/tests/duta_layanan_2k_failed_parent_validation.sql",
  ]) {
    const sql = read(path);
    assert.match(sql, /^(?:--[^\n]*\n)+with\b/i);
    assert.doesNotMatch(sql, /\b(insert|update|delete|alter|drop|truncate|grant|revoke|begin|commit|rollback)\b/i);
  }
});
