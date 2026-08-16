import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/202608110003_country_admin_scope_hardening.sql", import.meta.url), "utf8");
const hostedTest = readFileSync(new URL("../supabase/tests/country_admin_scope_hardening_hosted_rls_test.sql", import.meta.url), "utf8");
const countrySeed = readFileSync(new URL("../supabase/seeds/duta_country_indonesia.sql", import.meta.url), "utf8");
const groupC = readFileSync(new URL("../supabase/seeds/duta_news_v2_group_c_sources.sql", import.meta.url), "utf8");
const day1 = readFileSync(new URL("../supabase/migrations/202608080001_day1_auth_foundation.sql", import.meta.url), "utf8");
const day2 = readFileSync(new URL("../supabase/migrations/202608080002_day2_connect_news.sql", import.meta.url), "utf8");

test("scope hardening is an additive transactional trigger migration", () => {
  assert.match(migration, /^begin;/i);
  assert.match(migration, /commit;\s*$/i);
  assert.match(migration, /create trigger profiles_protect_authorization_scope/i);
  assert.doesNotMatch(migration, /^\s*(delete|truncate|drop table|alter table .* disable row level security)\b/im);
});

test("country_admin cannot change their own authorization country", () => {
  assert.match(migration, /\(select auth\.uid\(\)\) = old\.id/);
  assert.match(migration, /old\.role = 'country_admin'/);
  assert.match(migration, /new\.current_country_code is distinct from old\.current_country_code/);
  assert.match(migration, /errcode = '42501'/);
});

test("self role changes are blocked defensively while normal fields remain untouched", () => {
  assert.match(migration, /new\.role is distinct from old\.role/);
  assert.doesNotMatch(migration, /display_name|onboarding_completed/);
  assert.match(day1, /grant update \(display_name, current_country_code, onboarding_completed\)/i);
});

test("trigger helper is invoker-safe, fixed-path and cannot be called directly", () => {
  assert.match(migration, /security invoker\s+set search_path = ''/i);
  assert.match(migration, /revoke all on function private\.protect_profile_authorization_scope\(\) from public/i);
  assert.match(migration, /revoke all on function private\.protect_profile_authorization_scope\(\) from anon, authenticated/i);
  assert.doesNotMatch(migration, /grant execute/i);
});

test("can_manage_country remains unchanged and retains intended role behavior", () => {
  assert.doesNotMatch(migration, /create or replace function private\.can_manage_country/i);
  assert.match(day2, /viewer\.role in \('moderator', 'super_admin'\)/);
  assert.match(day2, /viewer\.role = 'country_admin'[\s\S]*viewer\.current_country_code = target_country_code/);
});

test("hosted test simulates direct authenticated calls for all required roles", () => {
  assert.match(hostedTest, /set local role authenticated/g);
  assert.match(hostedTest, /scope-member@example\.invalid/);
  assert.match(hostedTest, /scope-organization-admin@example\.invalid/);
  assert.match(hostedTest, /scope-country-admin@example\.invalid/);
  assert.match(hostedTest, /scope-moderator@example\.invalid/);
  assert.match(hostedTest, /scope-super-admin@example\.invalid/);
  assert.match(hostedTest, /set current_country_code = 'ID'/);
  assert.match(hostedTest, /set role = 'country_admin', current_country_code = 'ID'/);
});

test("hosted test covers MY preservation, inactive ID denial and global-admin behavior", () => {
  assert.match(hostedTest, /MY country_admin lost legitimate MY access/);
  assert.match(hostedTest, /country_admin gained ID access/);
  assert.match(hostedTest, /organization_admin gained country administration/);
  assert.match(hostedTest, /moderator cross-country behavior regressed/);
  assert.match(hostedTest, /super_admin cross-country behavior regressed/);
});

test("hosted test proves normal profile update and Group C FK and publishability compatibility", () => {
  assert.match(hostedTest, /set display_name = 'Updated Scope Member'/);
  assert.match(hostedTest, /'news', 'ID'/);
  assert.match(hostedTest, /private\.is_news_source_publishable/);
  assert.match(hostedTest, /inactive country reference blocked otherwise-publishable Group C source/);
});

test("hosted security test is one rollback-only transaction with no permanent DDL", () => {
  assert.match(hostedTest, /^begin;/i);
  assert.match(hostedTest, /rollback;\s*$/i);
  assert.doesNotMatch(hostedTest, /\bcommit\b/i);
  assert.doesNotMatch(hostedTest, /^\s*(create|alter|drop|grant|revoke)\b/im);
});

test("approved country and Group C seed hashes remain unchanged", () => {
  assert.equal(createHash("sha256").update(countrySeed).digest("hex").toUpperCase(), "CA1A5D89AD6DA0CB8DE01064E9E1F7193720C9724D43758C25660DE364075FFF");
  assert.equal(createHash("sha256").update(groupC).digest("hex").toUpperCase(), "F8A2A6E39ECD2A1EEF9D624E580B178ABC57B4E2289BE5659AABF3AF231832ED");
});
