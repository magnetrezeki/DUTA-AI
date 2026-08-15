import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const evidence = readFileSync(
  new URL("../docs/data/DUTA_LAYANAN_OPERATIONAL_EVIDENCE_V1.md", import.meta.url),
  "utf8",
);

test("master evidence manifest freezes all six source identities", () => {
  for (const [mission, sourceId] of [
    ["KBRI-KUL", "71000000-0000-0000-0000-000000000001"],
    ["KJRI-JHB", "71000000-0000-0000-0000-000000000006"],
    ["KJRI-PEN", "71000000-0000-0000-0000-000000000009"],
    ["KJRI-KCH", "71000000-0000-0000-0000-000000000016"],
    ["KJRI-BKI", "71000000-0000-0000-0000-000000000014"],
    ["KRI-TWU", "71000000-0000-0000-0000-000000000019"],
  ]) {
    assert.match(evidence, new RegExp(mission));
    assert.match(evidence, new RegExp(sourceId));
  }
});

test("KRI Tawau jurisdiction is exactly the five approved districts", () => {
  for (const district of ["Tawau", "Kalabakan", "Kunak", "Lahad Datu", "Semporna"]) {
    assert.match(evidence, new RegExp(`District jurisdiction \\| ${district} \\| VERIFIED`));
  }
  assert.match(evidence, /No whole-Sabah KRI Tawau jurisdiction is authorized/);
});

test("explicit current tariffs retain their approved effective dates", () => {
  assert.match(evidence, /KRI Tawau[\s\S]*effective `2026-05-01`/);
  assert.match(evidence, /KJRI Kota Kinabalu[\s\S]*Tariff effective date: `2026-05-05`/);
  assert.match(evidence, /KBRI Kuala Lumpur[\s\S]*Effective date: `2026-05-01`/);
});

test("historical and date-uncertain evidence remains fail closed", () => {
  assert.match(evidence, /HISTORICAL \/ REQUIRES CURRENT REVERIFICATION/);
  assert.match(evidence, /OFFICIAL_BUT_DATE_UNCERTAIN/);
  assert.match(evidence, /must not be published as current/);
});

test("service-specific contacts retain their distinct purpose", () => {
  for (const purpose of ["DEATH_OF_WNI", "EMPLOYMENT", "IMMIGRATION", "PROTECTION", "APPOINTMENT"]) {
    assert.match(evidence, new RegExp(purpose));
  }
  assert.match(evidence, /never general hotline/);
});

test("missing exact evidence is reported rather than fabricated", () => {
  assert.match(evidence, /Exact tariff rows are absent/);
  assert.match(evidence, /No amount or date is invented/);
  assert.match(evidence, /No requirements or operating-hours evidence is supplied/);
  assert.match(evidence, /constraint must not be weakened/);
});
