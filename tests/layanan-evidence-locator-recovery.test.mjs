import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const canonical = readFileSync(
  new URL("../docs/data/DUTA_LAYANAN_OPERATIONAL_EVIDENCE_V1.md", import.meta.url),
  "utf8",
);
const matrix = readFileSync(
  new URL("../docs/data/DUTA_LAYANAN_EVIDENCE_RECOVERY_MATRIX_V1.md", import.meta.url),
  "utf8",
);

test("locator manifest contains the required audit fields", () => {
  for (const heading of [
    "Mission code", "Target type", "Stable target code", "Official source ID",
    "Evidence locator", "Evidence scope", "Verification classification",
    "Effective/currentness classification",
  ]) assert.match(canonical, new RegExp(heading));
});

test("each mission has at least one resolved concrete service locator", () => {
  for (const mission of ["KBRI-KUL", "KJRI-JHB", "KJRI-PEN", "KJRI-KCH", "KJRI-BKI", "KRI-TWU"]) {
    assert.match(canonical, new RegExp(`\\| ${mission} \\| MISSION_SERVICE \\|[^\n]+RESOLVED_PUBLISHABLE`));
  }
});

test("fee rows never use a mission homepage as tariff evidence", () => {
  for (const code of ["KUL_2026_TARIFF_SET", "BKI_2026_TARIFF_SET", "TWU_2026_TARIFF_SET", "PEN_2026_TARIFF_SET"]) {
    assert.match(canonical, new RegExp(`\\| FEE \\| ${code} \\|[^\n]+\\| unresolved \\|`));
  }
  assert.match(canonical, /without treating any homepage as fee evidence/);
});

test("purpose-specific contacts retain exact official locators", () => {
  assert.match(canonical, /johorbahru[^\n]+IMMIGRATION_HOTLINE|IMMIGRATION_HOTLINE[^\n]+johorbahru/);
  assert.match(canonical, /PUBLIC_HOTLINE_SET[^\n]+nomor-hotline-layanan-publik/);
  assert.match(canonical, /SERVICE_HOTLINE[^\n]+UNRESOLVED_EXACT_FIELD/);
  assert.match(canonical, /PROTECTION_HOTLINE[^\n]+UNRESOLVED_EXACT_FIELD/);
});

test("recovery counts remain explicit and fail closed", () => {
  assert.match(matrix, /17\/28/);
  assert.match(matrix, /6\/8/);
  assert.match(matrix, /0\/80/);
  assert.match(matrix, /Mission core readiness: 6\/6/);
  assert.match(matrix, /must exclude all 80 fee candidates/);
});
