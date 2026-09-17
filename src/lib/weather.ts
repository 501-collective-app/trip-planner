// Open-Meteo forecast API — free, no API key required.
// Forecast horizon is ~16 days out; dates beyond that simply return no data,
// which callers should treat as "forecast not available yet".
// Units are locked to Fahrenheit / mph per user preference.

export interface DayWeather {
  date: string // ISO date
  tempMaxF: number
  tempMinF: number
  code: number
  precipProbability: number
  windMaxMph: number
}

interface ForecastResponse {
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weathercode: number[]
    precipitation_probability_max: number[]
    windspeed_10m_max: number[]
  }
}

const cache = new Map<string, Promise<DayWeather[]>>()

export function fetchForecast(lat: number, lon: number, startDate: string, endDate: string): Promise<DayWeather[]> {
  const key = `${lat},${lon},${startDate},${endDate}`
  const cached = cache.get(key)
  if (cached) return cached

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max',
    temperature_unit: 'fahrenheit',
    windspeed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    start_date: startDate,
    end_date: endDate,
  })

  const promise = fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    .then((res) => (res.ok ? (res.json() as Promise<ForecastResponse>) : Promise.resolve({} as ForecastResponse)))
    .then((data): DayWeather[] => {
      if (!data.daily) return []
      const { time, temperature_2m_max, temperature_2m_min, weathercode, precipitation_probability_max, windspeed_10m_max } =
        data.daily
      return time.map((date, i) => ({
        date,
        tempMaxF: temperature_2m_max[i],
        tempMinF: temperature_2m_min[i],
        code: weathercode[i],
        precipProbability: precipitation_probability_max?.[i] ?? 0,
        windMaxMph: windspeed_10m_max?.[i] ?? 0,
      }))
    })
    .catch(() => [])

  cache.set(key, promise)
  return promise
}

// WMO weather interpretation codes, simplified.
export function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky'
  if ([1, 2, 3].includes(code)) return 'Partly cloudy'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain'
  if ([71, 73, 75, 77].includes(code)) return 'Snow'
  if ([80, 81, 82].includes(code)) return 'Rain showers'
  if ([85, 86].includes(code)) return 'Snow showers'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Weather'
}

export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if ([1, 2, 3].includes(code)) return '⛅'
  if ([45, 48].includes(code)) return '🌫️'
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️'
  if ([61, 63, 65, 66, 67].includes(code)) return '🌧️'
  if ([71, 73, 75, 77].includes(code)) return '🌨️'
  if ([80, 81, 82].includes(code)) return '🌦️'
  if ([85, 86].includes(code)) return '🌨️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  return '🌤️'
}
