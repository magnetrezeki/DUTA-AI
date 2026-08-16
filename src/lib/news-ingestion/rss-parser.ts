import { FETCH_LIMITS, FeedSecurityError } from "./fetch-security";
import type { ParsedFeedItem } from "./types";

const ATOM = "http://www.w3.org/2005/Atom";
const DC = "http://purl.org/dc/elements/1.1/";
const FIELD_LIMITS = { title: 300, url: 2048, description: 4000, author: 200, guid: 512, category: 100 };
const XML_LIMITS = { name: 128, attributes: 64, attributeValue: 8192, text: 1_048_576, comment: 65_536, tokens: 100_000 };
type XmlNode = { name: string; local: string; namespace: string | null; attributes: Map<string, string>; children: XmlNode[]; text: string };

function xmlError(code = "XML_MALFORMED"): never { throw new FeedSecurityError(code); }
function validXmlChar(point: number): boolean { return point === 0x09 || point === 0x0a || point === 0x0d || (point >= 0x20 && point <= 0xd7ff) || (point >= 0xe000 && point <= 0xfffd) || (point >= 0x10000 && point <= 0x10ffff); }
function assertXmlCharacters(value: string): void { for (const char of value) if (!validXmlChar(char.codePointAt(0)!)) xmlError("XML_CHARACTER_REJECTED"); }
function splitQName(value: string): { prefix: string; local: string } {
  if (value.length > XML_LIMITS.name || !/^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?$/.test(value)) xmlError("XML_QNAME_INVALID");
  const parts = value.split(":"); return { prefix: parts.length === 2 ? parts[0] : "", local: parts.at(-1)! };
}
function decodeEntities(value: string): string {
  let output = "";
  for (let index = 0; index < value.length;) {
    if (value[index] !== "&") { output += value[index++]; continue; }
    const end = value.indexOf(";", index + 1); if (end < 0) xmlError("XML_ENTITY_REJECTED");
    const entity = value.slice(index + 1, end); let decoded: string | null = null;
    if (entity === "lt") decoded = "<"; else if (entity === "gt") decoded = ">"; else if (entity === "amp") decoded = "&"; else if (entity === "quot") decoded = '"'; else if (entity === "apos") decoded = "'";
    else {
      const hex = entity.match(/^#x([0-9a-f]+)$/i); const decimal = entity.match(/^#([0-9]+)$/);
      const point = hex ? Number.parseInt(hex[1], 16) : decimal ? Number.parseInt(decimal[1], 10) : NaN;
      if (!Number.isFinite(point) || !validXmlChar(point)) xmlError("XML_ENTITY_REJECTED");
      decoded = String.fromCodePoint(point);
    }
    output += decoded; index = end + 1;
  }
  return output;
}

function parseXml(xml: string): XmlNode {
  assertXmlCharacters(xml);
  let index = 0; let tokens = 0; let declarationSeen = false; let feedItems = 0;
  const stack: Array<{ node: XmlNode; namespaces: Map<string, string> }> = [];
  let root: XmlNode | null = null;
  const token = () => { if (++tokens > XML_LIMITS.tokens) xmlError("XML_TOKEN_LIMIT"); };
  const skipSpace = () => { while (index < xml.length && /[\t\n\r ]/.test(xml[index])) index += 1; };
  const readName = () => { const start = index; while (index < xml.length && /[A-Za-z0-9_.:-]/.test(xml[index])) index += 1; const result = xml.slice(start, index); splitQName(result); return result; };
  const appendText = (text: string, decode = true) => {
    if (!stack.length) { if (text.trim()) xmlError(); return; }
    if (decode && text.includes("]]>")) xmlError("XML_CHARACTER_DATA_INVALID");
    const decoded = decode ? decodeEntities(text) : text; assertXmlCharacters(decoded);
    const node = stack.at(-1)!.node; if (node.text.length + decoded.length > XML_LIMITS.text) xmlError("XML_TEXT_LIMIT"); node.text += decoded;
  };
  while (index < xml.length) {
    token();
    if (xml[index] !== "<") { const end = xml.indexOf("<", index); appendText(xml.slice(index, end < 0 ? xml.length : end)); index = end < 0 ? xml.length : end; continue; }
    if (xml.startsWith("<!--", index)) { const end = xml.indexOf("-->", index + 4); const body = end < 0 ? "" : xml.slice(index + 4, end); if (end < 0 || body.includes("--") || body.length > XML_LIMITS.comment) xmlError(); index = end + 3; continue; }
    if (xml.startsWith("<![CDATA[", index)) { if (!stack.length) xmlError(); const end = xml.indexOf("]]>", index + 9); if (end < 0) xmlError(); appendText(xml.slice(index + 9, end), false); index = end + 3; continue; }
    if (xml.startsWith("<?", index)) {
      const end = xml.indexOf("?>", index + 2); if (end < 0) xmlError();
      const content = xml.slice(index + 2, end); const match = content.match(/^([A-Za-z_][A-Za-z0-9_.-]*)(?:[\t\n\r ]+([\s\S]*))?$/); if (!match) xmlError();
      if (match[1].toLowerCase() === "xml") {
        if (match[1] !== "xml" || declarationSeen || root || stack.length || index !== 0) xmlError("XML_DECLARATION_INVALID");
        if (!/^version\s*=\s*(['"])1\.0\1(?:\s+encoding\s*=\s*(['"])UTF-8\2)?(?:\s+standalone\s*=\s*(['"])(?:yes|no)\3)?\s*$/.test(match[2] ?? "")) xmlError("XML_DECLARATION_INVALID");
        declarationSeen = true;
      }
      index = end + 2; continue;
    }
    if (xml.startsWith("<!", index)) xmlError("XML_ACTIVE_CONTENT");
    if (xml.startsWith("</", index)) { index += 2; const closing = readName(); skipSpace(); if (xml[index] !== ">") xmlError(); index += 1; const current = stack.pop(); if (!current || current.node.name !== closing) xmlError(); continue; }
    index += 1; const qualifiedName = readName(); const attributes = new Map<string, string>(); let selfClosing = false;
    for (;;) {
      skipSpace(); if (xml.startsWith("/>", index)) { selfClosing = true; index += 2; break; } if (xml[index] === ">") { index += 1; break; }
      if (attributes.size >= XML_LIMITS.attributes) xmlError("XML_ATTRIBUTE_LIMIT");
      const attributeName = readName(); if (attributes.has(attributeName)) xmlError("XML_DUPLICATE_ATTRIBUTE"); skipSpace(); if (xml[index++] !== "=") xmlError(); skipSpace();
      const quote = xml[index++]; if (quote !== '"' && quote !== "'") xmlError(); const end = xml.indexOf(quote, index); if (end < 0 || xml.slice(index, end).includes("<")) xmlError();
      const raw = xml.slice(index, end); if (raw.length > XML_LIMITS.attributeValue) xmlError("XML_ATTRIBUTE_LIMIT"); attributes.set(attributeName, decodeEntities(raw)); index = end + 1;
    }
    const inherited = stack.length ? new Map(stack.at(-1)!.namespaces) : new Map<string, string>(); inherited.set("xml", "http://www.w3.org/XML/1998/namespace");
    for (const [key, value] of attributes) {
      if (key === "xmlns") { if (value === "http://www.w3.org/2000/xmlns/" || value === "http://www.w3.org/XML/1998/namespace") xmlError("XML_NAMESPACE_INVALID"); inherited.set("", value); }
      else if (key.startsWith("xmlns:")) {
        const declared = splitQName(key).local;
        if (!value || declared === "xmlns" || value === "http://www.w3.org/2000/xmlns/" || (declared === "xml") !== (value === "http://www.w3.org/XML/1998/namespace")) xmlError("XML_NAMESPACE_INVALID");
        inherited.set(declared, value);
      }
    }
    const qname = splitQName(qualifiedName); if (qname.prefix && !inherited.has(qname.prefix)) xmlError("XML_NAMESPACE_INVALID");
    const expanded = new Set<string>();
    for (const key of attributes.keys()) {
      if (key === "xmlns" || key.startsWith("xmlns:")) continue;
      const attribute = splitQName(key); if (attribute.prefix && !inherited.has(attribute.prefix)) xmlError("XML_NAMESPACE_INVALID");
      const identity = `${attribute.prefix ? inherited.get(attribute.prefix) : ""}\u0000${attribute.local}`; if (expanded.has(identity)) xmlError("XML_DUPLICATE_ATTRIBUTE"); expanded.add(identity);
    }
    const node: XmlNode = { name: qualifiedName, local: qname.local.toLowerCase(), namespace: inherited.get(qname.prefix) ?? null, attributes, children: [], text: "" };
    const parent = stack.at(-1)?.node;
    const rssItem = node.local === "item" && node.namespace === null && parent?.local === "channel" && parent.namespace === null && stack.at(-2)?.node.local === "rss" && stack.at(-2)?.node.namespace === null;
    const atomEntry = node.local === "entry" && node.namespace === ATOM && parent?.local === "feed" && parent.namespace === ATOM;
    if ((rssItem || atomEntry) && ++feedItems > FETCH_LIMITS.maxItems) xmlError("ITEM_LIMIT");
    if (parent) parent.children.push(node); else { if (root) xmlError(); root = node; }
    if (!selfClosing) { stack.push({ node, namespaces: inherited }); if (stack.length > 32) xmlError("XML_DEPTH_LIMIT"); }
  }
  if (stack.length || !root) xmlError(); return root;
}

function children(node: XmlNode, local: string, namespace: string | null): XmlNode[] { return node.children.filter((entry) => entry.local === local && entry.namespace === namespace); }
function first(node: XmlNode, names: readonly string[], namespace: string | null): XmlNode | null { return node.children.find((entry) => names.includes(entry.local) && entry.namespace === namespace) ?? null; }
function textContent(node: XmlNode): string { return node.text + node.children.map(textContent).join(""); }
function value(node: XmlNode, names: readonly string[], namespace: string | null): string | null { const found = first(node, names, namespace); return found ? textContent(found).replace(/\s+/g, " ").trim() : null; }
function bounded(input: string | null, limit: number, required = false): string | null { const output = input?.trim() ?? ""; if (required && !output) throw new FeedSecurityError("FEED_REQUIRED_FIELD"); return output ? output.slice(0, limit) : null; }

export function sanitizeDescription(input: string): string {
  let text = input.replace(/<(script|style|iframe|object|embed|form)\b[\s\S]*?<\/\1\s*>/gi, " ");
  text = text.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(?:javascript|vbscript|data)\s*:/gi, "").replace(/<[^>]+>/g, " ");
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim().slice(0, FIELD_LIMITS.description);
}

export function parseBoundedFeed(xmlBytes: Uint8Array): ParsedFeedItem[] {
  if (xmlBytes.byteLength > FETCH_LIMITS.maxDecompressedBytes) throw new FeedSecurityError("DECOMPRESSED_LIMIT");
  let xml: string; try { xml = new TextDecoder("utf-8", { fatal: true }).decode(xmlBytes).replace(/^\uFEFF/, ""); } catch { throw new FeedSecurityError("CHARSET_REJECTED"); }
  const root = parseXml(xml); const atom = root.local === "feed" && root.namespace === ATOM; const rss = root.local === "rss" && root.namespace === null;
  if (!atom && !rss) throw new FeedSecurityError("FEED_STRUCTURE_REJECTED");
  const containers = rss ? children(root, "channel", null) : [root]; if (containers.length !== 1) throw new FeedSecurityError("FEED_STRUCTURE_REJECTED");
  const items = rss ? children(containers[0], "item", null) : children(root, "entry", ATOM);
  return items.map((item) => {
    let rawLink: string | null = null;
    if (atom) {
      const link = item.children.find((node) => node.local === "link" && node.namespace === ATOM && (!node.attributes.has("rel") || node.attributes.get("rel") === "alternate")); rawLink = link?.attributes.get("href") ?? null;
    } else rawLink = value(item, ["link"], null);
    if (rawLink && rawLink.length > FIELD_LIMITS.url) throw new FeedSecurityError("URL_LIMIT");
    const namespace = atom ? ATOM : null; const title = bounded(value(item, ["title"], namespace), FIELD_LIMITS.title, true)!;
    const guid = bounded(value(item, atom ? ["id"] : ["guid"], namespace), FIELD_LIMITS.guid); const published = value(item, atom ? ["published", "updated"] : ["pubdate"], namespace);
    const parsedDate = published ? new Date(published) : null; if (parsedDate && Number.isNaN(parsedDate.valueOf())) throw new FeedSecurityError("DATE_INVALID");
    const categoryNodes = children(item, "category", namespace); if (categoryNodes.length > 20) throw new FeedSecurityError("CATEGORY_LIMIT");
    const categories = categoryNodes.map((node) => (atom ? node.attributes.get("term") ?? textContent(node) : textContent(node)).trim().slice(0, FIELD_LIMITS.category)).filter(Boolean);
    const description = first(item, atom ? ["summary", "content"] : ["description"], namespace);
    const atomAuthor = atom ? first(item, ["author"], ATOM) : null;
    const author = atom ? (atomAuthor ? value(atomAuthor, ["name"], ATOM) : null) : value(item, ["author"], null) ?? value(item, ["creator"], DC);
    return { guid, title, link: bounded(rawLink, FIELD_LIMITS.url), publishedAt: parsedDate?.toISOString() ?? null, description: sanitizeDescription(description ? textContent(description) : ""), author: bounded(author, FIELD_LIMITS.author), categories };
  });
}
