// =======================================================================
// lib/openweather.ts — OpenWeatherMap API client (PLANv2 Phase 1)
// Returns WeatherData with a safety multiplier (0.80–1.00) applied on
// top of the base WSI score. Bad weather = lower perceived safety.
// Free tier: 60 calls/min, 1 M calls/month — sufficient for our usage
// (calls are Upstash-cached for 15 minutes per lat/lng pair).
// =======================================================================

export interface WeatherData {
  /** Human-readable condition e.g. "Rain", "Thunderstorm", "Clear" */
  condition: string;
  /** OpenWeatherMap icon code e.g. "10d" for daytime rain */
  icon: string;
  /** Visibility in metres (max 10 000) */
  visibilityMetres: number;
  /**
   * Safety score multiplier in [0.80, 1.00].
   * Applied multiplicatively on the raw WSI score:
   *   finalScore = rawScore * weatherMultiplier
   * 1.00 = no weather penalty
   * 0.90 = mild penalty (light rain, mist)
   * 0.80 = severe penalty (thunderstorm, dense fog)
   */
  multiplier: number;
}

// Internal type for the OWM /weather response shape we care about.
interface OWMResponse {
  weather: { main: string; description: string; icon: string }[];
  visibility: number; // metres, 0–10 000
  main: { temp: number };
}

/**
 * Map an OpenWeatherMap "main" condition string to a safety multiplier.
 * Reference: https://openweathermap.org/weather-conditions
 */
function conditionToMultiplier(main: string, visibility: number): number {
  const m = main.toLowerCase();

  // Thunderstorm — most dangerous (flooding, poor visibility)
  if (m === "thunderstorm") return 0.80;

  // Dense fog or very poor visibility (< 500 m)
  if (m === "fog" || m === "sand" || m === "dust" || m === "ash")
    return 0.82;

  // Any snow condition
  if (m === "snow" || m === "sleet") return 0.85;

  // Moderate-to-heavy rain or drizzle
  if (m === "rain") return visibility < 3000 ? 0.85 : 0.90;
  if (m === "drizzle") return 0.92;

  // Haze / mist — mild penalty
  if (m === "haze" || m === "mist" || m === "smoke") return 0.94;

  // Squall
  if (m === "squall") return 0.87;

  // Tornado — extreme
  if (m === "tornado") return 0.80;

  // Clouds / clear — no penalty
  return 1.00;
}

/**
 * Fetch current weather for a given coordinate.
 * Returns a safe fallback (no penalty) if the API key is absent or the
 * request fails — the app must never crash due to a weather API failure.
 *
 * @param lat Latitude
 * @param lng Longitude
 */
export async function fetchWeather(
  lat: number,
  lng: number
): Promise<WeatherData> {
  const FALLBACK: WeatherData = {
    condition: "Unknown",
    icon: "01d",
    visibilityMetres: 10_000,
    multiplier: 1.0,
  };

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    console.warn("[openweather] OPENWEATHER_API_KEY not set — using fallback");
    return FALLBACK;
  }

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(url, {
      // 5-second timeout — don't block the safety score response
      signal: AbortSignal.timeout(5_000),
      next: { revalidate: 900 }, // Next.js fetch cache: 15 min
    });

    if (!res.ok) {
      console.warn(`[openweather] HTTP ${res.status} for ${lat},${lng}`);
      return FALLBACK;
    }

    const data: OWMResponse = await res.json();
    const weatherMain = data.weather?.[0]?.main ?? "Clear";
    const icon = data.weather?.[0]?.icon ?? "01d";
    const visibility = data.visibility ?? 10_000;
    const multiplier = conditionToMultiplier(weatherMain, visibility);

    return {
      condition: weatherMain,
      icon,
      visibilityMetres: visibility,
      multiplier,
    };
  } catch (err) {
    console.warn("[openweather] fetch failed silently:", err);
    return FALLBACK;
  }
}

/**
 * Cache key helper for Upstash — buckets to 15-minute windows.
 */
export function weatherCacheKey(lat: number, lng: number): string {
  const bucket = Math.floor(Date.now() / 900_000); // 15-min buckets
  const latR = Math.round(lat * 10) / 10; // 0.1° ≈ 11 km grid
  const lngR = Math.round(lng * 10) / 10;
  return `weather:${latR}:${lngR}:${bucket}`;
}
