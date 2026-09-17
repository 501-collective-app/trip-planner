import { useEffect, useState } from 'react'
import { useActiveTrip } from '../store'
import { destinationForDate } from '../lib/derive'
import { todayIso } from '../lib/date'
import { fetchTimezone } from '../lib/timezone'

const PORTLAND_TZ = 'America/Los_Angeles'

function formatTime(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(date)
  } catch {
    return null
  }
}

export function ClockRow() {
  const active = useActiveTrip()
  const [now, setNow] = useState(() => new Date())
  const [tripTz, setTripTz] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const dest = destinationForDate(active.destinations, todayIso()) ?? active.destinations[0]
    if (!dest) {
      setTripTz(null)
      return
    }
    let alive = true
    fetchTimezone(dest.lat, dest.lon).then((tz) => {
      if (alive) setTripTz(tz)
    })
    return () => {
      alive = false
    }
  }, [active.destinations])

  const dest = destinationForDate(active.destinations, todayIso()) ?? active.destinations[0]
  const tripTime = tripTz ? formatTime(now, tripTz) : null
  const portlandTime = formatTime(now, PORTLAND_TZ)

  if (!tripTime && !portlandTime) return null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
      {tripTime && (
        <span>
          <span className="font-medium text-stone-700">{dest?.city ?? 'Trip'}</span> {tripTime}
        </span>
      )}
      {portlandTime && (
        <span>
          <span className="font-medium text-stone-700">Portland, OR</span> {portlandTime}
        </span>
      )}
    </div>
  )
}
