// Open-Meteo geocoding API — free, no API key required.

export interface GeocodeResult {
  name: string
  country: string
  lat: number
  lon: number
}

export async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null
  const params = new URLSearchParams({ name: query.trim(), count: '1', language: 'en', format: 'json' })
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const hit = data.results?.[0]
    if (!hit) return null
    return { name: hit.name, country: hit.country ?? '', lat: hit.latitude, lon: hit.longitude }
  } catch {
    return null
  }
}
