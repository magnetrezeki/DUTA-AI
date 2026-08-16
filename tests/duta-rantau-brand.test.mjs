import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("shared chrome and home use the approved DUTA Rantau assets", () => {
  const brandMark = read("src/components/layout/brand-mark.tsx");
  const home = read("src/app/page.tsx");
  const layout = read("src/app/layout.tsx");

  assert.match(brandMark, /duta-rantau-mark\.webp/);
  assert.match(brandMark, /DUTA .*RANTAU/);
  assert.match(home, /duta-rantau-brand\.webp/);
  assert.match(home, /alt="DUTA Rantau — Bersama, Terhubung, Berdaya"/);
  assert.match(layout, /duta-rantau-mark\.webp/);
  assert.match(layout, /duta-rantau-brand\.webp/);
});
