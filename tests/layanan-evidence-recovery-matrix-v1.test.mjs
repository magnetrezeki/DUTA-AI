import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const matrix = readFileSync(
  new URL("../docs/data/DUTA_LAYANAN_EVIDENCE_RECOVERY_MATRIX_V1.md", import.meta.url),
  "utf8",
);

test("recovery matrix defines the exact six fail-closed classifications", () => {
  for (const classification of [
    "RESOLVED_PUBLISHABLE",
    "RESOLVED_NON_PUBLIC",
    "RESOLVED_HISTORICAL",
    "RESOLVED_MODELING_DEBT",
    "SUPERSEDED",
    "UNRESOLVED_EXACT_FIELD",
  ]) {
    assert.match(matrix, new RegExp(classification));
  }
});

test("recovery matrix assesses all six missions", () => {
  for (const mission of ["KBRI-KUL", "KJRI-JHB", "KJRI-PEN", "KJRI-KCH", "KJRI-BKI", "KRI-TWU"]) {
    assert.match(matrix, new RegExp(`\\| ${mission} \\|`));
  }
});

test("minimum readiness requires target-specific evidence rather than a homepage", () => {
  assert.match(matrix, /No mission is declared minimum-ready solely from an official homepage/);
  assert.match(matrix, /official homepage is not substituted/);
  assert.match(matrix, /exact publication URL or official_source_item missing/);
});

test("purpose-specific and general contacts remain separated", () => {
  assert.match(matrix, /Category-mappable contact candidates/);
  assert.match(matrix, /General office websites, emails, and telephone values remain `RESOLVED_MODELING_DEBT`/);
  assert.match(matrix, /constraint is not weakened/);
});

test("hosted population remains unexecuted when package gates are incomplete", () => {
  assert.match(matrix, /Phase E status: NOT RUN/);
  assert.match(matrix, /Phase F status: NOT AUTHORIZED BY GATES/);
  assert.match(matrix, /No hosted write was attempted/);
});
