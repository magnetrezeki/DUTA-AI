import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/202608110002_duta_news_v2_schema.sql", import.meta.url),
  "utf8",
);
const registryMigration = readFileSync(
  new URL("../supabase/migrations/202608100001_master_source_registry_v1.sql", import.meta.url),
  "utf8",
);
const day2Migration = readFileSync(
  new URL("../supabase/migrations/202608080002_day2_connect_news.sql", import.meta.url),
  "utf8",
);
const newsPage = readFileSync(new URL("../src/app/news/page.tsx", import.meta.url), "utf8");
const aiTools = readFileSync(new URL("../src/lib/ai/tools.ts", import.meta.url), "utf8");
const sourceReader = readFileSync(new URL("../src/lib/official-sources/server.ts", import.meta.url), "utf8");
const hostedTest = readFileSync(
  new URL("../supabase/tests/duta_news_v2_hosted_rls_test.sql", import.meta.url),
  "utf8",
);

const has = (pattern) => assert.match(migration, pattern);
const lacks = (pattern) => assert.doesNotMatch(migration, pattern);

test("migration is transactional and additive", () => {
  has(/^begin;/i);
  has(/commit;\s*$/i);
  lacks(/\b(drop table|truncate|delete from)\b/i);
});

test("existing migrations are referenced only through extensions", () => {
  has(/alter table public\.official_sources/);
  has(/alter table public\.official_source_items/);
  has(/alter table public\.news_items/);
  lacks(/create table public\.(official_sources|official_source_items|news_items)\s*\(/i);
});

const supportingTables = [
  "news_categories",
  "news_source_category_scopes",
  "news_item_categories",
  "news_editorial_reviews",
  "news_duplicate_relations",
  "news_source_integrations",
  "news_source_assessments",
];

for (const table of supportingTables) {
  test(`${table} is created with RLS enabled`, () => {
    has(new RegExp(`create table public\\.${table} \\(`, "i"));
    has(new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  });
}

test("exactly seven News V2 supporting tables are created", () => {
  const created = [...migration.matchAll(/create table public\.(news_[a-z_]+)\s*\(/gi)]
    .map((match) => match[1]);
  assert.deepEqual(created, supportingTables);
});

test("all frozen editorial categories are controlled enum values", () => {
  for (const category of [
    "GOVERNMENT", "POLITICS", "PUBLIC_POLICY", "ECONOMY", "DEVELOPMENT",
    "INFRASTRUCTURE", "TECHNOLOGY", "DIGITAL_INNOVATION", "EDUCATION",
    "RELIGION", "CULTURE", "INSPIRATION", "POSITIVE_COMMUNITY",
    "ENTERTAINMENT", "TOURISM", "ENVIRONMENT", "DISASTER", "CORRUPTION",
    "PUBLIC_SERVICE", "MIGRATION", "IMMIGRATION", "INDONESIA_MALAYSIA", "DIASPORA",
  ]) has(new RegExp(`'${category}'`));
});

test("ordinary crime and approved exception review reasons exist", () => {
  for (const reason of ["ORDINARY_CRIME", "CORRUPTION_EXCEPTION", "DISASTER_EXCEPTION"])
    has(new RegExp(`'${reason}'`));
});

test("ordinary crime cannot receive an approval decision", () => {
  has(/'ORDINARY_CRIME'[\s\S]*and decision <> 'APPROVE'/);
});

test("corruption and disaster exceptions can be editorially eligible", () => {
  has(/review\.decision = 'APPROVE'[\s\S]*'CORRUPTION_EXCEPTION', 'DISASTER_EXCEPTION'/);
});

test("only the latest editorial decision controls publication", () => {
  has(/review\.id = \([\s\S]*order by latest_review\.reviewed_at desc, latest_review\.id desc[\s\S]*limit 1/);
});

test("private editorial notes are absent from public reader return shape", () => {
  const reader = migration.match(/create or replace function private\.read_news_public_items\(\)[\s\S]*?\n\$\$;/i)?.[0] ?? "";
  assert.ok(reader);
  assert.doesNotMatch(reader.match(/returns table \([\s\S]*?\)\nlang/i)?.[0] ?? "", /private_notes|reviewed_by|risk/i);
});

test("disabled source is hidden", () => has(/source\.enabled\s+and source\.news_enabled/));
test("HOLD source is hidden", () => has(/source\.registry_status = 'VERIFIED'/));
test("LEGACY source is hidden", () => has(/source\.verification_level in \('A', 'B'\)/));
test("unverified source is hidden", () => has(/source\.verification_status = 'verified'/));
test("demo News is hidden", () => has(/and not item\.is_demo/));
test("unpublished article is hidden", () => has(/item\.publication_status = 'published'/));
test("rejected article is hidden", () => has(/item\.editorial_status = 'PUBLISHED'/));
test("hard duplicate is hidden", () => has(/duplicate\.duplicate_kind = 'HARD'/));
test("superseded article is hidden", () => has(/item\.superseded_by is null/));

test("possible and syndicated duplicates remain reviewable", () => {
  has(/'HARD', 'POSSIBLE', 'SYNDICATED'/);
  has(/duplicate_kind public\.news_duplicate_kind not null/);
});

test("duplicate relations reject self-pairs and reverse duplicate pairs", () => {
  has(/news_duplicate_relations_not_self check/);
  has(/news_duplicate_relations_ordered check \(news_item_id < related_news_item_id\)/);
  has(/news_duplicate_relations_unique unique/);
});

test("provenance source relationship is database enforced", () => {
  has(/foreign key \(official_source_item_id, source_id\)[\s\S]*references public\.official_source_items\(id, source_id\) on delete restrict/);
  has(/source_item\.source_id = item\.source_id/);
});

test("canonicalization is deterministic and versioned", () => {
  has(/NEWS_URL_CANON_V1/);
  has(/function private\.news_url_canonical_v1\(input_url text\)/);
  has(/language plpgsql[\s\S]*immutable[\s\S]*security invoker/);
  lacks(/http_get|net\.http|curl|redirect/i);
});

test("canonicalization performs no untrusted HTTP to HTTPS upgrade", () => {
  lacks(/approved_https_host/);
  lacks(/regexp_replace\([^;]+\^http:\/\/[\s\S]*https:\/\//);
  has(/return scheme \|\| ':\/\/' \|\| hostname/);
});

test("canonicalization rejects userinfo, whitespace, controls and malformed authorities", () => {
  has(/input_url ~ '\[\[:space:\]\[:cntrl:\]\]'/);
  has(/authority ~ '@'/);
  has(/authority !~ '\^\[A-Za-z0-9\.-\]\+/);
  has(/port_text::integer < 1 or port_text::integer > 65535/);
});

test("canonicalization preserves every explicit path slash", () => {
  lacks(/regexp_replace\(path_part, '\/\+\$'/);
  has(/if path_part = '' then[\s\S]*path_part := '\/'/);
});

test("stored canonical constraints reject a null canonicalization result", () => {
  has(/official_source_items_canonical_url_v1 check \([\s\S]*is not null[\s\S]*canonical_url = private\.news_url_canonical_v1/);
  has(/news_items_canonical_url_v1 check \([\s\S]*is not null[\s\S]*canonical_url = private\.news_url_canonical_v1/);
});

test("canonicalization removes only approved tracking keys", () => {
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "fbclid", "gclid"])
    has(new RegExp(`'${key}'`));
  lacks(/mc_cid|referrer|source_id_param/i);
});

test("semantic query order and values are preserved", () => {
  has(/kept_pairs := array_append\(kept_pairs, pair\)/);
  has(/array_to_string\(kept_pairs, '&'\)/);
  lacks(/order by.*kept_pairs/i);
});

test("original publisher URL is preserved", () => {
  has(/original_publisher_url text/);
  has(/item\.original_publisher_url/);
});

test("full copyrighted article body is not added or exposed", () => {
  lacks(/add column (body|full_text|article_body)/i);
  const returns = migration.match(/returns table \([\s\S]*?\)\nlanguage sql\n+stable\n+security definer/i)?.[0] ?? "";
  assert.doesNotMatch(returns, /body|full_text|raw_content/i);
});

test("UNKNOWN thumbnail is hidden", () => has(/thumbnail_permission in \('SOURCE_METADATA', 'EXPLICITLY_ALLOWED'\)/));
test("RESTRICTED thumbnail is hidden", () => has(/else null\s+end/));
test("public thumbnails require a current explicit source assessment", () => {
  has(/assessment\.thumbnail_permission = item\.thumbnail_permission/);
  has(/assessment\.terms_url is not null/);
  has(/assessment\.expires_at is null or assessment\.expires_at > now\(\)/);
  has(/order by latest_assessment\.assessed_at desc, latest_assessment\.id desc/);
});
test("thumbnail storage is remote-reference only", () => lacks(/storage|bucket|proxy|rehost/i));

test("all ingestion methods are controlled", () => has(/enum \('MANUAL_URL', 'RSS', 'API'\)/));
test("automatic ingestion remains disabled", () => has(/enabled boolean not null default false/));
test("source ingestion authorization fails closed", () => has(/news_ingestion_authorized boolean not null default false/));
test("RSS and API require explicit authorization", () => has(/or \(authorization_verified and endpoint_url is not null\)/));
test("scraping is not supported", () => lacks(/SCRAP|crawler|cheerio|playwright/i));

test("anonymous raw official source item access is revoked", () => {
  has(/revoke all on public\.official_source_items from anon, authenticated/);
  lacks(/grant select on public\.official_source_items to anon/);
});

test("ordinary users cannot bypass new raw tables", () => {
  has(/revoke all on public\.news_categories[\s\S]*from anon, authenticated/);
  lacks(/grant select[^;]+to anon[^;]*news_(categories|editorial|duplicate|source_)/i);
});

test("raw News and Registry reads are revoked from normal users", () => {
  has(/revoke all on public\.news_items from anon, authenticated/);
  has(/revoke all on public\.official_sources from anon, authenticated/);
  has(/drop policy if exists "Public can read publishable official sources" on public\.official_sources/);
  has(/drop policy if exists "Public reads enabled verified official sources" on public\.official_sources/);
  lacks(/grant select on public\.news_items to anon/);
  lacks(/grant select on public\.official_sources to anon/);
});

test("the final official_sources policy set contains only authorized administration", () => {
  const policyPattern = /create policy "([^"]+)"\s+on public\.official_sources/gi;
  const initialPolicies = [day2Migration, registryMigration]
    .flatMap((sql) => [...sql.matchAll(policyPattern)].map((match) => match[1]));
  const removedPolicies = [...migration.matchAll(/drop policy(?: if exists)? "([^"]+)" on public\.official_sources/gi)]
    .map((match) => match[1]);
  const addedPolicies = [...migration.matchAll(policyPattern)].map((match) => match[1]);
  const finalPolicies = initialPolicies
    .filter((policy) => !removedPolicies.includes(policy))
    .concat(addedPolicies)
    .sort();

  assert.deepEqual(finalPolicies, ["Admins manage official sources"]);
  assert.doesNotMatch(migration, /create policy[^;]+on public\.official_sources[^;]+for select/i);
});

test("curated News and Registry views are the only normal public readers", () => {
  has(/grant select on public\.news_public_items to anon, authenticated/);
  has(/grant select on public\.official_sources_public to anon, authenticated/);
  assert.match(newsPage, /from\("news_public_items"\)/);
  assert.doesNotMatch(newsPage, /from\("news_items"\)/);
  assert.match(aiTools, /from\("news_public_items"\)/);
  assert.doesNotMatch(aiTools, /from\("news_items"\)/);
  assert.match(sourceReader, /from\("official_sources_public"\)/);
  assert.doesNotMatch(sourceReader, /from\("official_sources"\)/);
});

test("manual News administration stays authorized by existing country architecture", () => {
  has(/private\.can_manage_news_source/);
  has(/select private\.can_manage_source\(target_source_id\)/);
  has(/private\.can_manage_news_item/);
});

test("global taxonomy excludes country admins while source content remains country scoped", () => {
  has(/function private\.can_manage_global_news_taxonomy/);
  has(/viewer\.role in \('moderator', 'super_admin'\)/);
  has(/Platform admins manage news categories[\s\S]*can_manage_global_news_taxonomy/);
});

test("organization admins receive no News platform policy", () => lacks(/organization_admin/));

test("private review tables have no public policies", () => {
  lacks(/create policy[^;]+on public\.news_editorial_reviews[^;]+to anon/is);
  lacks(/create policy[^;]+on public\.news_source_assessments[^;]+to anon/is);
});

test("editorial reviews and source assessments are append-only audited history", () => {
  has(/News admins append editorial reviews[\s\S]*reviewed_by = \(select auth\.uid\(\)\)/);
  has(/News admins append source assessments[\s\S]*assessed_by = \(select auth\.uid\(\)\)/);
  has(/grant select, insert on public\.news_editorial_reviews/);
  lacks(/grant[^;]*update[^;]*news_editorial_reviews/i);
  lacks(/grant[^;]*delete[^;]*news_source_assessments/i);
});

test("review and assessment ordering timestamps are server generated", () => {
  has(/new\.reviewed_at := statement_timestamp\(\)/);
  has(/new\.assessed_at := statement_timestamp\(\)/);
  has(/news_editorial_reviews_set_server_timestamps/);
  has(/news_source_assessments_set_server_timestamps/);
});

test("supersession cycles are rejected recursively", () => {
  has(/function private\.prevent_news_supersession_cycle/);
  has(/with recursive chain/);
  has(/News supersession cycle detected/);
  has(/news_items_prevent_supersession_cycle/);
});

test("foreign keys preserve history", () => {
  const newsSection = migration.match(/create table public\.news_categories[\s\S]*?create index official_sources_news_feed_idx/)?.[0] ?? "";
  assert.ok(newsSection);
  assert.doesNotMatch(newsSection, /on delete cascade/i);
  assert.match(newsSection, /on delete restrict/);
  has(/drop constraint official_source_items_source_id_fkey[\s\S]*on delete restrict/);
});

test("category junction integrity and single primary category are enforced", () => {
  has(/news_item_categories_unique unique/);
  has(/news_item_categories_one_primary_idx[\s\S]*where is_primary/);
});

test("public items require an enabled primary category approved for their source", () => {
  has(/scope\.source_id = item\.source_id[\s\S]*scope\.enabled[\s\S]*assignment\.is_primary/);
});

test("enabled automatic integrations require source-level authorization", () => {
  has(/function private\.is_news_integration_authorized/);
  has(/not enabled or private\.is_news_integration_authorized\(source_id\)/);
});

test("feed and retrieval indexes cover source, region, category and recency", () => {
  for (const index of [
    "official_sources_news_feed_idx", "news_items_public_feed_v2_idx",
    "news_items_source_recent_idx", "news_item_categories_category_idx",
    "official_source_items_editorial_status_idx",
  ]) has(new RegExp(index));
  has(/news_items \(region, province, published_at desc\)/);
  has(/official_sources \(news_primary_region, news_source_type\)[\s\S]*where news_enabled/);
});

test("reverse attribution indexes exist without the redundant integration source index", () => {
  for (const index of [
    "news_source_category_scopes_created_by_idx", "news_item_categories_assigned_by_idx",
    "news_duplicate_relations_reviewer_idx", "news_source_integrations_created_by_idx",
    "news_source_assessments_assessor_idx",
  ]) has(new RegExp(index));
  lacks(/create index news_source_integrations_source_idx/);
});

test("canonical and content identity indexes exist", () => {
  has(/news_items_canonical_url_v2_idx/);
  has(/official_source_items_similarity_hash_idx/);
  assert.match(registryMigration, /official_source_items_hash_idx/);
});

test("migration contains no publisher, JIM, regional media, article, or demo seed", () => {
  lacks(/JIM-MYS|Jabatan Imigresen|KBRI|KJRI|regional publisher/i);
  lacks(/insert into public\.(official_sources|official_source_items|news_items)/i);
});

test("only controlled taxonomy configuration is inserted", () => {
  const inserts = [...migration.matchAll(/insert into public\.([a-z_]+)/gi)].map((match) => match[1]);
  assert.deepEqual(inserts, ["news_categories"]);
});

test("existing demo record is preserved but excluded from V2 reader", () => {
  lacks(/delete from public\.news_items|update public\.news_items/i);
  has(/and not item\.is_demo/);
});

test("RLS is never disabled and no public write policy exists", () => {
  lacks(/disable row level security/i);
  lacks(/for (insert|update|delete|all) to anon/i);
});

test("hosted transaction test is rollback-only and has no chat artifacts", () => {
  assert.match(hostedTest, /^begin;/i);
  assert.match(hostedTest, /rollback;[\s\S]*PASS: DUTA News V2 hosted RLS\/authorization transaction test completed successfully/);
  assert.doesNotMatch(hostedTest, /```|<in-app-browser-context|\$test\$/);
  assert.doesNotMatch(hostedTest, /^\s*(create|alter|drop|truncate|grant|revoke)\s/im);
  const doBlocks = hostedTest.match(/\bdo \$\$/gi) ?? [];
  const dollarClosures = hostedTest.match(/^\$\$;/gm) ?? [];
  assert.equal(doBlocks.length, dollarClosures.length);
});

test("hosted transaction test covers real roles, raw denial and curated visibility", () => {
  for (const value of [
    "set local role anon", "set local role authenticated", "country_admin",
    "organization_admin", "moderator", "news_public_items",
    "anon raw news_items SELECT unexpectedly succeeded", "restricted thumbnail",
  ]) assert.match(hostedTest, new RegExp(value, "i"));
});

test("hosted transaction test exercises canonicalization edge cases", () => {
  for (const value of [
    "https://example.com/article/", "https://example.com/article//",
    "https://User:Pass@example.com/article", "id=123&page=2", "fbclid",
  ]) assert.match(hostedTest, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
