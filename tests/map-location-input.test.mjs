import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const form = read("src/components/map/place-submission-form.tsx");
const route = read("src/app/api/geocode/route.ts");
const action = read("src/app/map/actions.ts");
const config = read("next.config.ts");

test("place coordinates are internal and require explicit confirmation", () => {
  assert.match(form, /type="hidden" name="latitude"/);
  assert.match(form, /type="hidden" name="longitude"/);
  assert.doesNotMatch(form, /label="Latitude/);
  assert.match(action, /locationConfirmed/);
  assert.match(form, /Konfirmasi lokasi ini/);
});

test("GPS is requested only by an explicit button action", () => {
  assert.match(form, /onClick=\{useCurrentLocation\}/);
  assert.match(form, /navigator\.geolocation\.getCurrentPosition/);
  assert.doesNotMatch(form, /useEffect/);
  assert.match(form, /Izin lokasi tidak diberikan/);
});

test("address geocoding is authenticated, server-side, country-aware and keyless", () => {
  assert.match(route, /supabase\.auth\.getUser/);
  assert.match(route, /profile\.current_country_code\.toLowerCase\(\)/);
  assert.match(route, /nominatim\.openstreetmap\.org/);
  assert.match(route, /User-Agent/);
  assert.match(route, /lastProviderRequestAt/);
  assert.match(form, /dikirim ke layanan tersebut hanya setelah Anda memilih salah satu tombol/);
  assert.doesNotMatch(form, /nominatim\.openstreetmap\.org/);
  assert.doesNotMatch(route, /API_KEY|service_role/i);
});

test("map preview is narrowly allowed by CSP", () => {
  assert.match(form, /www\.openstreetmap\.org\/export\/embed\.html/);
  assert.match(config, /frame-src https:\/\/www\.openstreetmap\.org/);
  assert.match(config, /frame-ancestors 'none'/);
});
