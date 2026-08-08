export function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
  return new URL(path, base).toString();
}
