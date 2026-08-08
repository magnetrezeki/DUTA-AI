import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../supabase/migrations/202608080003_day3_duta_map.sql", import.meta.url);
const nearbyPath = new URL("../src/components/map/nearby-places.tsx", import.meta.url);
const migration = await readFile(migrationPath, "utf8");
const nearby = await readFile(nearbyPath, "utf8");

const tables = ["place_categories", "community_places", "place_corrections", "place_reviews", "place_recommendations", "place_confirmations", "place_reports"];

test("Day 3 enables RLS on every community table and never disables it", () => {
  for (const table of tables) assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  assert.doesNotMatch(migration, /disable row level security/i);
});

test("new community places, reviews, corrections, and reports remain pending", () => {
  assert.match(migration, /moderation_status public\.community_moderation_status not null default 'pending'/g);
  assert.match(migration, /Members submit pending community places/);
  assert.match(migration, /moderation_status = 'approved'/);
  assert.doesNotMatch(migration, /default 'approved'/i);
});

test("member writes are ownership-bound and admin moderation is country scoped", () => {
  assert.match(migration, /submitted_by = \(select auth\.uid\(\)\)/);
  assert.match(migration, /author_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /reporter_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /private\.can_manage_country\(country_code\)/);
});

test("public directory grants exclude contributor and moderator identities", () => {
  assert.doesNotMatch(migration, /grant select on public\.place_categories, public\.community_places/i);
  const publicPlaceGrant = migration.match(/grant select \([\s\S]*?\) on public\.community_places to anon, authenticated;/i)?.[0] ?? "";
  const publicReviewGrant = migration.match(/grant select \([\s\S]*?\) on public\.place_reviews to anon, authenticated;/i)?.[0] ?? "";
  assert.doesNotMatch(publicPlaceGrant, /submitted_by|moderated_by|moderation_note/i);
  assert.doesNotMatch(publicReviewGrant, /author_id|moderated_by/i);
  assert.match(migration, /revoke all on function private\.flag_place_duplicate\(\) from public/i);
});

test("duplicate detection and trust labels are explicit", () => {
  assert.match(migration, /flag_place_duplicate/);
  assert.match(migration, /potential_duplicate_id/);
  for (const label of ["community_unverified", "community_confirmed", "trusted_contributor_confirmed", "admin_reviewed"]) assert.match(migration, new RegExp(label));
});

test("Day 3 seeds taxonomy only and invents no place, clinic, address, or contact", () => {
  assert.doesNotMatch(migration, /insert into public\.community_places/i);
  assert.match(migration, /general-clinics/);
  assert.match(migration, /diagnostic-facilities/);
});

test("nearby location stays in browser memory and is not sent to the server", () => {
  assert.match(nearby, /navigator\.geolocation/);
  assert.doesNotMatch(nearby, /fetch\(|server action|searchParams|localStorage/i);
});
