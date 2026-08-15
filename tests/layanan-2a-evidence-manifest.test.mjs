import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manifestText = readFileSync(
  new URL("../docs/data/duta-layanan-2a-production-evidence-manifest.json", import.meta.url),
  "utf8",
);
const manifest = JSON.parse(manifestText);
const preflight = readFileSync(
  new URL("../supabase/tests/duta_layanan_2a_collision_preflight.sql", import.meta.url),
  "utf8",
);
const tawau = manifest.missions.find((mission) => mission.missionCode === "KRI-TWU");

test("LAYANAN-2A freezes the six mission identities without demo reuse", () => {
  assert.equal(manifest.missions.length, 6);
  assert.equal(new Set(manifest.missions.map((mission) => mission.missionCode)).size, 6);
  assert.equal(tawau.office.id, "75000000-0000-0000-0000-000000000006");
  assert.equal(tawau.office.isDemo, false);
});

test("KRI Tawau has exactly the five approved district jurisdictions", () => {
  assert.deepEqual(
    tawau.jurisdictions.map((item) => item.district).sort(),
    ["Kalabakan", "Kunak", "Lahad Datu", "Semporna", "Tawau"],
  );
  assert.ok(tawau.jurisdictions.every((item) => item.type === "DISTRICT" && item.status === "VERIFIED"));
});

test("KRI Tawau contact values are normalized without changing raw evidence", () => {
  assert.deepEqual(
    tawau.contacts.filter((item) => item.type === "phone").map((item) => item.e164Phone).sort(),
    ["+6089752969", "+6089772052"],
  );
  assert.equal(tawau.contacts.find((item) => item.type === "email").normalizedValue, "tawau.kri@kemlu.go.id");
  assert.equal(tawau.contacts.find((item) => item.type === "website").url, "https://kemlu.go.id/tawau");
});

test("manifest keeps unsupported operational details absent", () => {
  assert.deepEqual(tawau.serviceCategories, []);
  assert.deepEqual(tawau.missionServices, []);
  assert.deepEqual(tawau.fees, []);
  assert.deepEqual(tawau.requirements, []);
  assert.deepEqual(tawau.appointments, []);
  assert.deepEqual(tawau.hours, []);
  assert.equal(tawau.readiness, "PARTIAL");
});

test("evidence associations are target-specific and deterministic", () => {
  assert.equal(tawau.evidenceAssociations.length, 10);
  assert.equal(new Set(tawau.evidenceAssociations.map((item) => item.id)).size, 10);
  assert.ok(tawau.evidenceAssociations.every((item) => item.targetType && item.targetId));
});

test("LAYANAN-2A collision preflight is SELECT-only", () => {
  assert.doesNotMatch(preflight, /\b(insert|update|delete|merge|truncate|alter|drop|create|grant|revoke|begin|commit)\b/i);
  assert.match(preflight, /public\.official_service_evidence/);
  assert.match(preflight, /public\.service_data_conflicts/);
});
