import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/202608080005_day5_duta_karier.sql", import.meta.url), "utf8");
const employerDashboard = await readFile(new URL("../src/app/employer/dashboard/page.tsx", import.meta.url), "utf8");
const adapter = await readFile(new URL("../src/lib/career/external-sources/siskop2mi.ts", import.meta.url), "utf8");
const adminLayout = await readFile(new URL("../src/app/admin/layout.tsx", import.meta.url), "utf8");
const tables = ["employers", "employer_members", "external_job_sources", "jobs", "career_passports", "job_applications", "saved_jobs", "job_alerts"];

test("Day 5 enables RLS on all eight tables and is non-destructive", () => {
  for (const table of tables) assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  assert.doesNotMatch(migration, /disable row level security|drop table|truncate/i);
  assert.doesNotMatch(migration, /insert into public\.(employers|jobs|external_job_sources)/i);
});
test("Career Passport is private by default and cannot become public", () => {
  assert.match(migration, /is_public boolean not null default false/);
  assert.match(migration, /career_passports_private_only check \(is_public = false\)/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(migration, /career_passports[\s\S]{0,100}to anon/i);
});

test("employers can read a Passport only after explicit applicant sharing", () => {
  assert.match(migration, /Authorized employers read shared applicant passports/);
  assert.match(migration, /application\.applicant_id = user_id/);
  assert.match(migration, /application\.share_career_passport/);
  assert.match(migration, /private\.can_manage_job\(application\.job_id\)/);
  assert.match(employerDashboard, /filter\(\(application\) => application\.share_career_passport\)/);
  assert.doesNotMatch(employerDashboard, /career_passports\(headline,skills\)/);
});

test("application ownership and employer job scope are enforced by RLS", () => {
  assert.match(migration, /Applicants read own applications[\s\S]*?applicant_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /Authorized employers read applicants[\s\S]*?private\.can_manage_job\(job_id\)/);
  assert.match(migration, /Application identity cannot be changed/);
  assert.match(migration, /Employers cannot change applicant-provided information/);
});

test("applicants cannot impersonate employer status changes", () => {
  assert.match(migration, /Applicants may only withdraw their applications/);
  assert.match(migration, /Applicants withdraw own applications[\s\S]*?status = 'withdrawn'/);
  assert.match(migration, /Authorized employers track applications[\s\S]*?private\.can_manage_job\(job_id\)/);
});

test("employers cannot self-verify or bypass job moderation", () => {
  assert.match(migration, /Only platform moderators may change employer review fields/);
  assert.match(migration, /if not private\.can_manage_country\(selected_employer\.country_code\) then raise exception 'Forbidden'/);
  assert.match(migration, /Only platform moderators may change job control fields/);
  assert.match(migration, /Employer members submit pending jobs[\s\S]*?status = 'pending'/);
});

test("saved jobs and alerts are private owner-bound records", () => {
  assert.match(migration, /Users manage own saved jobs[\s\S]*?user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /Users manage own job alerts[\s\S]*?user_id = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(migration, /grant select[^;]*saved_jobs[^;]*anon/i);
  assert.doesNotMatch(migration, /grant select[^;]*job_alerts[^;]*anon/i);
});

test("expired or unpublished jobs cannot receive applications", () => {
  assert.match(migration, /job\.status = 'published'/);
  assert.match(migration, /job\.deadline is null or job\.deadline > now\(\)/);
});

test("external jobs require provenance and ordinary employer inserts stay internal", () => {
  for (const field of ["external_source_id", "external_id", "original_url", "last_checked_at", "deadline"]) assert.match(migration, new RegExp(field));
  assert.match(migration, /source_type = 'internal'[\s\S]*?Employer members submit pending jobs/);
  assert.match(migration, /new\.external_source_id is distinct from old\.external_source_id/);
  assert.match(migration, /new\.original_url is distinct from old\.original_url/);
});

test("SISKOP2MI adapter is inactive and performs no scraping or network fetch", () => {
  assert.match(adapter, /authorized: false/);
  assert.match(adapter, /scraping tidak digunakan/);
  assert.doesNotMatch(adapter, /fetch\s*\(|axios|cheerio|puppeteer|playwright/i);
});

test("authenticated public reads do not receive employer or job control columns", () => {
  const grants = [...migration.matchAll(/grant select \([\s\S]*?\) on public\.(employers|jobs) to anon, authenticated;/gi)].map((match) => match[0]).join("\n");
  assert.doesNotMatch(grants, /submitted_by|reviewed_by|registration_number|contact_email|posted_by|moderated_by/);
  assert.doesNotMatch(migration, /grant select, insert, update on public\.(employers|jobs)/i);
});

test("career admin routes remain protected by server authorization", () => {
  assert.match(adminLayout, /requirePlatformAdmin\(\)/);
});
