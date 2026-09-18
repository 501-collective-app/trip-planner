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

// Minutes offset from UTC for a given IANA zone at a given instant (handles DST correctly).
export function utcOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
  return (asUtc - date.getTime()) / 60_000
}

// Rough daytime check (6am-6pm local) for a zone, used for a day/night indicator.
export function isDaytimeInZone(date: Date, timeZone: string): boolean {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false }).format(date))
  return hour >= 6 && hour < 18
}
