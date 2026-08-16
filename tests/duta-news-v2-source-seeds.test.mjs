import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const groupA = readFileSync(new URL("../supabase/seeds/duta_news_v2_group_a_sources.sql", import.meta.url), "utf8");
const groupB = readFileSync(new URL("../supabase/seeds/duta_news_v2_group_b_sources.sql", import.meta.url), "utf8");
const groupC = readFileSync(new URL("../supabase/seeds/duta_news_v2_group_c_sources.sql", import.meta.url), "utf8");
const diagnostic = readFileSync(new URL("../supabase/tests/duta_news_v2_group_b_collision_diagnostic.sql", import.meta.url), "utf8");
const groupCDiagnostic = readFileSync(new URL("../supabase/tests/duta_news_v2_group_c_collision_diagnostic.sql", import.meta.url), "utf8");
const uniqueMatches = (value, pattern) => [...new Set(value.match(pattern) ?? [])];
const groupCInsertRows = groupC.match(/from \(values([\s\S]*?)\) as expected\(id, institution_code, publisher_name, source_url, province, region\)/i)?.[1] ?? "";

test("Group A targets exactly the 22 approved deterministic Registry IDs", () => {
  const ids = uniqueMatches(groupA, /71000000-0000-0000-0000-0000000000(?:0[1-9]|1[0-9]|2[0-2])/g);
  assert.equal(ids.length, 22);
  assert.doesNotMatch(groupA, /71000000-0000-0000-0000-0000000000(?:2[3-9]|3[01])/);
  assert.doesNotMatch(groupA, /gen_random_uuid|uuid_generate/i);
});

test("Group A contains exactly the six approved institution codes", () => {
  const codes = uniqueMatches(groupA, /KBRI-KUL|KJRI-JHB|KJRI-PEN|KJRI-KCH|KJRI-BKI|KRI-TWU/g);
  assert.deepEqual(codes.sort(), ["KBRI-KUL", "KJRI-BKI", "KJRI-JHB", "KJRI-KCH", "KJRI-PEN", "KRI-TWU"]);
});

test("Group A excludes legacy, attache, demo and unrelated sources", () => {
  assert.doesNotMatch(groupA, /IndonesiaInKL|ATNAKER|ATKUM|ATDIKBUD|ATHUB|ATDAG|ATPOL|ATIM|ATHAN/);
  assert.doesNotMatch(groupA, /DEMO-DAY2|is_demo\s*=\s*true/i);
  assert.doesNotMatch(groupA, /insert\s+into\s+public\.official_sources/i);
});

test("Group A applies only the frozen News classification and fail-closed ingestion", () => {
  assert.match(groupA, /news_source_type\s*=\s*'INDONESIAN_GOVERNMENT'/);
  assert.match(groupA, /news_source_group\s*=\s*'INDONESIAN_MISSIONS'/);
  assert.match(groupA, /news_primary_region\s*=\s*'MALAYSIA'/);
  assert.match(groupA, /news_enabled\s*=\s*true/);
  assert.match(groupA, /news_ingestion_authorized\s*=\s*false/);
  assert.doesNotMatch(groupA, /last_verified_at\s*=/i);
});

test("Group B defines exactly three stable JIM channels", () => {
  const ids = uniqueMatches(groupB, /72000000-0000-0000-0000-00000000000[1-3]/g);
  assert.equal(ids.length, 3);
  assert.doesNotMatch(groupB, /72000000-0000-0000-0000-00000000000[4-9]/);
  assert.doesNotMatch(groupB, /gen_random_uuid|uuid_generate/i);
  assert.match(groupB, /'JIM-MYS'/);
});

test("Group B uses the three exact approved canonical URLs", () => {
  for (const url of [
    "https://www.imi.gov.my/",
    "https://www.facebook.com/imigresen/",
    "https://www.instagram.com/imigresen/",
  ]) assert.ok(groupB.includes(url));
});

test("Group B records the approved DUTA review date and evidence references", () => {
  assert.match(groupB, /2026-08-11 00:00:00\+08/g);
  assert.match(groupB, /penafian-akaun-facebook-palsu-imigresen-en/);
  assert.match(groupB, /BROUCHER%20IMIGRESEN\.pdf/);
  assert.match(groupB, /DUTA reviewed 2026-08-11/);
});

test("Group B enables visibility but never authorizes ingestion", () => {
  assert.match(groupB, /true, 'MALAYSIAN_GOVERNMENT', 'MALAYSIAN_GOVERNMENT', 'MALAYSIA', false/g);
  assert.doesNotMatch(groupB, /news_ingestion_authorized\s*=\s*true/i);
  assert.doesNotMatch(groupB, /integration_enabled\s*=\s*true/i);
  assert.doesNotMatch(groupB, /authorized_feed|authorized_api|\bRSS\b|scrap/i);
});

test("source-only seeds contain no article, ingestion or thumbnail rows", () => {
  const combined = `${groupA}\n${groupB}\n${groupC}`;
  assert.doesNotMatch(combined, /insert\s+into\s+public\.(news_items|official_source_items|news_source_integrations|news_source_assessments)/i);
  assert.doesNotMatch(combined, /thumbnail_permission|thumbnail_url|feed_url|endpoint_url/i);
});

test("source-only seeds contain no destructive SQL", () => {
  const combined = `${groupA}\n${groupB}\n${groupC}`;
  assert.doesNotMatch(combined, /^\s*(delete|truncate|drop|alter)\b/im);
  assert.doesNotMatch(combined, /disable\s+row\s+level\s+security/i);
});

test("Group A update is exact and Group B upsert is collision guarded", () => {
  assert.match(groupA, /where id in \(/i);
  assert.match(groupA, /matched_count <> 22/);
  assert.match(groupB, /on conflict \(id\) do update/i);
  assert.match(groupB, /deterministic UUID collision/);
  assert.match(groupB, /canonical URL collision/);
  assert.match(groupB, /institution\/channel collision/);
  assert.match(groupB, /regexp_replace\(replace\(lower\(source\.source_url\), ':\/\/www\.'/);
  assert.match(groupB, /activated_count <> 3/);
});

test("only official_sources is mutated by either seed", () => {
  const mutations = [...`${groupA}\n${groupB}\n${groupC}`.matchAll(/\b(?:insert into|update)\s+public\.([a-z_]+)/gi)].map((match) => match[1]);
  assert.ok(mutations.length > 0);
  assert.deepEqual([...new Set(mutations)], ["official_sources"]);
});

test("Group B hosted collision diagnostic is one SELECT-only statement", () => {
  assert.match(diagnostic, /^with\s/i);
  assert.match(diagnostic, /select[\s\S]*NO_COLLISION_FOUND/i);
  assert.match(diagnostic, /NORMALIZED_URL_COLLISION/);
  assert.doesNotMatch(diagnostic, /^\s*(insert|update|delete|create|alter|drop|truncate|grant|revoke|begin|commit)\b/im);
  assert.doesNotMatch(diagnostic, /;[\s\S]*\S/);
});

test("Group C targets exactly the 26 approved deterministic Registry IDs", () => {
  const ids = uniqueMatches(groupC, /73000000-0000-0000-0000-0000000000(?:0[1-9]|1[0-9]|2[0-6])/g);
  assert.equal(ids.length, 26);
  assert.doesNotMatch(groupC, /73000000-0000-0000-0000-0000000000(?:2[7-9]|3[0-9])/);
  assert.doesNotMatch(groupC, /gen_random_uuid|uuid_generate/i);
});

test("Group C uses every reviewed canonical URL and no rejected Padang domain", () => {
  const urls = uniqueMatches(groupCDiagnostic, /https:\/\/[^']+\//g);
  assert.equal(urls.length, 26);
  for (const url of urls) assert.ok(groupC.includes(url), `missing ${url}`);
  assert.match(groupC, /https:\/\/padek\.jawapos\.com\//);
  assert.doesNotMatch(groupC, /padangekspres\.co\.id/i);
});

test("Group C preserves one Registry identity per reviewed publisher alias set", () => {
  for (const code of ["MEDIA-SUMEKS", "MEDIA-SRIPOKU", "MEDIA-SURYA", "MEDIA-POS-KUPANG", "MEDIA-CENDERAWASIH-POS"]) {
    assert.equal((groupCInsertRows.match(new RegExp(`'${code}'`, "g")) ?? []).length, 1);
  }
  assert.equal((groupCInsertRows.match(/'73000000-0000-0000-0000-0000000000(?:0[1-9]|1[0-9]|2[0-6])'::uuid/g) ?? []).length, 26);
});

test("Group C applies the frozen media classifications and Indonesian country", () => {
  assert.match(groupC, /'news', 'ID'/);
  assert.match(groupC, /true, 'MEDIA', 'INDONESIAN_MEDIA', region, false/);
  assert.doesNotMatch(groupC, /INDONESIAN_REGIONAL_MEDIA/);
  assert.match(groupC, /news_source_type = 'MEDIA'/);
  assert.match(groupC, /news_source_group = 'INDONESIAN_MEDIA'/);
});

test("Group C records the reviewed regional and province mapping", () => {
  const expectedRegions = new Map([
    ["SUMATERA", 8], ["JAWA", 5], ["NASIONAL", 1], ["NTT", 2],
    ["NTB", 2], ["KALIMANTAN", 3], ["SULAWESI", 3], ["PAPUA", 2],
  ]);
  for (const [region, count] of expectedRegions) {
    const rows = groupCInsertRows.match(new RegExp(`'${region}'(?:::public\\.news_region)?\\)`, "g")) ?? [];
    assert.equal(rows.length, count, `${region} mapping incomplete`);
  }
  for (const province of [
    "SUMATERA UTARA", "SUMATERA BARAT", "SUMATERA SELATAN", "RIAU", "KEPULAUAN RIAU",
    "JAWA TIMUR", "JAWA TENGAH", "JAWA BARAT", "NUSA TENGGARA TIMUR",
    "NUSA TENGGARA BARAT", "KALIMANTAN SELATAN", "KALIMANTAN TIMUR",
    "KALIMANTAN BARAT", "SULAWESI SELATAN", "SULAWESI UTARA", "PAPUA",
  ]) assert.ok(groupC.includes(province), `missing ${province}`);
});

test("Group C gives only Kompas.com the national classification", () => {
  assert.match(groupC, /'MEDIA-KOMPAS', 'Kompas\.com', 'https:\/\/www\.kompas\.com\/', 'NASIONAL', 'NASIONAL'/);
  assert.equal((groupC.match(/'NASIONAL', 'NASIONAL'/g) ?? []).length, 1);
});

test("Group C records DUTA review time without enabling ingestion", () => {
  assert.match(groupC, /2026-08-11 00:00:00\+08/);
  assert.match(groupC, /DUTA reviewed 2026-08-11/);
  assert.match(groupC, /news_enabled/);
  assert.match(groupC, /news_ingestion_authorized/);
  assert.doesNotMatch(groupC, /news_ingestion_authorized\s*=\s*true/i);
  assert.doesNotMatch(groupC, /integration_enabled\s*=\s*true/i);
  assert.doesNotMatch(groupC, /authorized_feed|authorized_api|\bRSS\b|scrap|cron|worker/i);
});

test("Group C does not escalate thumbnails or create articles and provenance rows", () => {
  assert.doesNotMatch(groupC, /thumbnail_permission|thumbnail_url|SOURCE_METADATA|EXPLICITLY_ALLOWED/i);
  assert.doesNotMatch(groupC, /insert\s+into\s+public\.(news_items|official_source_items|news_source_integrations|news_source_assessments)/i);
});

test("Group C is collision guarded and updates only approved News V2 fields", () => {
  assert.match(groupC, /on conflict \(id\) do update set/i);
  assert.match(groupC, /deterministic UUID collision/);
  assert.match(groupC, /canonical URL collision/);
  assert.match(groupC, /institution code collision/);
  const update = groupC.match(/on conflict \(id\) do update set([\s\S]*?)where public\.official_sources/i)?.[1] ?? "";
  assert.deepEqual(
    uniqueMatches(update, /news_(?:enabled|source_type|source_group|primary_region|ingestion_authorized)/g).sort(),
    ["news_enabled", "news_ingestion_authorized", "news_primary_region", "news_source_group", "news_source_type"],
  );
  assert.match(groupC, /activated_count <> 26/);
});

test("Group C leaves Group A, Group B, demo and unrelated identities untouched", () => {
  assert.doesNotMatch(groupC, /71000000-|72000000-|10000000-|KBRI-|KJRI-|KRI-|JIM-MYS|DEMO-DAY2/);
  assert.doesNotMatch(groupC, /^\s*update\s+public\.official_sources/im);
  assert.doesNotMatch(groupC, /^\s*(delete|truncate|drop|alter)\b/im);
});

test("Group C hosted collision diagnostic is one SELECT-only 26-source manifest", () => {
  assert.match(groupCDiagnostic, /^with\s/i);
  assert.equal(uniqueMatches(groupCDiagnostic, /73000000-0000-0000-0000-0000000000(?:0[1-9]|1[0-9]|2[0-6])/g).length, 26);
  assert.match(groupCDiagnostic, /NO_COLLISION_FOUND/);
  assert.doesNotMatch(groupCDiagnostic, /^\s*(insert|update|delete|create|alter|drop|truncate|grant|revoke|begin|commit)\b/im);
  assert.doesNotMatch(groupCDiagnostic, /;[\s\S]*\S/);
});
