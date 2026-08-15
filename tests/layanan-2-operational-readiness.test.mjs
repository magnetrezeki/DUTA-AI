import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const preflight = readFileSync(
  new URL("../supabase/tests/duta_layanan_2_operational_preflight.sql", import.meta.url),
  "utf8",
);
const validation = readFileSync(
  new URL("../supabase/tests/duta_layanan_2_post_population_validation.sql", import.meta.url),
  "utf8",
);
const route = readFileSync(
  new URL("../src/app/layanan/page.tsx", import.meta.url),
  "utf8",
);

const forbiddenWrite = /\b(insert|update|delete|merge|truncate|alter|drop|create|grant|revoke|commit|begin)\b/i;

test("LAYANAN-2 diagnostics are SELECT-only", () => {
  assert.doesNotMatch(preflight, forbiddenWrite);
  assert.doesNotMatch(validation, forbiddenWrite);
});

test("LAYANAN-2 preflight covers all six frozen mission identities", () => {
  for (const missionCode of [
    "KBRI-KUL",
    "KJRI-JHB",
    "KJRI-PEN",
    "KJRI-KCH",
    "KJRI-BKI",
    "KRI-TWU",
  ]) {
    assert.match(preflight, new RegExp(missionCode, "g"));
    assert.match(validation, new RegExp(missionCode, "g"));
  }
});

test("LAYANAN-2 preflight audits each required operational layer", () => {
  for (const relation of [
    "official_sources",
    "representative_offices",
    "office_jurisdictions",
    "service_categories",
    "mission_services",
    "office_contact_channels",
    "official_service_evidence",
    "service_data_conflicts",
  ]) {
    assert.match(preflight, new RegExp(`public\\.${relation}`));
  }
});

test("LAYANAN-2 validation uses only curated public readers", () => {
  for (const reader of [
    "layanan_public_offices",
    "layanan_public_jurisdictions",
    "layanan_public_mission_services",
    "layanan_public_contact_channels",
    "layanan_public_fees",
    "layanan_public_requirements",
    "layanan_public_appointments",
    "layanan_public_hours",
  ]) {
    assert.match(validation, new RegExp(`public\\.${reader}`));
  }
});

test("LAYANAN-2 readiness requires office, jurisdiction, service, and contact", () => {
  assert.match(validation, /public_office_present/);
  assert.match(validation, /public_jurisdictions/);
  assert.match(validation, /public_services/);
  assert.match(validation, /public_contacts/);
  assert.match(validation, /complete_minimum_public_chain/);
});

test("/layanan consumes only curated operational readers and handles empty evidence-gated children", () => {
  for (const reader of [
    "layanan_public_offices",
    "layanan_public_jurisdictions",
    "layanan_public_mission_services",
    "layanan_public_contact_channels",
    "layanan_public_fees",
  ]) assert.match(route, new RegExp(`from\\(\"${reader}\"\\)`));
  assert.doesNotMatch(route, /from\("(?:representative_offices|office_jurisdictions|mission_services|office_contact_channels|mission_service_fees)"\)/);
  assert.match(route, /Belum ada kontak yang memenuhi bukti dan syarat publikasi/);
  assert.match(route, /Belum ada biaya yang memenuhi bukti dan syarat publikasi/);
  assert.match(route, /Tidak ada data yang diterka atau ditampilkan dari tabel privat/);
});
