export class InvalidAppUrlError extends Error {
  constructor() {
    super("Application URL configuration is invalid.");
    this.name = "InvalidAppUrlError";
  }
}

export function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
  let origin: URL;
  try {
    origin = new URL(base);
  } catch {
    throw new InvalidAppUrlError();
  }

  const isLocal = origin.hostname === "localhost" || origin.hostname === "127.0.0.1";
  const isWrongVercelHost = origin.hostname === "vercel.com" || origin.hostname === "www.vercel.com";
  if ((!isLocal && origin.protocol !== "https:") || isWrongVercelHost || origin.username || origin.password) {
    throw new InvalidAppUrlError();
  }

  return new URL(path, origin.origin).toString();
}
