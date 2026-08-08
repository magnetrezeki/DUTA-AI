import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/202608080002_day2_connect_news.sql",
  import.meta.url,
);

test("Day 2 enables RLS on every new public table and never disables it", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const tables = [
    "official_sources",
    "representative_offices",
    "office_jurisdictions",
    "service_categories",
    "office_contact_channels",
    "news_items",
  ];

  tables.forEach((table) => {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  });
  assert.doesNotMatch(sql, /disable row level security/i);
  assert.doesNotMatch(sql, /^\s*drop\s+/im);
});

test("Day 2 admin writes are protected and country scoped", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /private\.can_manage_country\(country_code\)/i);
  assert.match(sql, /private\.can_manage_office\(office_id\)/i);
  assert.match(sql, /private\.can_manage_source\(source_id\)/i);
  assert.doesNotMatch(sql, /for all to anon/i);
});

test("official records carry source and verification metadata", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /source_url text not null/i);
  assert.match(sql, /source_id uuid not null references public\.official_sources/i);
  assert.match(sql, /verification_status public\.verification_status/i);
  assert.match(sql, /last_verified_at timestamptz/i);
});

test("development records are explicit demo data with no invented contacts", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /DEMO — Indonesian Representative Office/);
  assert.match(sql, /example\.invalid/g);
  assert.doesNotMatch(sql, /\+60[\d\s-]{6,}/);
  assert.doesNotMatch(sql, /@(?:gmail|yahoo|outlook)\./i);
});

test("future feed and API integrations remain disabled", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /'authorized_feed', 'authorized_api'/);
  assert.match(sql, /integration_enabled = false/i);
  assert.doesNotMatch(sql, /integration_enabled[^\n]*true/i);
  assert.doesNotMatch(sql, /create table public\.news_sources/i);
});
