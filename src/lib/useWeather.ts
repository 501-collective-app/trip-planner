import { useEffect, useState } from 'react'
import { fetchForecast, type DayWeather } from './weather'

export function useWeather(lat: number, lon: number, startDate: string, endDate: string) {
  const [days, setDays] = useState<DayWeather[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchForecast(lat, lon, startDate, endDate).then((result) => {
      if (alive) {
        setDays(result)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [lat, lon, startDate, endDate])

  return { days: days ?? [], loading }
}

export function weatherForDate(days: DayWeather[], date: string) {
  return days.find((d) => d.date === date)
}
