// Resolves an IANA timezone name for a lat/lon via Open-Meteo (free, no key,
// same provider already used for weather). Cached per coordinate pair.

const cache = new Map<string, Promise<string | null>>()

export function fetchTimezone(lat: number, lon: number): Promise<string | null> {
  const key = `${lat},${lon}`
  const cached = cache.get(key)
  if (cached) return cached

  const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), timezone: 'auto', forecast_days: '1' })
  const promise = fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (data?.timezone as string) ?? null)
    .catch(() => null)

  cache.set(key, promise)
  return promise
}
