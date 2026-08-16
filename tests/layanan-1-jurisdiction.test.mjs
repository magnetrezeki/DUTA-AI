import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  malaysiaJurisdictions,
  normalizeMalaysiaLocation,
  resolveMalaysiaJurisdiction,
  sabahDistrictOptions,
} from "../src/config/malaysia-jurisdictions.ts";

const expectedStateRoutes = {
  "Kuala Lumpur": "KBRI-KUL", Putrajaya: "KBRI-KUL", Selangor: "KBRI-KUL", Perak: "KBRI-KUL", Kelantan: "KBRI-KUL", Terengganu: "KBRI-KUL",
  Johor: "KJRI-JHB", Melaka: "KJRI-JHB", "Negeri Sembilan": "KJRI-JHB", Pahang: "KJRI-JHB",
  "Pulau Pinang": "KJRI-PEN", Kedah: "KJRI-PEN", Perlis: "KJRI-PEN", Sarawak: "KJRI-KCH", "WP Labuan": "KJRI-BKI",
};

test("all frozen state-level jurisdictions resolve deterministically", () => {
  for (const [state, missionCode] of Object.entries(expectedStateRoutes)) {
    assert.deepEqual(resolveMalaysiaJurisdiction(state), { status: "resolved", missionCode, canonicalState: state, canonicalDistrict: null });
    assert.deepEqual(resolveMalaysiaJurisdiction(state), resolveMalaysiaJurisdiction(state));
  }
});

test("all 28 frozen Sabah/Labuan entries are represented", () => {
  const kotaKinabaluDistricts = [
    "Beluran", "Beaufort", "Keningau", "Kinabatangan", "Kota Belud", "Kota Kinabalu", "Kota Marudu",
    "Kuala Penyu", "Kudat", "Nabawan", "Papar", "Penampang", "Pitas", "Putatan", "Ranau", "Sandakan",
    "Sipitang", "Tambunan", "Telupid", "Tenom", "Tongod", "Tuaran",
  ];
  assert.equal(sabahDistrictOptions.length, 27);
  assert.equal(sabahDistrictOptions.filter((value) => resolveMalaysiaJurisdiction("Sabah", value).status === "resolved").length, 27);
  for (const district of kotaKinabaluDistricts) {
    const result = resolveMalaysiaJurisdiction("Sabah", district);
    assert.equal(result.status === "resolved" && result.missionCode, "KJRI-BKI");
  }
  assert.equal(resolveMalaysiaJurisdiction("WP Labuan").status, "resolved");
});

test("Tawau-area districts take precedence over proximity", () => {
  for (const district of ["Tawau", "Kunak", "Semporna", "Lahad Datu", "Kalabakan"]) {
    assert.equal(resolveMalaysiaJurisdiction("Sabah", district).status === "resolved" && resolveMalaysiaJurisdiction("Sabah", district).missionCode, "KRI-TWU");
  }
});

test("Sabah fails closed without a known district", () => {
  assert.deepEqual(resolveMalaysiaJurisdiction("Sabah"), { status: "ambiguous", reason: "district_required" });
  assert.deepEqual(resolveMalaysiaJurisdiction("Sabah", "Daerah Tidak Dikenal"), { status: "unsupported", reason: "unknown_location" });
});

test("approved aliases normalize without fuzzy routing", () => {
  assert.equal(normalizeMalaysiaLocation(" KL "), "kuala lumpur");
  assert.equal(normalizeMalaysiaLocation("Penang"), "pulau pinang");
  assert.equal(resolveMalaysiaJurisdiction("Labuan").status === "resolved" && resolveMalaysiaJurisdiction("Labuan").missionCode, "KJRI-BKI");
  assert.deepEqual(resolveMalaysiaJurisdiction("unknown"), { status: "unsupported", reason: "unknown_location" });
});

test("canonical dataset has no duplicate route identity", () => {
  const keys = malaysiaJurisdictions.map((item) => `${item.state}|${item.district ?? ""}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("database baseline is transactional, deterministic and fail closed", () => {
  const seed = readFileSync(new URL("../supabase/seeds/duta_layanan_1_malaysia_jurisdictions.sql", import.meta.url), "utf8");
  assert.match(seed, /^begin;/i);
  assert.match(seed, /commit;\s*$/i);
  assert.equal((seed.match(/'75100000-0000-0000-0000-0000000000\d{2}'/g) ?? []).length, 42);
  assert.match(seed, /routing_priority, enabled, publishability_status[\s\S]*false, 'UNVERIFIED'/);
  assert.doesNotMatch(seed, /delete\s+from|truncate|drop\s+table|alter\s+table/i);
});

test("hosted collision preflight is SELECT-only and RLS test rolls back", () => {
  const preflight = readFileSync(new URL("../supabase/tests/duta_layanan_1_collision_preflight.sql", import.meta.url), "utf8");
  const hosted = readFileSync(new URL("../supabase/tests/duta_layanan_1_hosted_rls_test.sql", import.meta.url), "utf8");
  assert.match(preflight, /^--[^\n]*\nwith /i);
  assert.doesNotMatch(preflight, /\b(insert|update|delete|alter|drop|truncate|grant|revoke)\b/i);
  assert.match(hosted, /^begin;/i);
  assert.match(hosted, /rollback;\s*$/i);
  assert.doesNotMatch(hosted, /\bcommit\b/i);
});
