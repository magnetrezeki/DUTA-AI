import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/202608080001_day1_auth_foundation.sql",
  import.meta.url,
);

test("the Day 1 migration enables RLS and never disables it", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /alter table public\.countries enable row level security/i);
  assert.match(sql, /alter table public\.profiles enable row level security/i);
  assert.doesNotMatch(sql, /disable row level security/i);
});

test("private profiles require the current user or an authorized admin", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /private\.can_read_profile\(current_country_code\)/i);
  assert.match(sql, /grant update \(display_name, current_country_code, onboarding_completed\)/i);
  assert.doesNotMatch(sql, /grant update on public\.profiles to authenticated/i);
});

test("the migration includes all approved roles and Malaysia as active", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const roles = [
    "member",
    "trusted_contributor",
    "organization_admin",
    "employer",
    "moderator",
    "country_admin",
    "super_admin",
  ];

  roles.forEach((role) => assert.match(sql, new RegExp(`'${role}'`)));
  assert.match(sql, /'MY',[\s\S]*?'Malaysia',[\s\S]*?true/i);
});
