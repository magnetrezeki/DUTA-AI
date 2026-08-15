import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const seedPath = "supabase/seeds/duta_layanan_2d_verified_services.sql";
const seed = fs.readFileSync(seedPath, "utf8");

function sqlFiles(directory) {
  return fs.readdirSync(directory)
    .filter((entry) => entry.endsWith(".sql"))
    .map((entry) => path.join(directory, entry));
}

test("deployment SQL has no relation or CTE alias named natural", () => {
  const files = ["supabase/tests", "supabase/migrations", "supabase/seeds", "supabase/recovery"]
    .flatMap(sqlFiles);
  const unsafeAlias = /(?:\bas\s+natural\b|\bjoin\s+[\w.]+\s+natural\b|\)\s+natural\s*(?:\(|,|as))/i;
  for (const file of files) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), unsafeAlias, file);
  }
  assert.match(seed, /service_categories natural_match on natural_match\.service_code/);
});

test("population SQL retains one complete transaction and balanced DO blocks", () => {
  assert.match(seed.trim(), /^begin;/i);
  assert.match(seed.trim(), /commit;$/i);
  assert.equal((seed.match(/\bdo \$\$/gi) ?? []).length, (seed.match(/end \$\$;/gi) ?? []).length);
  assert.equal((seed.match(/^begin;/gim) ?? []).length, 1);
  assert.equal((seed.match(/^commit;/gim) ?? []).length, 1);
});

test("typed deterministic inserts and guarded conflicts remain intact", () => {
  assert.match(seed, /'75000000-0000-0000-0000-000000000001'::uuid/);
  assert.match(seed, /'VERIFIED_OFFICIAL'::public\.service_publishability_status/);
  assert.match(seed, /'DUTA_REVIEWED_VERIFIED'::public\.layanan_provenance_class/);
  assert.match(seed, /array_position\(array\[1,2,4,5,6,7,8,11,12,13,15,16,17,18,19,23,24\]/);
  assert.match(seed, /on conflict\(id\) do update set[\s\S]*where mission_services\.office_id=excluded\.office_id/);
  assert.match(seed, /right\(service\.id::text,12\)/);
  assert.match(seed, /right\(jurisdiction\.id::text,12\)/);
});
