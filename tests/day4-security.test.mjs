import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/202608080004_day4_community_os.sql", import.meta.url), "utf8");
const authorization = await readFile(new URL("../src/lib/organizations/authorization.ts", import.meta.url), "utf8");
const actions = await readFile(new URL("../src/app/organization-admin/[id]/actions.ts", import.meta.url), "utf8");
const tables = ["organizations", "organization_claims", "organization_memberships", "organization_announcements", "organization_events", "organization_event_registrations", "organization_join_links"];

test("Day 4 enables RLS on every organization table and never disables it", () => {
  for (const table of tables) assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  assert.doesNotMatch(migration, /disable row level security/i);
});

test("organization tenant administration requires an approved admin membership", () => {
  assert.match(migration, /membership\.organization_id = target_organization_id/);
  assert.match(migration, /membership\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /membership\.role = 'admin'/);
  assert.match(migration, /membership\.status = 'approved'/);
  assert.match(authorization, /eq\("organization_id", organizationId\)/);
  assert.match(actions, /requireOrganizationAdmin\(organizationId\)/g);
});

test("organization admins cannot promote members or change verification fields", () => {
  assert.match(migration, /and role = 'member'/);
  assert.match(migration, /protect_organization_review_fields/);
  assert.match(migration, /Only platform moderators may change organization review fields/);
  assert.match(migration, /protect_membership_approval_fields/);
  assert.match(migration, /Organization admins cannot change membership identity or role/);
  assert.match(migration, /new\.approved_by is distinct from auth\.uid\(\)/);
});

test("private membership and registration data has no anonymous grants", () => {
  assert.doesNotMatch(migration, /grant select on public\.organization_memberships to anon/i);
  assert.doesNotMatch(migration, /grant select on public\.organization_event_registrations to anon/i);
  assert.doesNotMatch(migration, /grant select on public\.organization_claims to anon/i);
  assert.match(migration, /Users read own event registrations/);
});

test("public column grants exclude ownership and moderation identities", () => {
  const publicGrants = [...migration.matchAll(/grant select \([\s\S]*?\) on public\.(organizations|organization_announcements|organization_events|organization_join_links) to anon, authenticated;/gi)].map((match) => match[0]).join("\n");
  assert.doesNotMatch(publicGrants, /submitted_by|reviewed_by|created_by/);
  assert.doesNotMatch(migration, /grant select, insert, update on public\.organizations/i);
});

test("new organizations and memberships require approval and no organizations are seeded", () => {
  assert.match(migration, /status public\.organization_status not null default 'pending'/);
  assert.match(migration, /status public\.organization_membership_status not null default 'pending'/);
  assert.doesNotMatch(migration, /insert into public\.organizations/i);
});

test("claim approval is atomic and country-authorized", () => {
  assert.match(migration, /approve_organization_claim/);
  assert.match(migration, /private\.can_manage_country\(selected_country\)/);
  assert.match(migration, /insert into public\.organization_memberships/);
});
