import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sourceMigration = fs.readFileSync("supabase/migrations/202608150001_duta_layanan_dual_provenance.sql", "utf8");
const hotfix = fs.readFileSync("supabase/migrations/202608150002_duta_layanan_public_provenance_acl_hotfix.sql", "utf8");
const validation = fs.readFileSync("supabase/tests/duta_layanan_2h_post_migration_acl_validation.sql", "utf8");
const writePrivileges = /insert, update, delete, truncate, references, trigger/i;

test("source migration makes the new provenance view client-read-only explicitly", () => {
  assert.match(sourceMigration, /create view public\.layanan_public_provenance[\s\S]*revoke insert, update, delete, truncate, references, trigger[\s\S]*from anon, authenticated;[\s\S]*grant select[\s\S]*to anon, authenticated;/i);
  assert.equal((sourceMigration.match(/create(?: or replace)? view public\./gi) ?? []).length, 1);
});

test("additive hotfix changes only provenance-view ACLs", () => {
  assert.match(hotfix.trim(), /^begin;/i);
  assert.match(hotfix.trim(), /commit;$/i);
  assert.match(hotfix, writePrivileges);
  assert.match(hotfix, /from anon, authenticated/);
  assert.match(hotfix, /grant select[\s\S]*to anon, authenticated/);
  assert.doesNotMatch(hotfix, /service_role|postgres|create view|replace view|alter table|policy|row level security|insert into|update public|delete from/i);
});

test("hosted validator reports every client boundary independently", () => {
  for (const role of ["public", "anon", "authenticated"]) assert.match(validation, new RegExp(`'${role}'`));
  for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) assert.match(validation, new RegExp(`'${privilege}'`));
  assert.match(validation, /not \(can_insert or can_update or can_delete or can_truncate or can_reference or can_trigger\)/);
  assert.doesNotMatch(validation, /normal_role_write/);
  assert.doesNotMatch(validation, /service_role|postgres/);
  assert.match(validation.trim(), /^--[\s\S]*with /i);
  assert.doesNotMatch(validation, /^\s*(insert|update|delete|alter|drop|create|truncate|grant|revoke)\b/im);
});
