import { OLONGAPO_CENTER_POINT } from "@/lib/map/constants";

export type GeoPoint = {
  lat: number;
  lng: number;
};

interface GeocodeOptions {
  seed?: string;
  fallback?: GeoPoint;
}

type GeoCacheGlobal = typeof globalThis & {
  __growlokalGeoCache?: Map<string, GeoPoint>;
};

const globalGeo = globalThis as GeoCacheGlobal;
const geoCache = globalGeo.__growlokalGeoCache ?? new Map<string, GeoPoint>();

if (!globalGeo.__growlokalGeoCache) {
  globalGeo.__growlokalGeoCache = geoCache;
}

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const CONTACT_EMAIL =
  process.env.NOMINATIM_CONTACT ||
  process.env.SUPPORT_EMAIL ||
  "support@growlokal.ph";

const MIN_OFFSET = -0.01;
const MAX_OFFSET = 0.01;

const clampOffset = (value: number) =>
  Math.max(MIN_OFFSET, Math.min(MAX_OFFSET, value));

function jitterFromSeed(seed: string): GeoPoint {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const latOffset = clampOffset(((hash % 2000) - 1000) / 100000);
  const lngOffset = clampOffset((((hash >> 5) % 2000) - 1000) / 100000);

  return {
    lat: OLONGAPO_CENTER_POINT.lat + latOffset,
    lng: OLONGAPO_CENTER_POINT.lng + lngOffset,
  };
}

const normalizeKey = (value: string) => value.trim().toLowerCase();

export async function geocodeLocation(
  rawLabel: string,
  options: GeocodeOptions = {}
): Promise<GeoPoint> {
  const label = rawLabel?.trim();
  const normalizedKey = label ? normalizeKey(label) : "";
  const cacheKey = normalizedKey || (options.seed ? normalizeKey(options.seed) : "");

  if (cacheKey && geoCache.has(cacheKey)) {
    return geoCache.get(cacheKey)!;
  }

  const fallbackPoint =
    options.fallback ??
    jitterFromSeed(options.seed || normalizedKey || "growlokal-fallback");

  if (!label) {
    return fallbackPoint;
  }

  try {
    const params = new URLSearchParams({
      q: `${label}, Philippines`,
      format: "json",
      limit: "1",
    });

    const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
      headers: {
        "User-Agent": `GrowLokalMap/1.0 (${CONTACT_EMAIL})`,
        "Accept-Language": "en",
      },
      // Cache geocode responses for a day to stay friendly with the upstream API
      next: { revalidate: 60 * 60 * 24 },
    });

    if (response.ok) {
      const payload = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (Array.isArray(payload) && payload.length > 0) {
        const { lat, lon } = payload[0];
        const point = { lat: Number(lat), lng: Number(lon) };
        if (cacheKey) {
          geoCache.set(cacheKey, point);
        }
        return point;
      }
    } else {
      console.warn("Geocoding request failed", response.status, label);
    }
  } catch (error) {
    console.error("Geocoding error for", label, error);
  }

  if (cacheKey) {
    geoCache.set(cacheKey, fallbackPoint);
  }

  return fallbackPoint;
}
