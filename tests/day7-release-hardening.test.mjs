import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("production environment template contains only the four approved variables", () => {
  const names = read(".env.example").split(/\r?\n/).filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line)).map((line) => line.split("=")[0]);
  assert.deepEqual(names, ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "OPENAI_API_KEY"]);
});
test("the optional OpenAI secret is never public-prefixed", () => assert.doesNotMatch(read(".env.example"), /NEXT_PUBLIC_OPENAI/));
test("baseline production security headers are configured", () => {
  const config = read("next.config.ts");
  for (const header of ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) assert.match(config, new RegExp(header));
});
test("auth email redirects use configured app URL rather than request origin", () => {
  const actions = read("src/app/(auth)/actions.ts");
  assert.match(actions, /appUrl\("\/auth\/callback/);
  assert.doesNotMatch(actions, /headers\(\)|get\("origin"\)/);
});
test("private routes are excluded from search indexing", () => {
  const robots = read("src/app/robots.ts");
  const privateMetadata = read("src/lib/seo.ts");
  for (const route of ["/admin", "/dashboard", "/employer", "/organization-admin", "/career/passport"]) assert.match(robots, new RegExp(route.replace("/", "\\/")));
  assert.match(privateMetadata, /index: false/);
});
test("public routes have a sitemap and share metadata", () => {
  assert.ok(existsSync(new URL("../src/app/sitemap.ts", import.meta.url)));
  assert.match(read("src/app/layout.tsx"), /openGraph/);
});
test("404 and unexpected application errors have safe localized fallbacks", () => {
  assert.ok(existsSync(new URL("../src/app/not-found.tsx", import.meta.url)));
  const error = read("src/app/error.tsx");
  assert.match(error, /tidak ditampilkan/);
  assert.doesNotMatch(error, /error\.message/);
});
test("mobile navigation has a compact small-screen menu", () => {
  const header = read("src/components/layout/site-header.tsx");
  assert.match(header, /lg:hidden/);
  assert.match(header, /hidden items-center.*lg:flex/);
});
test("Day 7 adds no database migration", () => {
  for (const day of [1, 2, 3, 4, 5]) assert.ok(existsSync(new URL(`../supabase/migrations/20260808000${day}_day${day}_${["auth_foundation", "connect_news", "duta_map", "community_os", "duta_karier"][day - 1]}.sql`, import.meta.url)));
  assert.equal(existsSync(new URL("../supabase/migrations/202608080007_day7.sql", import.meta.url)), false);
});
test("release documentation does not claim backup or deployment is complete", () => {
  const checklist = read("docs/PRODUCTION_RELEASE_CHECKLIST.md");
  const runbook = read("docs/OPERATIONS_RUNBOOK.md");
  assert.match(checklist, /CONDITIONAL GO/);
  assert.match(runbook, /NOT YET MANUALLY VERIFIED/);
  assert.match(checklist, /Must remove before production/i);
});
