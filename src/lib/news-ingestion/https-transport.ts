import { lookup } from "node:dns/promises";
import { request, type RequestOptions } from "node:https";
import { isIP } from "node:net";
import { createGunzip, createInflate } from "node:zlib";
import { FETCH_LIMITS, FeedSecurityError, assertApprovedJimUrl, assertResolvedAddresses, validateFeedResponse } from "./fetch-security";
import { JIM_RSS_ENDPOINT } from "./types";


type ResolvedAddress = { address: string; family: 4 | 6 };
type HopResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: Uint8Array };

function armDestructiveTimeout(target: { destroy(error?: Error): void }, milliseconds: number, code: "CONNECT_TIMEOUT" | "TOTAL_TIMEOUT"): ReturnType<typeof setTimeout> {
  return setTimeout(() => target.destroy(new FeedSecurityError(code)), milliseconds);
}
async function collectBoundedWire(stream: AsyncIterable<Uint8Array> & { destroy(error?: Error): void }): Promise<Buffer[]> {
  const chunks: Buffer[] = []; let size = 0;
  try { for await (const chunk of stream) { size += chunk.byteLength; if (size > FETCH_LIMITS.maxCompressedBytes) { stream.destroy(); throw new FeedSecurityError("COMPRESSED_LIMIT"); } chunks.push(Buffer.from(chunk)); } return chunks; }
  catch (error) { throw error instanceof FeedSecurityError ? error : new FeedSecurityError("NETWORK_FAILED"); }
}
function decodeBoundedBody(chunks: readonly Uint8Array[], encoding: string | undefined, deadline = Number.POSITIVE_INFINITY, observe?: (decoder: import("node:zlib").Gunzip | import("node:zlib").Inflate) => void): Promise<Uint8Array> {
  const normalized = (encoding ?? "identity").trim().toLowerCase(); if (normalized.includes(",") || !["identity", "gzip", "deflate"].includes(normalized)) throw new FeedSecurityError("COMPRESSION_REJECTED");
  if (normalized === "identity") { const body = Buffer.concat(chunks); if (body.byteLength > FETCH_LIMITS.maxDecompressedBytes) throw new FeedSecurityError("DECOMPRESSED_LIMIT"); return Promise.resolve(body); }
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now(); if (remaining <= 0) { reject(new FeedSecurityError("TOTAL_TIMEOUT")); return; }
    const decoder = normalized === "gzip" ? createGunzip() : createInflate(); observe?.(decoder); const output: Buffer[] = []; let size = 0; let settled = false;
    const timer = Number.isFinite(remaining) ? setTimeout(() => decoder.destroy(new FeedSecurityError("TOTAL_TIMEOUT")), remaining) : undefined;
    const absorb = () => undefined;
    const onError = (error: Error) => finish(error);
    const onData = (chunk: Buffer) => { if (settled) return; size += chunk.byteLength; if (size > FETCH_LIMITS.maxDecompressedBytes) decoder.destroy(new FeedSecurityError("DECOMPRESSED_LIMIT")); else output.push(chunk); };
    const onEnd = () => finish();
    const finish = (error?: Error) => {
      if (settled) return; settled = true; if (timer) clearTimeout(timer);
      decoder.removeListener("error", onError); decoder.removeListener("data", onData); decoder.removeListener("end", onEnd); decoder.on("error", absorb);
      const retire = () => decoder.removeListener("error", absorb); if (decoder.closed) retire(); else decoder.once("close", retire);
      if (error) reject(error instanceof FeedSecurityError ? error : new FeedSecurityError("COMPRESSION_MALFORMED")); else resolve(Buffer.concat(output));
    };
    decoder.on("error", onError); decoder.on("data", onData); decoder.on("end", onEnd);
    for (const chunk of chunks) decoder.write(chunk); decoder.end();
  });
}
function sameAddress(left: string | undefined, right: string): boolean { return Boolean(left) && left!.toLowerCase().replace(/^::ffff:/, "") === right.toLowerCase().replace(/^::ffff:/, ""); }

async function requestPinnedHopCore(options: RequestOptions, selected: ResolvedAddress, deadline: number, connectTimeoutMs = FETCH_LIMITS.connectTimeoutMs, observe?: (value: { request: import("node:http").ClientRequest; socket?: import("node:net").Socket; response?: import("node:http").IncomingMessage; absorber?: () => undefined }) => void): Promise<HopResponse> {
  const remaining = deadline - Date.now(); if (remaining <= 0) throw new FeedSecurityError("TOTAL_TIMEOUT");
  return new Promise((resolve, reject) => {
    type State = "PENDING" | "SUCCESS" | "FAILURE"; let state: State = "PENDING"; let connectTimer: ReturnType<typeof setTimeout> | undefined; let socket: import("node:net").Socket | undefined; let response: import("node:http").IncomingMessage | undefined; let requestClosed = false; let socketClosed = false; let responseClosed = false;
    const req = request(options); req.once("close", () => { requestClosed = true; }); observe?.({ request: req }); const overallTimer = armDestructiveTimeout(req, remaining, "TOTAL_TIMEOUT");
    const absorb = () => undefined; req.on("error", absorb);
    const finalize = (next: Exclude<State, "PENDING">, result?: HopResponse, cause?: unknown) => {
      if (state !== "PENDING") return; state = next; clearTimeout(overallTimer); if (connectTimer) clearTimeout(connectTimer);
      req.removeListener("error", fail); socket?.removeListener("error", fail); response?.removeListener("error", fail);
      socket?.on("error", absorb); response?.on("error", absorb);
      const retire = (emitter: import("node:events").EventEmitter, alreadyClosed: boolean) => {
        const remove = () => emitter.removeListener("error", absorb);
        if (alreadyClosed) remove(); else emitter.once("close", remove);
      };
      retire(req, requestClosed); if (socket) retire(socket, socketClosed); if (response) retire(response, responseClosed);
      observe?.({ request: req, socket, response, absorber: absorb });
      if (next === "FAILURE") { response?.destroy(); if (socket && !socket.destroyed) socket.destroy(); if (!req.destroyed) req.destroy(); reject(cause instanceof FeedSecurityError ? cause : new FeedSecurityError("NETWORK_FAILED")); }
      else resolve(result!);
    };
    const fail = (error: unknown) => finalize("FAILURE", undefined, error); req.on("error", fail);
    req.once("socket", (active) => { socket = active; observe?.({ request: req, socket }); active.on("error", fail); connectTimer = armDestructiveTimeout(active, connectTimeoutMs, "CONNECT_TIMEOUT"); active.once("secureConnect", () => { if (connectTimer) clearTimeout(connectTimer); if (!sameAddress(active.remoteAddress, selected.address)) active.destroy(new FeedSecurityError("DNS_REBINDING_BLOCKED")); }); active.once("close", () => { socketClosed = true; if (connectTimer) clearTimeout(connectTimer); }); });
    req.once("response", (incoming) => { response = incoming; incoming.once("close", () => { responseClosed = true; }); observe?.({ request: req, socket, response }); incoming.on("error", fail); void (async () => { try { const wire = await collectBoundedWire(incoming); const body = await decodeBoundedBody(wire, incoming.headers["content-encoding"], deadline); finalize("SUCCESS", { status: incoming.statusCode ?? 0, headers: incoming.headers, body }); } catch (error) { fail(error); } })(); });
    req.end();
  });
}



async function resolveApprovedHost(): Promise<ResolvedAddress[]> { const results = await lookup("www.imi.gov.my", { all: true, verbatim: true }); assertResolvedAddresses(results.map(({ address }) => address)); return results.map(({ address, family }) => ({ address, family: family as 4 | 6 })); }
function buildPinnedRequestOptions(url: URL, selected: ResolvedAddress): RequestOptions { return { protocol: "https:", hostname: url.hostname, port: 443, path: `${url.pathname}${url.search}`, method: "GET", servername: "www.imi.gov.my", rejectUnauthorized: true, family: selected.family, autoSelectFamily: false, headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml", "Accept-Encoding": "gzip, deflate", "User-Agent": "DUTA-News-Pilot/1.0" }, lookup: ((_hostname: string, options: { all?: boolean }, callback: (...arguments_: unknown[]) => void) => options.all ? callback(null, [{ address: selected.address, family: selected.family }]) : callback(null, selected.address, selected.family)) as NonNullable<RequestOptions["lookup"]>, agent: false } as RequestOptions; }
async function requestPinnedHop(url: URL, addresses: readonly ResolvedAddress[], deadline: number) { const selected = addresses[0]; if (!selected) throw new FeedSecurityError("DNS_EMPTY"); return requestPinnedHopCore(buildPinnedRequestOptions(url, selected), selected, deadline); }

/** Fixed production entry point: no caller-controlled resolver, address, CA, port, hostname, or timeout. */
export async function fetchJimRssPinned(): Promise<{ body: Uint8Array; contentType: string; finalUrl: string; redirects: string[] }> {
  let url = assertApprovedJimUrl(JIM_RSS_ENDPOINT); const redirects: string[] = []; const deadline = Date.now() + FETCH_LIMITS.totalTimeoutMs;
  for (;;) {
    const resolved = await resolveApprovedHost(); assertResolvedAddresses(resolved.map(({ address }) => address)); const response = await requestPinnedHop(url, resolved, deadline);
    if ([301, 302, 303, 307, 308].includes(response.status)) { if (redirects.length >= FETCH_LIMITS.maxRedirects) throw new FeedSecurityError("TOO_MANY_REDIRECTS"); const location = response.headers.location; if (typeof location !== "string" || !location) throw new FeedSecurityError("REDIRECT_LOCATION_INVALID"); let next: URL; try { next = new URL(location, url); } catch { throw new FeedSecurityError("REDIRECT_LOCATION_INVALID"); } if (next.username || next.password || isIP(next.hostname)) throw new FeedSecurityError("REDIRECT_DESTINATION_REJECTED"); url = assertApprovedJimUrl(next.href); if (redirects.includes(url.href)) throw new FeedSecurityError("REDIRECT_LOOP"); redirects.push(url.href); continue; }
    if (response.status !== 200) throw new FeedSecurityError("HTTP_STATUS_REJECTED"); const contentType = response.headers["content-type"]; if (typeof contentType !== "string") throw new FeedSecurityError("MIME_REJECTED"); validateFeedResponse({ status: response.status, contentType, compressedBytes: 0, finalUrl: url.href, redirects }, response.body.byteLength); return { body: response.body, contentType, finalUrl: url.href, redirects };
  }
}
