import assert from "node:assert/strict";
import test from "node:test";
import {
  isPlatformAdminRole,
  userRoles,
} from "../src/lib/auth/roles.ts";

test("the Day 1 role system contains exactly the approved roles", () => {
  assert.deepEqual(userRoles, [
    "member",
    "trusted_contributor",
    "organization_admin",
    "employer",
    "moderator",
    "country_admin",
    "super_admin",
  ]);
});

test("a member cannot access platform admin routes", () => {
  assert.equal(isPlatformAdminRole("member"), false);
});

test("only platform moderation roles can access platform admin routes", () => {
  assert.equal(isPlatformAdminRole("trusted_contributor"), false);
  assert.equal(isPlatformAdminRole("organization_admin"), false);
  assert.equal(isPlatformAdminRole("employer"), false);
  assert.equal(isPlatformAdminRole("moderator"), true);
  assert.equal(isPlatformAdminRole("country_admin"), true);
  assert.equal(isPlatformAdminRole("super_admin"), true);
});
