import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("child population retains its frozen parent guard", () => {
  const child = read("supabase/seeds/duta_layanan_2d_verified_services.sql");
  assert.match(child, /^begin;/i);
  assert.match(child, /LAYANAN_2D_FROZEN_PARENT_SET_MISSING/);
  assert.match(child, /representative_offices[\s\S]*<> 6/);
  assert.match(child, /office_jurisdictions[\s\S]*<> 42/);
});

test("the single canonical parent seed is exact, transactional, and fail closed", () => {
  const parent = read("supabase/seeds/duta_layanan_1_malaysia_jurisdictions.sql");
  assert.match(parent, /^begin;/i);
  assert.match(parent, /commit;\s*$/i);
  assert.equal((parent.match(/'75000000-0000-0000-0000-00000000000\d'/g) ?? []).length >= 6, true);
  assert.equal((parent.match(/'75100000-0000-0000-0000-0000000000\d{2}'/g) ?? []).length >= 42, true);
  assert.match(parent, /country_code is distinct from 'MY'/);
  assert.match(parent, /jurisdiction\.office_id is distinct from expected\.office_id/);
  assert.match(parent, /jurisdiction\.state_normalized is distinct from expected\.state_normalized/);
  assert.match(parent, /jurisdiction\.district_normalized is distinct from expected\.district_normalized/);
  assert.doesNotMatch(parent, /\b(delete|truncate|drop|alter|grant|revoke)\b/i);
});

test("preflight and post-parent validation are SELECT-only", () => {
  const preflight = read("supabase/tests/duta_layanan_2e_hosted_preflight.sql");
  const post = read("supabase/tests/duta_layanan_1_post_parent_validation.sql");
  const failedAttempt = read("supabase/tests/duta_layanan_2d_failed_attempt_validation.sql");
  for (const sql of [preflight, post, failedAttempt]) {
    assert.match(sql, /^(?:--[^\n]*\n)+with\b/i);
    assert.doesNotMatch(sql, /\b(insert|update|delete|alter|drop|truncate|grant|revoke|begin|commit|rollback)\b/i);
  }
  assert.match(preflight, /'AVAILABLE'/);
  assert.match(preflight, /'EXACT_EXISTING'/);
  assert.match(post, /'exact_offices',6-/);
  assert.match(post, /'exact_jurisdictions',42-/);
  assert.match(post, /'demo_leakage'/);
  assert.match(post, /'unexpected_mission'/);
  assert.match(post, /'unexpected_jurisdiction'/);
  assert.match(failedAttempt, /'75300000-%'/);
  assert.match(failedAttempt, /'75400000-%'/);
  assert.match(failedAttempt, /'75610000-%'/);
  assert.match(failedAttempt, /'75720000-%'/);
});
