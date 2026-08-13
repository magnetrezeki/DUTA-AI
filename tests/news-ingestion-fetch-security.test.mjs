import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer as createHttpsServer } from "node:https";
import { createServer as createTcpServer } from "node:net";
import test, { after } from "node:test";
import { pathToFileURL } from "node:url";

const temp = await mkdtemp(path.join(tmpdir(), "duta-news-fetch-"));
after(() => rm(temp, { recursive: true, force: true }));
for (const name of ["types", "fetch-security", "https-transport"]) {
  let source = await readFile(new URL(`../src/lib/news-ingestion/${name}.ts`, import.meta.url), "utf8");
  source = source.replace(/from "\.\/(types|fetch-security|https-transport)"/g, 'from "./$1.ts"');
  if (name === "https-transport") source += "\nexport { requestPinnedHopCore, decodeBoundedBody, collectBoundedWire, armDestructiveTimeout };\n";
  await writeFile(path.join(temp, `${name}.ts`), source);
}
const security = await import(pathToFileURL(path.join(temp, "fetch-security.ts")));
const types = await import(pathToFileURL(path.join(temp, "types.ts")));
const transport = await import(pathToFileURL(path.join(temp, "https-transport.ts")));
const core = transport;
const controlledHarnessUrl = new URL("./support/news-ingestion-controlled-resources.mjs", import.meta.url);
let controlledSource = await readFile(new URL("../src/lib/news-ingestion/https-transport.ts", import.meta.url), "utf8");
controlledSource = controlledSource
  .replace('import { lookup } from "node:dns/promises";', `import { controlledLookup as lookup } from "${controlledHarnessUrl.href}";`)
  .replace('import { request, type RequestOptions } from "node:https";', `import { request, createGunzip, createInflate, controlledSetTimeout as setTimeout, controlledClearTimeout as clearTimeout } from "${controlledHarnessUrl.href}";\nimport type { RequestOptions } from "node:https";`)
  .replace('import { createGunzip, createInflate } from "node:zlib";\n', "")
  .replace(/from "\.\/(types|fetch-security|https-transport)"/g, 'from "./$1.ts"')
  + "\nexport { requestPinnedHopCore, decodeBoundedBody };\n";
await writeFile(path.join(temp, "https-transport-controlled.ts"), controlledSource);
const controlledCore = await import(pathToFileURL(path.join(temp, "https-transport-controlled.ts")));
const controlledHarness = await import(controlledHarnessUrl);
const openssl = process.platform === "win32" ? "C:\\Program Files\\Git\\usr\\bin\\openssl.exe" : "openssl";
function makeCertificate(name) {
  const directory = path.join(temp, name); const key = path.join(directory, "key.pem"); const cert = path.join(directory, "cert.pem");
  const mkdir = spawnSync(process.platform === "win32" ? "cmd" : "mkdir", process.platform === "win32" ? ["/c", "mkdir", directory] : ["-p", directory]); if (mkdir.status !== 0) throw new Error("test certificate directory failed");
  const generated = spawnSync(openssl, ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-batch", "-keyout", key, "-out", cert, "-days", "1", "-subj", `/CN=${name}`, "-addext", `subjectAltName=DNS:${name}`]); if (generated.status !== 0) throw new Error("local OpenSSL is required for TLS tests");
  return Promise.all([readFile(key), readFile(cert)]);
}
const [testKey, testCert] = await makeCertificate("www.imi.gov.my");
const [wrongHostKey, wrongHostCert] = await makeCertificate("wrong.invalid");
function testOptions(port, ca = testCert) { const options = { protocol: "https:", hostname: "www.imi.gov.my", port, path: "/index.php/feed/", method: "GET", servername: "www.imi.gov.my", rejectUnauthorized: true, family: 4, autoSelectFamily: false, lookup: (_hostname, lookupOptions, callback) => lookupOptions.all ? callback(null, [{ address: "127.0.0.1", family: 4 }]) : callback(null, "127.0.0.1", 4), agent: false }; if (ca) options.ca = ca; return options; }

test("repository production transport exports only the fixed no-argument fetch entry point", async () => {
  const productionSource = await readFile(new URL("../src/lib/news-ingestion/https-transport.ts", import.meta.url), "utf8");
  assert.deepEqual([...productionSource.matchAll(/^export\s+(?:async\s+)?function\s+(\w+)/gm)].map((match) => match[1]), ["fetchJimRssPinned"]);
  assert.equal(transport.fetchJimRssPinned.length, 0);
});

async function listen(server) {
  const sockets = new Set();
  server.__testSockets = sockets;
  server.on("connection", (socket) => { sockets.add(socket); socket.once("close", () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return server.address().port;
}
async function close(server) {
  const sockets = [...(server.__testSockets ?? [])];
  const closed = sockets.map((socket) => socket.destroyed ? Promise.resolve() : new Promise((resolve) => socket.once("close", resolve)));
  for (const socket of sockets) socket.destroy();
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  await Promise.all(closed);
}

test("implementation has no live fetch or Supabase write dependency", async () => {
  const combined = await Promise.all(["fetch-security", "https-transport", "rss-parser", "normalize", "dry-run"].map((name) => readFile(new URL(`../src/lib/news-ingestion/${name}.ts`, import.meta.url), "utf8")));
  const source = combined.join("\n");
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /supabase|acquire_news_ingestion_run|insert\s+into|update\s+public\./i);
});

test("only the exact HTTPS JIM RSS endpoint is accepted", () => {
  assert.equal(security.assertApprovedJimUrl(types.JIM_RSS_ENDPOINT).href, types.JIM_RSS_ENDPOINT);
  for (const value of ["http://www.imi.gov.my/index.php/feed/", "https://imi.gov.my/index.php/feed/", "https://evil.www.imi.gov.my/index.php/feed/", "https://www.imi.gov.my:444/index.php/feed/", "https://www.imi.gov.my/other", "https://localhost/feed", "https://127.0.0.1/feed"])
    assert.throws(() => security.assertApprovedJimUrl(value));
});

test("non-public network destinations are rejected", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "100.64.0.1", "169.254.169.254", "224.0.0.1", "0.0.0.0", "::1", "fc00::1", "fe80::1", "ff02::1", "2001:db8::1"])
    assert.equal(security.isPublicInternetAddress(address), false, address);
  assert.equal(security.isPublicInternetAddress("8.8.8.8"), true);
});

test("redirect, MIME, charset, compression and payload checks fail closed", () => {
  const base = { status: 200, contentType: "application/rss+xml; charset=utf-8", compressedBytes: 10, finalUrl: types.JIM_RSS_ENDPOINT, redirects: [] };
  security.validateFeedResponse(base, 100);
  assert.throws(() => security.validateFeedResponse({ ...base, status: 302 }, 100));
  assert.throws(() => security.validateFeedResponse({ ...base, contentType: "text/html" }, 100));
  assert.throws(() => security.validateFeedResponse({ ...base, contentType: "application/json" }, 100));
  assert.throws(() => security.validateFeedResponse({ ...base, charset: "utf-16" }, 100));
  assert.throws(() => security.validateFeedResponse({ ...base, contentEncoding: "compress" }, 100));
  assert.throws(() => security.validateFeedResponse({ ...base, compressedBytes: security.FETCH_LIMITS.maxCompressedBytes + 1 }, 100));
  assert.throws(() => security.validateFeedResponse(base, security.FETCH_LIMITS.maxDecompressedBytes + 1));
  assert.throws(() => security.assertRedirectChain([types.JIM_RSS_ENDPOINT, types.JIM_RSS_ENDPOINT, types.JIM_RSS_ENDPOINT], types.JIM_RSS_ENDPOINT));
  assert.throws(() => security.assertRedirectChain(["https://example.com/feed"], types.JIM_RSS_ENDPOINT));
});

test("all DNS results must pass the public-address gate", () => assert.throws(() => security.assertResolvedAddresses(["8.8.8.8", "127.0.0.1"])));

test("test adapter exercises all=true and deterministic family without resolver fallback", () => {
  const options = testOptions(443);
  assert.equal(options.servername, "www.imi.gov.my");
  assert.equal(options.rejectUnauthorized, true);
  let result;
  options.lookup("www.imi.gov.my", {}, (...args) => { result = args; });
  assert.deepEqual(result, [null, "127.0.0.1", 4]);
  options.lookup("www.imi.gov.my", { all: true }, (...args) => { result = args; });
  assert.deepEqual(result, [null, [{ address: "127.0.0.1", family: 4 }]]);
  assert.equal(options.family, 4);
  assert.equal(options.autoSelectFamily, false);
});

test("local TLS runtime proves pinned destination, SNI and certificate verification", async () => {
  let observedSni;
  let peerAddress;
  const server = createHttpsServer({ key: testKey, cert: testCert }, (_request, response) => {
    response.writeHead(200, { "content-type": "application/rss+xml" });
    response.end("<rss><channel/></rss>");
  });
  server.on("secureConnection", (socket) => { observedSni = socket.servername; peerAddress = socket.localAddress; });
  const port = await listen(server);
  try {
    const result = await core.requestPinnedHopCore(testOptions(port), { address: "127.0.0.1", family: 4 }, Date.now() + 2_000);
    assert.equal(result.status, 200);
    assert.equal(observedSni, "www.imi.gov.my");
    assert.equal(peerAddress, "127.0.0.1");
    await assert.rejects(() => core.requestPinnedHopCore(testOptions(port, null), { address: "127.0.0.1", family: 4 }, Date.now() + 2_000), /NETWORK_FAILED/);
  } finally { await close(server); }
});

test("local TLS runtime rejects a trusted certificate for the wrong hostname", async () => {
  const server = createHttpsServer({ key: wrongHostKey, cert: wrongHostCert }, (_request, response) => response.end("never accepted"));
  const port = await listen(server);
  try {
    await assert.rejects(() => core.requestPinnedHopCore(testOptions(port, wrongHostCert), { address: "127.0.0.1", family: 4 }, Date.now() + 2_000), /NETWORK_FAILED/);
  } finally { await close(server); }
});

test("production request lifecycle aborts stalled TLS connect and stalled response", async () => {
  const tcp = createTcpServer(() => {});
  const tcpPort = await listen(tcp);
  try {
    await assert.rejects(() => core.requestPinnedHopCore(testOptions(tcpPort), { address: "127.0.0.1", family: 4 }, Date.now() + 1_000, 25), /CONNECT_TIMEOUT/);
  } finally { await close(tcp); }

  const https = createHttpsServer({ key: testKey, cert: testCert }, (_request, response) => {
    response.writeHead(200, { "content-type": "application/rss+xml" });
    response.write("<rss>");
  });
  const httpsPort = await listen(https);
  try {
    await assert.rejects(() => core.requestPinnedHopCore(testOptions(httpsPort), { address: "127.0.0.1", family: 4 }, Date.now() + 40), /TOTAL_TIMEOUT/);
  } finally { await close(https); }
});

test("local TLS failure matrix closes malformed compression, wire-limit and remote-close paths", async () => {
  const cases = [
    { headers: { "content-encoding": "gzip" }, body: Buffer.from("not-gzip") },
    { headers: {}, body: Buffer.alloc(security.FETCH_LIMITS.maxCompressedBytes + 1) },
  ];
  for (const scenario of cases) {
    const server = createHttpsServer({ key: testKey, cert: testCert }, (_request, response) => {
      response.writeHead(200, scenario.headers); response.end(scenario.body);
    });
    const port = await listen(server);
    try {
      await assert.rejects(() => core.requestPinnedHopCore(testOptions(port), { address: "127.0.0.1", family: 4 }, Date.now() + 2_000));
    } finally { await close(server); }
    assert.equal([...server.__testSockets].every((socket) => socket.destroyed), true);
  }
  const resetServer = createHttpsServer({ key: testKey, cert: testCert }, (request) => request.socket.destroy());
  const resetPort = await listen(resetServer);
  try {
    await assert.rejects(() => core.requestPinnedHopCore(testOptions(resetPort), { address: "127.0.0.1", family: 4 }, Date.now() + 2_000), /NETWORK_FAILED/);
  } finally { await close(resetServer); }
  assert.equal([...resetServer.__testSockets].every((socket) => socket.destroyed), true);
});

test("late request, socket and response errors settle once without becoming unhandled", async () => {
  const server = createHttpsServer({ key: testKey, cert: testCert }, (_request, response) => response.end("ok"));
  const port = await listen(server); let resources = {}; let settlements = 0;
  try {
    await core.requestPinnedHopCore(testOptions(port), { address: "127.0.0.1", family: 4 }, Date.now() + 2_000, 5_000, (value) => { resources = { ...resources, ...value }; }).then(() => { settlements += 1; }, () => { settlements += 1; });
    await new Promise((resolve) => setImmediate(resolve));
    if (!resources.request.closed) resources.request.emit("error", new Error("late request"));
    if (!resources.socket.destroyed) resources.socket.emit("error", new Error("late socket"));
    if (!resources.response.closed) resources.response.emit("error", new Error("late response"));
    await new Promise((resolve) => setImmediate(resolve)); assert.equal(settlements, 1);
  } finally { await close(server); }
});

test("late decompressor error is absorbed after exactly one settlement", async () => {
  const { gzipSync } = await import("node:zlib"); let decoder; let settlements = 0;
  await core.decodeBoundedBody([gzipSync(Buffer.from("ok"))], "gzip", Date.now() + 1_000, (value) => { decoder = value; }).then(() => { settlements += 1; }, () => { settlements += 1; });
  await new Promise((resolve) => setImmediate(resolve));
  if (!decoder.closed) decoder.emit("error", new Error("late decoder"));
  assert.equal(settlements, 1);
});

async function controlledSuccessfulLifecycle({ encoding, autoClose = false } = {}) {
  const lifecycle = controlledHarness.createControlledLifecycle({ autoClose }); let observed = {}; let settlements = 0;
  const operation = controlledCore.requestPinnedHopCore(
    testOptions(443),
    { address: "127.0.0.1", family: 4 },
    Date.now() + 60_000,
    5_000,
    (value) => { observed = { ...observed, ...value }; },
  ).then((value) => { settlements += 1; return value; }, (error) => { settlements += 1; throw error; });
  lifecycle.emitSocket(); lifecycle.connect(); lifecycle.emitResponse(200, encoding ? { "content-encoding": encoding } : {}); lifecycle.finishResponse();
  await operation;
  return { lifecycle, observed, settlements: () => settlements };
}

for (const kind of ["request", "socket", "response"]) {
  test(`deterministic late ${kind} error crosses an event-loop turn before close`, async () => {
    const proof = await controlledSuccessfulLifecycle(); const resource = proof.lifecycle[kind];
    assert.equal(resource.closed, false); assert.equal(resource.destroyed, false);
    await new Promise((resolve) => setImmediate(resolve)); await new Promise((resolve) => setImmediate(resolve));
    assert.equal(resource.closed, false); assert.equal(resource.listeners("error").includes(proof.observed.absorber), true);
    resource.emit("error", new Error(`late ${kind}`)); assert.equal(proof.settlements(), 1);
    resource.close(); await new Promise((resolve) => setImmediate(resolve));
    assert.equal(resource.listeners("error").includes(proof.observed.absorber), false);
    proof.lifecycle.emergencyCleanup(); assert.equal(proof.lifecycle.activeTimerCount(), 0);
  });
}

test("deterministic late decompressor error crosses an event-loop turn and retires its absorber", async () => {
  const proof = await controlledSuccessfulLifecycle({ encoding: "gzip" }); const decoder = proof.lifecycle.decoders[0];
  assert.equal(decoder.closed, false); assert.equal(decoder.destroyed, false); assert.equal(decoder.listenerCount("error"), 1);
  await new Promise((resolve) => setImmediate(resolve)); await new Promise((resolve) => setImmediate(resolve));
  assert.equal(decoder.closed, false); decoder.emit("error", new Error("late decoder")); assert.equal(proof.settlements(), 1);
  decoder.close(); await new Promise((resolve) => setImmediate(resolve)); assert.equal(decoder.listenerCount("error"), 0);
  proof.lifecycle.emergencyCleanup(); assert.equal(proof.lifecycle.activeTimerCount(), 0);
});

test("deterministic connect timeout and connection races settle once and clear stale timers", async () => {
  {
    const lifecycle = controlledHarness.createControlledLifecycle(); let settlements = 0;
    const operation = controlledCore.requestPinnedHopCore(testOptions(443), { address: "127.0.0.1", family: 4 }, Date.now() + 60_000, 5_000).then(() => { settlements += 1; }, () => { settlements += 1; });
    lifecycle.emitSocket(); assert.equal(lifecycle.activeTimerCount(), 2); lifecycle.timerAt(1).fire(); await operation;
    await new Promise((resolve) => setImmediate(resolve)); lifecycle.connect(); await new Promise((resolve) => setImmediate(resolve));
    assert.equal(settlements, 1); assert.equal(lifecycle.socket.closed, true); assert.equal(lifecycle.request.closed, true); assert.equal(lifecycle.activeTimerCount(), 0); lifecycle.emergencyCleanup();
  }
  {
    const lifecycle = controlledHarness.createControlledLifecycle({ autoClose: true }); let settlements = 0;
    const operation = controlledCore.requestPinnedHopCore(testOptions(443), { address: "127.0.0.1", family: 4 }, Date.now() + 60_000, 5_000).then(() => { settlements += 1; }, () => { settlements += 1; });
    lifecycle.emitSocket(); assert.equal(lifecycle.activeTimerCount(), 2); lifecycle.connect(); assert.equal(lifecycle.activeTimerCount(), 1);
    lifecycle.emitResponse(); lifecycle.finishResponse(); await operation;
    await lifecycle.waitForNaturalClose(); assert.equal(settlements, 1); assert.equal(lifecycle.activeTimerCount(), 0);
  }
});

test("stale connect and overall callbacks cannot affect a later operation", async () => {
  const first = controlledHarness.createControlledLifecycle({ autoClose: true }); let firstSettlements = 0;
  const firstOperation = controlledCore.requestPinnedHopCore(testOptions(443), { address: "127.0.0.1", family: 4 }, Date.now() + 60_000, 5_000).then(() => { firstSettlements += 1; }, () => { firstSettlements += 1; });
  first.emitSocket(); const staleOverall = first.timerAt(0); const staleConnect = first.timerAt(1); first.connect(); first.emitResponse(); first.finishResponse(); await firstOperation; await first.waitForNaturalClose();
  const second = controlledHarness.createControlledLifecycle({ autoClose: true }); let secondSettlements = 0;
  const secondOperation = controlledCore.requestPinnedHopCore(testOptions(443), { address: "127.0.0.1", family: 4 }, Date.now() + 60_000, 5_000).then(() => { secondSettlements += 1; }, () => { secondSettlements += 1; });
  second.emitSocket(); second.connect(); staleConnect.fireStale(); staleOverall.fireStale();
  assert.equal(second.request.destroyed, false); assert.equal(second.socket.destroyed, false); assert.equal(secondSettlements, 0);
  second.emitResponse(); second.finishResponse(); await secondOperation;
  await second.waitForNaturalClose(); assert.equal(firstSettlements, 1); assert.equal(secondSettlements, 1);
});

test("deterministic overall timeout and response-completion orderings settle once", async () => {
  {
    const lifecycle = controlledHarness.createControlledLifecycle(); let settlements = 0;
    const operation = controlledCore.requestPinnedHopCore(testOptions(443), { address: "127.0.0.1", family: 4 }, Date.now() + 60_000, 5_000).then(() => { settlements += 1; }, () => { settlements += 1; });
    lifecycle.emitSocket(); lifecycle.connect(); lifecycle.emitResponse(); lifecycle.timerAt(0).fire(); await operation; lifecycle.finishResponse();
    await lifecycle.waitForNaturalClose(); assert.equal(settlements, 1); assert.equal(lifecycle.activeTimerCount(), 0);
  }
  {
    const lifecycle = controlledHarness.createControlledLifecycle({ autoClose: true }); let settlements = 0;
    const operation = controlledCore.requestPinnedHopCore(testOptions(443), { address: "127.0.0.1", family: 4 }, Date.now() + 60_000, 5_000).then(() => { settlements += 1; }, () => { settlements += 1; });
    lifecycle.emitSocket(); lifecycle.connect(); const staleOverall = lifecycle.timerAt(0); lifecycle.emitResponse(); lifecycle.finishResponse(); await operation; staleOverall.fireStale(); await lifecycle.waitForNaturalClose();
    assert.equal(settlements, 1); assert.equal(lifecycle.activeTimerCount(), 0);
  }
});

test("redirect and overall timeout orderings are deterministic across controlled hops", async () => {
  {
    const first = controlledHarness.createControlledLifecycle({ remoteAddress: "8.8.8.8" }); let settlements = 0;
    const operation = controlledCore.fetchJimRssPinned().then(() => { settlements += 1; }, () => { settlements += 1; });
    await new Promise((resolve) => setImmediate(resolve)); first.emitSocket(); first.connect(); first.timerAt(0).fire(); await operation;
    await Promise.all([first.request, first.socket].map((resource) => resource.closed ? undefined : new Promise((resolve) => resource.once("close", resolve))));
    assert.equal(settlements, 1); assert.equal(controlledHarness.globalOwnedSnapshot().pendingRequests, 0); first.emergencyCleanup();
  }
  {
    const first = controlledHarness.createControlledLifecycle({ autoClose: true, remoteAddress: "8.8.8.8" });
    const second = controlledHarness.createControlledLifecycle({ autoClose: true, remoteAddress: "8.8.8.8" }); let settlements = 0;
    const operation = controlledCore.fetchJimRssPinned().then(() => { settlements += 1; }, () => { settlements += 1; });
    await new Promise((resolve) => setImmediate(resolve)); first.emitSocket(); first.connect(); first.emitResponse(302, { location: "/index.php/feed/" }); first.finishResponse([]);
    for (let turn = 0; turn < 5 && second.request.listenerCount("socket") === 0; turn += 1) await new Promise((resolve) => setImmediate(resolve));
    assert.ok(second.request.listenerCount("socket") > 0); second.emitSocket(); second.connect(); second.emitResponse(200, { "content-type": "application/rss+xml" }); second.finishResponse([Buffer.from("<rss><channel/></rss>")]);
    await operation; await Promise.all([first.waitForNaturalClose(), second.waitForNaturalClose()]);
    assert.equal(settlements, 1); assert.equal(first.activeTimerCount(), 0); assert.equal(second.activeTimerCount(), 0);
  }
});

test("response and decompressor errors are safe in both controlled orderings", async () => {
  for (const first of ["response", "decompressor"]) {
    const lifecycle = controlledHarness.createControlledLifecycle({ deferDecoderEnd: true }); let settlements = 0;
    const operation = controlledCore.requestPinnedHopCore(testOptions(443), { address: "127.0.0.1", family: 4 }, Date.now() + 60_000, 5_000).then(() => { settlements += 1; }, () => { settlements += 1; });
    lifecycle.emitSocket(); lifecycle.connect(); lifecycle.emitResponse(200, { "content-encoding": "gzip" }); lifecycle.finishResponse();
    await new Promise((resolve) => setImmediate(resolve)); const decoder = lifecycle.decoders[0]; assert.ok(decoder);
    if (first === "response") { lifecycle.response.emit("error", new Error("response first")); decoder.emit("error", new Error("decoder later")); }
    else { decoder.emit("error", new Error("decoder first")); lifecycle.response.emit("error", new Error("response later")); }
    await operation; decoder.close(); await lifecycle.waitForNaturalClose(); assert.equal(settlements, 1);
  }
});

test("controlled repeated lifecycle runs return global ownership to baseline", async () => {
  const baseline = controlledHarness.globalOwnedSnapshot();
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const proof = await controlledSuccessfulLifecycle({ encoding: "gzip", autoClose: true }); const decoder = proof.lifecycle.decoders[0];
    await proof.lifecycle.waitForNaturalClose(); await new Promise((resolve) => setImmediate(resolve));
    const counts = [proof.lifecycle.request, proof.lifecycle.socket, proof.lifecycle.response, decoder].map((resource) => resource.listenerCount("error"));
    assert.deepEqual(counts, [0, 0, 0, 0]); assert.equal(proof.lifecycle.activeTimerCount(), 0);
    assert.equal(proof.lifecycle.request.closed, true); assert.equal(proof.lifecycle.socket.closed, true); assert.equal(proof.lifecycle.response.closed, true); assert.equal(decoder.closed, true);
    assert.deepEqual(controlledHarness.globalOwnedSnapshot(), baseline);
  }
  assert.deepEqual(controlledHarness.globalOwnedSnapshot(), baseline);
});

test("repeated request cycles retire transport error absorbers after close", async () => {
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const server = createHttpsServer({ key: testKey, cert: testCert }, (_request, response) => response.end("ok")); const port = await listen(server); let resources = {};
    try { await core.requestPinnedHopCore(testOptions(port), { address: "127.0.0.1", family: 4 }, Date.now() + 2_000, 5_000, (value) => { resources = { ...resources, ...value }; }); }
    finally { await close(server); }
    await Promise.all([resources.request, resources.socket, resources.response].map((resource) => (
      resource.closed || resource.destroyed
        ? Promise.resolve()
        : new Promise((resolve) => resource.once("close", resolve))
    )));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(resources.request.listeners("error").includes(resources.absorber), false);
    assert.equal(resources.socket.listeners("error").includes(resources.absorber), false);
    assert.equal(resources.response.listeners("error").includes(resources.absorber), false);
  }
});

test("timeout races still settle each request exactly once", async () => {
  for (const scenario of [
    { status: 200, delay: 10, deadline: 80, body: "ok" },
    { status: 200, delay: 80, deadline: 15, body: "late" },
    { status: 302, delay: 10, deadline: 80, body: "" },
    { status: 302, delay: 80, deadline: 15, body: "" },
  ]) {
    const server = createHttpsServer({ key: testKey, cert: testCert }, (_request, response) => setTimeout(() => { response.writeHead(scenario.status, scenario.status === 302 ? { location: "/index.php/feed/" } : {}); response.end(scenario.body); }, scenario.delay));
    const port = await listen(server); let settlements = 0;
    try { await core.requestPinnedHopCore(testOptions(port), { address: "127.0.0.1", family: 4 }, Date.now() + scenario.deadline).then(() => { settlements += 1; }, () => { settlements += 1; }); }
    finally { await close(server); }
    await new Promise((resolve) => setImmediate(resolve)); assert.equal(settlements, 1);
  }
});

test("response and decompressor failures racing still reject exactly once", async () => {
  const server = createHttpsServer({ key: testKey, cert: testCert }, (request, response) => { response.writeHead(200, { "content-encoding": "gzip" }); response.write("bad-gzip"); setImmediate(() => request.socket.destroy(new Error("racing reset"))); });
  const port = await listen(server); let settlements = 0;
  try { await core.requestPinnedHopCore(testOptions(port), { address: "127.0.0.1", family: 4 }, Date.now() + 1_000).then(() => { settlements += 1; }, () => { settlements += 1; }); }
  finally { await close(server); }
  await new Promise((resolve) => setImmediate(resolve)); assert.equal(settlements, 1);
});

test("redirect URL policy rejects every destination except the exact frozen endpoint", () => { for (const value of ["http://www.imi.gov.my/index.php/feed/", "https://evil.example/feed", "https://www.imi.gov.my/other", "https://user@www.imi.gov.my/index.php/feed/"]) assert.throws(() => security.assertApprovedJimUrl(value)); });

test("bounded decompression rejects malformed streams and bombs", async () => {
  await assert.rejects(() => core.decodeBoundedBody([Buffer.from("bad")], "gzip"));
  assert.throws(() => core.decodeBoundedBody([Buffer.alloc(1)], "br"));
  const { gzipSync } = await import("node:zlib");
  const bomb = gzipSync(Buffer.alloc(security.FETCH_LIMITS.maxDecompressedBytes + 1, 65));
  await assert.rejects(() => core.decodeBoundedBody([bomb], "gzip"));
  await assert.rejects(() => core.decodeBoundedBody([bomb], "gzip", Date.now() - 1), /TOTAL_TIMEOUT/);
});

test("wire limit aborts during streaming despite deceptive metadata", async () => {
  const { Readable } = await import("node:stream");
  const stream = Readable.from([Buffer.alloc(700_000), Buffer.alloc(400_000)]);
  await assert.rejects(() => core.collectBoundedWire(stream), /COMPRESSED_LIMIT/);
  assert.equal(stream.destroyed, true);
});

test("connect and overall timeout mechanism actively destroys its target", async () => {
  for (const code of ["CONNECT_TIMEOUT", "TOTAL_TIMEOUT"]) {
    let received;
    const target = { destroy(error) { received = error; } };
    core.armDestructiveTimeout(target, 5, code);
    await new Promise((resolve) => setTimeout(resolve, 15));
    assert.equal(received?.code, code);
  }
});
