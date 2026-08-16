import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const decision = JSON.parse(fs.readFileSync("docs/data/duta-layanan-2d-product-owner-decision.json", "utf8"));
const seed = fs.readFileSync("supabase/seeds/duta_layanan_2d_verified_services.sql", "utf8");
const preflight = fs.readFileSync("supabase/tests/duta_layanan_2d_collision_preflight.sql", "utf8");

test("product-owner decision freezes 28 stable mission-service identities", () => {
  assert.equal(decision.services.length, 28);
  assert.equal(new Set(decision.services.map(([id]) => id)).size, 28);
  assert.equal(decision.services.filter(([, , , state]) => state === "LOCATOR_COMPLETE").length, 17);
  assert.equal(decision.services.filter(([, , , state]) => state === "GRANULAR_EVIDENCE_LOCATOR_PENDING").length, 11);
});

test("pending granular evidence stays explicit under the LAYANAN-2E review path", () => {
  assert.match(seed, /DUTA_REVIEWED_VERIFIED; GRANULAR_EVIDENCE_LOCATOR_PENDING/);
  assert.match(seed, /case when locator_complete then 'VERIFIED_OFFICIAL'.*else 'VERIFIED_CURRENT'/s);
  assert.match(seed, /provenance_class='DUTA_REVIEWED_VERIFIED'\) <> 11/);
});

test("six offices use namespace-separated target-specific evidence", () => {
  const officeEvidenceIds = seed.match(/75620000-0000-0000-0000-00000000000[1-6]/g) ?? [];
  assert.equal(new Set(officeEvidenceIds).size, 6);
  assert.match(seed, /LAYANAN_2D_OFFICE_IDENTITY_COLLISION/);
});

test("population package is transactional and preflight is select-only", () => {
  assert.match(seed.trim(), /^begin;/i);
  assert.match(seed.trim(), /commit;$/i);
  assert.doesNotMatch(preflight, /\b(insert|update|delete|alter|drop|create|truncate|grant|revoke)\b/i);
  assert.match(preflight.trim(), /^--[\s\S]*with /i);
});
