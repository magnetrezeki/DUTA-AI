import { EventEmitter } from "node:events";

let active;
const pendingContexts = [];
const ownedResources = new Set();
const activeTimers = new Set();

class ControlledResource extends EventEmitter {
  closed = false;
  destroyed = false;
  readableEnded = false;
  kind;

  constructor(kind) {
    super();
    this.kind = kind;
    ownedResources.add(this);
  }

  activate() { ownedResources.add(this); }

  destroy(error) {
    if (this.destroyed) return this;
    this.destroyed = true;
    queueMicrotask(() => {
      if (error) this.emit("error", error);
      setImmediate(() => this.close());
    });
    return this;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.readableEnded = true;
    this.destroyed = true;
    this.emit("close");
    ownedResources.delete(this);
  }
}

class ControlledSocket extends ControlledResource {
  remoteAddress;
  constructor(remoteAddress) { super("socket"); this.remoteAddress = remoteAddress; }
}

class ControlledResponse extends ControlledResource {
  statusCode = 200;
  headers = {};
  #chunks = [];
  #finished = false;
  #waiters = [];
  #autoClose;
  #request;

  constructor(autoClose, request) {
    super("stream");
    this.#autoClose = autoClose;
    this.#request = request;
  }

  finish(chunks = []) {
    this.#chunks.push(...chunks);
    this.#finished = true;
    for (const wake of this.#waiters.splice(0)) wake();
  }

  async *[Symbol.asyncIterator]() {
    while (!this.#finished) await new Promise((resolve) => this.#waiters.push(resolve));
    yield* this.#chunks;
    this.readableEnded = true;
    if (this.#autoClose) setImmediate(() => {
      this.close();
      this.#request.socket.close();
      this.#request.close();
    });
  }
}

class ControlledRequest extends ControlledResource {
  socket;
  response;
  constructor(autoClose, remoteAddress) {
    super("request");
    this.socket = new ControlledSocket(remoteAddress);
    this.response = new ControlledResponse(autoClose, this);
  }
  end() {}
}

class ControlledDecoder extends ControlledResource {
  #chunks = [];
  #autoClose;
  #deferEnd;
  constructor(autoClose, deferEnd) { super("decompressor"); this.#autoClose = autoClose; this.#deferEnd = deferEnd; }
  write(chunk) { this.#chunks.push(Buffer.from(chunk)); }
  end() {
    if (this.#deferEnd) return;
    this.finish();
  }
  finish() {
    for (const chunk of this.#chunks) this.emit("data", chunk);
    this.readableEnded = true;
    this.emit("end");
    if (this.#autoClose) setImmediate(() => this.close());
  }
}

export function createControlledLifecycle({ autoClose = false, deferDecoderEnd = false, remoteAddress = "127.0.0.1" } = {}) {
  const request = new ControlledRequest(autoClose, remoteAddress);
  ownedResources.delete(request.response);
  const decoders = [];
  const timers = new Set();
  const context = { request, decoders, timers, autoClose, deferDecoderEnd };
  active = context;
  pendingContexts.push(context);
  return {
    request,
    socket: request.socket,
    response: request.response,
    decoders,
    timers,
    emitSocket() { request.emit("socket", request.socket); },
    connect() { request.socket.emit("secureConnect"); },
    emitResponse(status = 200, headers = {}) {
      request.response.activate();
      request.response.statusCode = status;
      request.response.headers = headers;
      request.emit("response", request.response);
    },
    finishResponse(chunks = [Buffer.from("ok")]) { request.response.finish(chunks); },
    finishDecoder() { for (const decoder of decoders) decoder.finish(); },
    activeTimerCount() { return [...timers].filter((timer) => timer.active).length; },
    timerAt(index) { return [...timers][index]; },
    async waitForNaturalClose() {
      const resources = [request.response, request.socket, request, ...decoders];
      await Promise.all(resources.map((resource) => resource.closed ? undefined : new Promise((resolve) => resource.once("close", resolve))));
    },
    emergencyCleanup() {
      for (const resource of [request.response, request.socket, request, ...decoders]) resource.close();
      for (const timer of timers) timer.clear();
    },
  };
}

export function request() {
  active = pendingContexts.shift() ?? active;
  if (!active) throw new Error("controlled lifecycle is not active");
  return active.request;
}

export async function controlledLookup() {
  return [{ address: "8.8.8.8", family: 4 }];
}

export function createGunzip() {
  const decoder = new ControlledDecoder(active.autoClose, active.deferDecoderEnd);
  active.decoders.push(decoder);
  return decoder;
}

export const createInflate = createGunzip;

export function controlledSetTimeout(callback) {
  const owner = active;
  const timer = {
    active: true,
    callback,
    fire() { if (!this.active) return; this.active = false; activeTimers.delete(this); callback(); },
    fireStale() { callback(); },
    clear() { this.active = false; activeTimers.delete(this); },
  };
  owner.timers.add(timer);
  activeTimers.add(timer);
  return timer;
}

export function controlledClearTimeout(timer) { timer?.clear(); }

export function globalOwnedSnapshot() {
  const counts = { timers: activeTimers.size, requests: 0, sockets: 0, streams: 0, decompressors: 0, errorListeners: 0, pendingRequests: pendingContexts.length };
  for (const resource of ownedResources) {
    if (resource.kind === "request") counts.requests += 1;
    if (resource.kind === "socket") counts.sockets += 1;
    if (resource.kind === "stream") counts.streams += 1;
    if (resource.kind === "decompressor") counts.decompressors += 1;
    counts.errorListeners += resource.listenerCount("error");
  }
  return counts;
}
