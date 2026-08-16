import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { pathToFileURL } from "node:url";

const temp = await mkdtemp(path.join(tmpdir(), "duta-news-parser-"));
after(() => rm(temp, { recursive: true, force: true }));
for (const name of ["types", "fetch-security", "rss-parser", "normalize", "dry-run"]) {
  let source = await readFile(new URL(`../src/lib/news-ingestion/${name}.ts`, import.meta.url), "utf8");
  source = source.replace(/from "\.\/(types|fetch-security|rss-parser|normalize)"/g, 'from "./$1.ts"');
  await writeFile(path.join(temp, `${name}.ts`), source);
}
const parser = await import(pathToFileURL(path.join(temp, "rss-parser.ts")));
const normalize = await import(pathToFileURL(path.join(temp, "normalize.ts")));
const dryRun = await import(pathToFileURL(path.join(temp, "dry-run.ts")));
const types = await import(pathToFileURL(path.join(temp, "types.ts")));
const fixture = (name) => new URL(`./fixtures/news-ingestion/${name}`, import.meta.url);
const bytes = async (name) => new Uint8Array(await readFile(fixture(name)));

test("valid RSS and Atom parse into bounded structured data", async () => {
  const rss = parser.parseBoundedFeed(await bytes("valid-rss.xml"));
  const atom = parser.parseBoundedFeed(await bytes("valid-atom.xml"));
  assert.equal(rss.length, 1); assert.equal(atom.length, 1);
  assert.equal(rss[0].title, "Makluman rasmi"); assert.equal(atom[0].guid, "atom-001");
  assert.ok(rss[0].description.includes("Maklumat rasmi"));
});

test("malformed XML, XXE, DTD and entity expansion are rejected", async () => {
  for (const name of ["malformed.xml", "xxe.xml", "entity-expansion.xml"]) {
    const input = await bytes(name);
    assert.throws(() => parser.parseBoundedFeed(input));
  }
});

test("depth and item limits are enforced", () => {
  const deep = `<?xml version="1.0"?><rss><channel>${"<x>".repeat(31)}<item><title>A</title><link>https://www.imi.gov.my/a</link></item>${"</x>".repeat(31)}</channel></rss>`;
  assert.throws(() => parser.parseBoundedFeed(new TextEncoder().encode(deep)));
  const many = `<?xml version="1.0"?><rss><channel>${Array.from({ length: 51 }, (_, i) => `<item><title>${i}</title><link>https://www.imi.gov.my/${i}</link></item>`).join("")}</channel></rss>`;
  assert.throws(() => parser.parseBoundedFeed(new TextEncoder().encode(many)));
});

test("unsafe descriptions become bounded inert plain text", async () => {
  const [item] = parser.parseBoundedFeed(await bytes("unsafe-description.xml"));
  assert.equal(item.description, "Teks aman");
  assert.doesNotMatch(item.description, /script|iframe|onclick|javascript/i);
});

test("field bounds, invalid XML characters and category bounds are enforced", () => {
  const xml = `<?xml version="1.0"?><rss><channel><item><guid>${"g".repeat(600)}</guid><title>${"T".repeat(400)}</title><link>https://www.imi.gov.my/bounds</link><description>${"D".repeat(4500)}</description><author>${"A".repeat(250)}</author><category>${"C".repeat(150)}</category></item></channel></rss>`;
  const [item] = parser.parseBoundedFeed(new TextEncoder().encode(xml));
  assert.equal(item.guid.length, 512);
  assert.equal(item.title.length, 300);
  assert.equal(item.description.length, 4000);
  assert.equal(item.author.length, 200);
  assert.equal(item.categories[0].length, 100);
  assert.throws(() => parser.parseBoundedFeed(new TextEncoder().encode(xml.replace("</description>", "&#x1;</description>"))), /XML_ENTITY_REJECTED/);
  const tooManyCategories = `<?xml version="1.0"?><rss><channel><item><title>A</title><link>https://www.imi.gov.my/a</link>${"<category>x</category>".repeat(21)}</item></channel></rss>`;
  assert.throws(() => parser.parseBoundedFeed(new TextEncoder().encode(tooManyCategories)));
});

test("structural XML matrix supports namespaces, CDATA, comments, PI, BOM and quoted attribute delimiters", () => {
  const rss = `\uFEFF<?xml version="1.0"?><?safe instruction?><!--ok--><rss xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><item><title><![CDATA[A > B]]></title><link data-note="x > y">https://www.imi.gov.my/a</link><dc:creator>JIM</dc:creator></item></channel></rss>`;
  const [rssItem] = parser.parseBoundedFeed(new TextEncoder().encode(rss));
  assert.equal(rssItem.title, "A > B");
  assert.equal(rssItem.author, "JIM");
  const atom = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><id>a1</id><title>Atom</title><link href="https://www.imi.gov.my/a?x=1&amp;y=2"/><category term="notice"/></entry></feed>`;
  const [atomItem] = parser.parseBoundedFeed(new TextEncoder().encode(atom));
  assert.equal(atomItem.link, "https://www.imi.gov.my/a?x=1&y=2");
  assert.deepEqual(atomItem.categories, ["notice"]);
  const prefixedAtom = `<atom:feed xmlns:atom="http://www.w3.org/2005/Atom"><atom:entry><atom:id>p1</atom:id><atom:title>Prefixed</atom:title><atom:link href="https://www.imi.gov.my/p"/></atom:entry></atom:feed>`;
  assert.equal(parser.parseBoundedFeed(new TextEncoder().encode(prefixedAtom))[0].title, "Prefixed");
});

test("RSS and Atom accept articles only from the exact feed structure and namespace", () => {
  const rss = `<rss><channel><title>Feed title</title><item><title>Real</title><link>https://www.imi.gov.my/real</link><foreign:title xmlns:foreign="urn:evil">Wrong</foreign:title><wrapper><item><title>Nested</title></item></wrapper></item></channel><item><title>Outside</title></item></rss>`;
  const parsedRss = parser.parseBoundedFeed(new TextEncoder().encode(rss));
  assert.equal(parsedRss.length, 1); assert.equal(parsedRss[0].title, "Real");
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Real Atom</title><link rel="self" href="https://www.imi.gov.my/self"/><link rel="enclosure" href="https://www.imi.gov.my/file"/><link rel="alternate" href="https://www.imi.gov.my/article"/><x:title xmlns:x="urn:evil">Wrong</x:title><wrapper><entry><title>Nested</title></entry></wrapper></entry></feed>`;
  const parsedAtom = parser.parseBoundedFeed(new TextEncoder().encode(atom));
  assert.equal(parsedAtom.length, 1); assert.equal(parsedAtom[0].title, "Real Atom"); assert.equal(parsedAtom[0].link, "https://www.imi.gov.my/article");
  const noArticleLink = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>x</id><title>No link</title><link rel="self" href="https://www.imi.gov.my/self"/></entry></feed>`;
  assert.equal(parser.parseBoundedFeed(new TextEncoder().encode(noArticleLink))[0].link, null);
});

test("entities, controls, declarations, QNames and expanded attributes fail closed", () => {
  const invalid = [
    "<rss><channel><item><title>A & B</title></item></channel></rss>",
    "<rss><channel><item><title>A &broken;</title></item></channel></rss>",
    "<rss><channel><item><title>A\u0001B</title></item></channel></rss>",
    "<!--before--><?xml version=\"1.0\"?><rss/>",
    "<rss><?xml version=\"1.0\"?></rss>",
    "<?XML version=\"1.0\"?><rss/>",
    "<rss><a:b:c xmlns:a=\"urn:a\"/></rss>",
    "<rss xmlns:a=\"urn:x\" xmlns:b=\"urn:x\" a:id=\"1\" b:id=\"2\"/>",
    "<rss><?xml-stylesheet</rss>",
    "<rss><channel><item><title>ordinary ]]&gt;</title></item></channel></rss>".replace("]]&gt;", "]]>") ,
    '<rss xmlns="http://www.w3.org/XML/1998/namespace"/>',
    '<rss xmlns:a="http://www.w3.org/XML/1998/namespace"/>',
    '<rss xmlns:xml="urn:wrong"/>',
    '<rss xmlns:a="http://www.w3.org/2000/xmlns/"/>',
    '<rss xmlns="http://www.w3.org/2000/xmlns/"/>',
  ];
  for (const xml of invalid) assert.throws(() => parser.parseBoundedFeed(new TextEncoder().encode(xml)));
});

test("malformed structural XML matrix fails closed", () => {
  const invalid = [
    "<rss><channel><item><title>x</item></title></channel></rss>",
    '<rss><channel><item bad=x><title>x</title></item></channel></rss>',
    "<rss><channel><item><title><![CDATA[x</title></item></channel></rss>",
    "<rss><!-- a -- b --><channel/></rss>",
    "<rss><?broken<channel/></rss>",
    "<rss><bad:item/></rss>",
    "<!DOCTYPE rss><rss/>",
    "<!ENTITY x SYSTEM 'file:///etc/passwd'><rss/>",
    "<!DOCTYPE rss [<!ENTITY % x SYSTEM 'https://example.invalid/x'>%x;]><rss/>",
  ];
  for (const xml of invalid) assert.throws(() => parser.parseBoundedFeed(new TextEncoder().encode(xml)), xml);
});

test("normalization preserves semantic query order and removes tracking", async () => {
  const [item] = parser.parseBoundedFeed(await bytes("valid-rss.xml"));
  const candidate = normalize.normalizeFeedItem(item, "2026-08-13T00:00:00.000Z");
  assert.equal(candidate.canonicalUrl, "https://www.imi.gov.my/index.php/pengumuman/?ref=1");
  assert.equal(candidate.provenance.editorialStatus, "FETCHED");
  assert.equal(normalize.canonicalizeNewsUrl("https://EXAMPLE.com/a?b=2&a=1&a=3&utm_source=x"), "https://example.com/a?b=2&a=1&a=3");
  assert.equal(normalize.canonicalizeNewsUrl("http://Example.com:80/article//?q=a%20b&q=%2F&mc_cid=keep&utm_id=drop#x"), "http://example.com/article//?q=a%20b&q=%2F&mc_cid=keep");
  assert.throws(() => normalize.canonicalizeNewsUrl("https://user:pass@example.com/a"));
});

test("SHA-256 fallback is reachable, scoped and review-only", async () => {
  const [item] = parser.parseBoundedFeed(await bytes("fingerprint-only.xml"));
  const first = normalize.normalizeFeedItem(item, "2026-08-13T00:00:00.000Z");
  const second = normalize.normalizeFeedItem(item, "2026-08-14T00:00:00.000Z");
  assert.equal(first.identityKind, "FINGERPRINT");
  assert.equal(first.externalIdentity, second.externalIdentity);
  assert.equal(first.originalUrl, null);
  assert.equal(first.provenance.persistenceEligibility, "REVIEW_REQUIRED");
  assert.equal(normalize.deduplicateCandidates([first, second]).duplicates, 1);
});

test("GUID conflicts and canonical URL duplicates do not overwrite", async () => {
  const guidItems = parser.parseBoundedFeed(await bytes("duplicate-guid.xml")).map((item) => normalize.normalizeFeedItem(item, "2026-08-13T00:00:00.000Z"));
  const guidResult = normalize.deduplicateCandidates(guidItems);
  assert.equal(guidResult.conflicts, 1); assert.equal(guidResult.accepted.length, 1);
  const urlItems = parser.parseBoundedFeed(await bytes("duplicate-url.xml")).map((item) => normalize.normalizeFeedItem(item, "2026-08-13T00:00:00.000Z"));
  assert.equal(normalize.deduplicateCandidates(urlItems).duplicates, 1);
});

test("missing GUID/date uses URL identity and prompt injection stays inert", async () => {
  const [missing] = parser.parseBoundedFeed(await bytes("missing-guid-date.xml"));
  const candidate = normalize.normalizeFeedItem(missing, "2026-08-13T00:00:00.000Z");
  assert.equal(candidate.identityKind, "CANONICAL_URL"); assert.equal(candidate.publishedAt, null);
  const [prompt] = parser.parseBoundedFeed(await bytes("prompt-injection.xml"));
  assert.match(prompt.title, /execute SQL/); assert.equal(typeof prompt.title, "string");
});

test("local dry run reads fixture only and stops at FETCHED", async () => {
  const result = await dryRun.runLocalNewsDryRun(decodeURIComponent(fixture("valid-rss.xml").pathname).replace(/^\/(.:)/, "$1"), { status: 200, contentType: "application/rss+xml; charset=utf-8", compressedBytes: 500, finalUrl: types.JIM_RSS_ENDPOINT, redirects: [] }, "2026-08-13T00:00:00.000Z");
  assert.equal(result.accepted.length, 1);
  assert.equal(result.accepted[0].provenance.editorialStatus, "FETCHED");
  assert.equal("published" in result.accepted[0], false);
});
