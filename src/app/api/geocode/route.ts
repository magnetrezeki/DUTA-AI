import { createClient } from "@/lib/supabase/server";

type NominatimResult = { lat?: string; lon?: string; display_name?: string };

let lastProviderRequestAt = 0;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_country_code,onboarding_completed")
    .eq("id", user.id)
    .single<{ current_country_code: string; onboarding_completed: boolean }>();
  if (!profile?.onboarding_completed) return Response.json({ error: "forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!isAddressRequest(body)) return Response.json({ error: "invalid_request" }, { status: 400 });

  const fullAddress = [body.address, body.city, body.state].map((part) => part.trim()).join(", ");
  if (fullAddress.length < 10 || fullAddress.length > 500) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const params = new URLSearchParams({
    q: fullAddress,
    format: "jsonv2",
    limit: "1",
    countrycodes: profile.current_country_code.toLowerCase(),
  });

  const now = Date.now();
  if (now - lastProviderRequestAt < 1100) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  lastProviderRequestAt = now;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "id,en;q=0.8",
        "User-Agent": "DUTA-AI/1.0 (https://github.com/magnetrezeki/DUTA-AI)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return Response.json({ error: "provider_unavailable" }, { status: 503 });
    const results = (await response.json()) as NominatimResult[];
    const match = results[0];
    const latitude = Number(match?.lat);
    const longitude = Number(match?.lon);
    if (!match || !validCoordinates(latitude, longitude)) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json(
      { latitude, longitude, label: match.display_name || fullAddress },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json({ error: "provider_unavailable" }, { status: 503 });
  }
}

function isAddressRequest(value: unknown): value is { address: string; city: string; state: string } {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.address === "string" && typeof record.city === "string" && typeof record.state === "string";
}

function validCoordinates(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}
