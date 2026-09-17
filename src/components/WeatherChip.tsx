import type { Destination } from '../types'
import { useWeather, weatherForDate } from '../lib/useWeather'
import { weatherEmoji, weatherLabel } from '../lib/weather'

export function WeatherChip({
  destination,
  date,
  compact = false,
}: {
  destination: Destination
  date: string
  compact?: boolean
}) {
  const { days, loading } = useWeather(destination.lat, destination.lon, destination.arrive, destination.depart)
  const day = weatherForDate(days, date)

  if (compact) {
    if (loading || !day) return null
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-stone-500">
        <span>{weatherEmoji(day.code)}</span>
        <span>{Math.round(day.tempMaxF)}&deg;</span>
      </span>
    )
  }

  if (loading) {
    return <span className="text-xs text-stone-400">Loading weather&hellip;</span>
  }
  if (!day) {
    return <span className="text-xs text-stone-400">Forecast not available yet (beyond 16-day window)</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
      <span>{weatherEmoji(day.code)}</span>
      <span>
        {Math.round(day.tempMaxF)}&deg;/{Math.round(day.tempMinF)}&deg;F &middot; {weatherLabel(day.code)}
        {day.precipProbability > 30 ? ` · ${Math.round(day.precipProbability)}% rain` : ''}
        {day.windMaxMph > 20 ? ` · ${Math.round(day.windMaxMph)} mph wind` : ''}
      </span>
    </span>
  )
}
