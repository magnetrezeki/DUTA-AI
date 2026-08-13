import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const countrySeed = readFileSync(new URL("../supabase/seeds/duta_country_indonesia.sql", import.meta.url), "utf8");
const diagnostic = readFileSync(new URL("../supabase/tests/duta_country_indonesia_collision_diagnostic.sql", import.meta.url), "utf8");
const groupA = readFileSync(new URL("../supabase/seeds/duta_news_v2_group_a_sources.sql", import.meta.url), "utf8");
const groupB = readFileSync(new URL("../supabase/seeds/duta_news_v2_group_b_sources.sql", import.meta.url), "utf8");
const groupC = readFileSync(new URL("../supabase/seeds/duta_news_v2_group_c_sources.sql", import.meta.url), "utf8");
const day1 = readFileSync(new URL("../supabase/migrations/202608080001_day1_auth_foundation.sql", import.meta.url), "utf8");
const newsV2 = readFileSync(new URL("../supabase/migrations/202608110002_duta_news_v2_schema.sql", import.meta.url), "utf8");
const onboardingPage = readFileSync(new URL("../src/app/onboarding/page.tsx", import.meta.url), "utf8");
const onboardingActions = readFileSync(new URL("../src/app/onboarding/actions.ts", import.meta.url), "utf8");

test("Indonesia seed defines exactly one deterministic inactive country row", () => {
  assert.equal((countrySeed.match(/insert into public\.countries/gi) ?? []).length, 1);
  assert.match(countrySeed, /values \(\s*'ID',\s*'Indonesia',\s*false,/i);
  assert.doesNotMatch(countrySeed, /gen_random_uuid|uuid_generate|\brandom\s*\(/i);
});

test("Indonesia seed follows the established ISO provenance and DUTA verification convention", () => {
  assert.match(countrySeed, /https:\/\/www\.iso\.org\/obp\/ui\/#iso:code:3166:ID/);
  assert.match(countrySeed, /'verified',\s*'2026-08-11 00:00:00\+08'::timestamptz/);
  assert.match(day1, /https:\/\/www\.iso\.org\/obp\/ui\/#iso:code:3166:MY/);
});

test("Indonesia remains outside the Malaysia-first active-country rollout", () => {
  assert.match(countrySeed, /'Indonesia',\s*false,/);
  assert.match(day1, /using \(is_active = true\)/);
  assert.match(onboardingPage, /\.eq\("is_active", true\)/);
  assert.match(onboardingActions, /\.eq\("is_active", true\)/);
  assert.doesNotMatch(newsV2, /join public\.countries[\s\S]{0,300}is_active/i);
});

test("Indonesia seed is transactional, collision guarded and idempotent", () => {
  assert.match(countrySeed, /^begin;/i);
  assert.match(countrySeed, /commit;\s*$/i);
  assert.match(countrySeed, /ID collision/);
  assert.match(countrySeed, /normalized name collision/);
  assert.match(countrySeed, /on conflict \(code\) do nothing/i);
});

test("Indonesia seed cannot mutate Malaysia or unrelated countries", () => {
  assert.doesNotMatch(countrySeed, /^\s*update\s+public\.countries/im);
  assert.doesNotMatch(countrySeed, /^\s*(delete|truncate|drop|alter)\b/im);
  assert.match(countrySeed, /where code = 'MY'\s+and name = 'Malaysia'/);
  assert.equal((countrySeed.match(/insert into public\.countries/gi) ?? []).length, 1);
});

test("Indonesia seed has no News source, article, ingestion, schema or privilege effects", () => {
  assert.doesNotMatch(countrySeed, /official_sources|official_source_items|news_items|news_source_integrations/i);
  assert.doesNotMatch(countrySeed, /news_ingestion|integration_enabled|feed_url|thumbnail|RSS|scrap|cron|worker/i);
  assert.doesNotMatch(countrySeed, /^\s*(create|alter|drop|grant|revoke)\b/im);
});

test("existing Group A and Group B source seeds remain independent of the country seed", () => {
  assert.doesNotMatch(countrySeed, /71000000-|72000000-|KBRI-|KJRI-|KRI-|JIM-MYS/);
  assert.match(groupA, /news_primary_region = 'MALAYSIA'/);
  assert.match(groupB, /'MALAYSIAN_GOVERNMENT', 'MALAYSIAN_GOVERNMENT', 'MALAYSIA'/);
});

test("the unchanged Group C seed depends on ID and retains its reviewed hash", () => {
  assert.match(groupC, /select id, 'news', 'ID'/);
  assert.equal(
    createHash("sha256").update(groupC).digest("hex").toUpperCase(),
    "F8A2A6E39ECD2A1EEF9D624E580B178ABC57B4E2289BE5659AABF3AF231832ED",
  );
});

test("hosted country collision diagnostic is SELECT-only and checks MY, ID, IDN and Indonesia", () => {
  assert.match(diagnostic, /^with\s/i);
  assert.match(diagnostic, /code in \('MY', 'ID', 'IDN'\)/);
  assert.match(diagnostic, /lower\(trim\(name\)\) = 'indonesia'/);
  assert.doesNotMatch(diagnostic, /^\s*(insert|update|delete|create|alter|drop|truncate|grant|revoke|begin|commit)\b/im);
  assert.doesNotMatch(diagnostic, /;[\s\S]*\S/);
});
