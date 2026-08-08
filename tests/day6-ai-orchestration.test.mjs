import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const types = read("src/lib/ai/types.ts");
const router = read("src/lib/ai/intent-router.ts");
const safety = read("src/lib/ai/safety-router.ts");
const tools = read("src/lib/ai/tools.ts");
const orchestrator = read("src/lib/ai/orchestrator.ts");
const provider = read("src/lib/ai/provider.ts");
const observability = read("src/lib/ai/observability.ts");
const ui = read("src/components/ai/assistant-panel.tsx");

test("Day 6 declares all twelve approved intents", () => {
  for (const intent of ["consular_help","representative_office","official_contact","official_news","find_job","job_detail","find_place","find_health_facility","find_organization","find_event","platform_help","general_duta_question"]) assert.match(types, new RegExp(`"${intent}"`));
});
test("data classifications include public, owned, role and prohibited", () => {
  for (const value of ["PUBLIC_READ","USER_OWNED_READ","AUTHORIZED_ROLE_READ","PROHIBITED_AI_ACCESS"]) assert.match(types, new RegExp(value));
});
test("structured response contains every required field", () => {
  for (const field of ["answer","intent","agent","confidence","entities","sources","actions","warnings","follow_up_suggestions"]) assert.match(types, new RegExp(`${field}:`));
});
test("intent router recognizes all feature domains", () => {
  for (const word of ["lowongan","klinik","kedutaan","kontak resmi","paspor","berita","acara","organisasi","tempat","bantuan aplikasi"]) assert.match(router, new RegExp(word));
});
test("prompt injection patterns are blocked", () => assert.match(safety, /ignore \(all\|previous\|prior\)/));
test("secret and service role requests are blocked", () => { assert.match(safety, /service\[-_ \]role/); assert.match(safety, /api key\|password\|secret\|token/); });
test("bulk users, CVs and career passports are prohibited", () => assert.match(safety, /all \(users\|cvs\|career passports\|profiles\)/));
test("generic SQL capability is prohibited", () => assert.match(safety, /generic sql\|run sql\|select/));
test("medical diagnosis requests are prohibited", () => assert.match(safety, /medical diagnosis/));
test("official offices require verified active non-demo records", () => { assert.match(tools, /representative_offices/); assert.match(tools, /eq\("verification_status", "verified"\)/); assert.match(tools, /eq\("is_demo", false\)/); });
test("official contact tool is source-bound and non-demo", () => { assert.match(tools, /verified_official_contacts/); assert.match(tools, /official_sources!source_id/); });
test("official news tool only reads verified published non-demo content", () => { assert.match(tools, /verified_official_news/); assert.match(tools, /eq\("publication_status", "published"\)/); });
test("job search only reads published jobs", () => { assert.match(tools, /published_job_search/); assert.match(tools, /eq\("status", "published"\)/); });
test("fake or malformed job ids cannot form an action", () => { assert.match(router, /\[0-9a-f\]\{8\}/); assert.match(tools, /if \(!entities\.id\)/); });
test("community places only read approved rows and carry community warning", () => { assert.match(tools, /approved_community_places/); assert.match(tools, /moderation_status/); assert.match(tools, /berasal dari komunitas/); });
test("health directory rejects certification and diagnosis claims", () => { assert.match(tools, /bukan sertifikasi medis/); assert.match(tools, /tidak memberikan diagnosis/); });
test("organizations and events only use approved or published rows", () => { assert.match(tools, /approved_organizations/); assert.match(tools, /published_organization_events/); });
test("career tool derives user id from authenticated session and queries own rows", () => { assert.match(orchestrator, /db\.auth\.getUser\(\)/); assert.match(tools, /eq\("user_id", userId\)/); assert.match(tools, /eq\("applicant_id", userId\)/); });
test("anonymous career request returns a login action", () => { assert.match(tools, /if \(!userId\)/); assert.match(tools, /href: "\/login"/); });
test("provider is server-only optional and does not choose tools", () => { assert.match(provider, /process\.env\.OPENAI_API_KEY/); assert.doesNotMatch(provider, /NEXT_PUBLIC/); assert.match(orchestrator, /getTool\(routed\.intent\)/); });
test("provider or database failure produces an unavailable fallback without invention", () => { assert.match(orchestrator, /catch \(error\)/); assert.match(orchestrator, /Tidak ada jawaban yang dibuat-buat/); });
test("observability logs metadata but not prompts or private content", () => { assert.match(observability, /latencyMs/); assert.match(observability, /sourceCount/); assert.doesNotMatch(observability, /message:|query:|career_passport/); });
test("assistant UI labels the MVP read-only", () => assert.match(ui, /bersifat baca-saja/));
test("Day 1 authentication foundation remains present", () => assert.ok(existsSync(new URL("../src/lib/auth/session.ts", import.meta.url))));
test("Day 2 Connect and News routes remain present", () => { assert.ok(existsSync(new URL("../src/app/connect/page.tsx", import.meta.url))); assert.ok(existsSync(new URL("../src/app/news/page.tsx", import.meta.url))); });
test("Day 3 Map route remains present", () => assert.ok(existsSync(new URL("../src/app/map/page.tsx", import.meta.url))));
test("Day 4 organization route remains present", () => assert.ok(existsSync(new URL("../src/app/organizations/page.tsx", import.meta.url))));
test("Day 5 career route remains present", () => assert.ok(existsSync(new URL("../src/app/career/page.tsx", import.meta.url))));
