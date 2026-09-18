import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useActiveTrip } from '../store'
import { destinationForDate, destinationsActiveOnDate } from '../lib/derive'
import { todayIso, countdownParts, formatCountdown } from '../lib/date'
import { currencyForCountry, fetchRates } from '../lib/currency'
import { firstDepartureFloored, sortedFlightEvents } from '../lib/flightHelpers'
import { fetchTimezone, isDaytimeInZone, utcOffsetMinutes } from '../lib/timezone'
import { weatherEmoji } from '../lib/weather'
import { useWeather, weatherForDate } from '../lib/useWeather'
import type { Destination } from '../types'

const PORTLAND_TZ = 'America/Los_Angeles'

function formatTime(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(date)
  } catch {
    return null
  }
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      {/* Non-breaking space keeps this line's height reserved even with no label, so every stat's value lines up. */}
      <div className="text-xs font-bold uppercase tracking-wide text-stone-500">{label || ' '}</div>
      <div className="mt-0.5 flex items-baseline gap-2 text-xl font-bold tabular-nums text-stone-900 md:text-2xl">{children}</div>
    </div>
  )
}

function Divider() {
  return <div className="hidden h-9 w-px shrink-0 self-center bg-stone-200 sm:block" />
}

function useClocks(now: Date) {
  const active = useActiveTrip()
  const [tripTz, setTripTz] = useState<string | null>(null)

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

  const clocks = [
    tripTz && { label: dest?.city ?? 'Trip', time: formatTime(now, tripTz), tz: tripTz },
    { label: 'Portland, OR', time: formatTime(now, PORTLAND_TZ), tz: PORTLAND_TZ },
  ].filter((c): c is { label: string; time: string | null; tz: string } => Boolean(c && c.time))

  clocks.sort((a, b) => utcOffsetMinutes(now, a.tz) - utcOffsetMinutes(now, b.tz))
  return clocks
}

function WeatherInline({ destination, date }: { destination: Destination; date: string }) {
  const { days, loading } = useWeather(destination.lat, destination.lon, destination.arrive, destination.depart)
  const day = weatherForDate(days, date)
  if (loading || !day) return null
  return (
    <span className="text-base font-semibold text-stone-500">
      {weatherEmoji(day.code)} {Math.round(day.tempMaxF)}&deg;
    </span>
  )
}

function CurrencyInline({ country }: { country: string }) {
  const code = currencyForCountry(country)
  const [rate, setRate] = useState<number | null>(null)

  useEffect(() => {
    if (!code || code === 'USD') return
    let alive = true
    fetchRates().then((rates) => {
      if (alive) setRate(rates[code] ?? null)
    })
    return () => {
      alive = false
    }
  }, [code])

  if (!code || code === 'USD' || !rate) return null
  return (
    <span className="text-base font-bold text-stone-500">
      $1 = {Math.round(rate).toLocaleString('en-US')} {code}
    </span>
  )
}

export function TripSummaryBar() {
  const active = useActiveTrip()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const clocks = useClocks(now)

  const today = todayIso()
  const { trip } = active
  const tripStatus = today < trip.startDate ? 'upcoming' : today > trip.endDate ? 'past' : 'active'

  const chipDestinations =
    tripStatus === 'active'
      ? destinationsActiveOnDate(active.destinations, today)
      : tripStatus === 'upcoming' && active.destinations.length > 0
        ? [[...active.destinations].sort((a, b) => a.arrive.localeCompare(b.arrive))[0]]
        : []

  const confirmedCount = active.team.filter((m) => m.status === 'confirmed').length

  const todayEvents = active.events
    .filter((e) => e.date === today)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  const flights = useMemo(() => sortedFlightEvents(active.events, active.flightsByEvent), [active.events, active.flightsByEvent])

  const departureCountdown =
    tripStatus === 'upcoming' ? formatCountdown(countdownParts(now, firstDepartureFloored(flights) ?? new Date(trip.startDate + 'T00:00:00'))) : null

  const finalArrival = useMemo(() => {
    for (let i = flights.length - 1; i >= 0; i--) {
      const iso = flights[i].flight?.arrivalTime
      if (iso) return new Date(iso)
    }
    return null
  }, [flights])
  const timeRemaining = tripStatus === 'active' && finalArrival && finalArrival > now ? formatCountdown(countdownParts(now, finalArrival)) : null

  const agenda = tripStatus === 'past' ? 'Trip has ended' : todayEvents[0] ? todayEvents[0].title : tripStatus === 'active' ? 'Nothing scheduled today' : null

  return (
    <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
      {clocks.map((c) => (
        <Stat key={c.tz} label={c.label}>
          {isDaytimeInZone(now, c.tz) ? (
            <span className="text-base">&#9728;&#65039;</span>
          ) : (
            <span className="text-base">&#127769;</span>
          )}
          {c.time}
        </Stat>
      ))}

      {clocks.length > 0 && (chipDestinations.length > 0 || departureCountdown || timeRemaining || agenda) && <Divider />}

      {chipDestinations.map((d) => (
        <Stat key={d.id} label="Location">
          <span>{d.city}</span>
          {tripStatus === 'active' && <WeatherInline destination={d} date={today} />}
          <CurrencyInline country={d.country} />
        </Stat>
      ))}

      {(chipDestinations.length > 0 || clocks.length > 0) && <Divider />}

      <Stat label="">Team: {confirmedCount}</Stat>

      {tripStatus === 'upcoming' && departureCountdown && (
        <>
          <Divider />
          <Stat label="Departure">
            <span className="text-brand-mint-dark">{departureCountdown}</span>
          </Stat>
        </>
      )}

      {tripStatus === 'active' && timeRemaining && (
        <>
          <Divider />
          <Stat label="Time Remaining">
            <span className="text-brand-mint-dark">{timeRemaining}</span>
          </Stat>
        </>
      )}

      {tripStatus !== 'upcoming' && agenda && (
        <>
          <Divider />
          <Stat label={tripStatus === 'past' ? 'Status' : 'Today'}>
            <span className="truncate text-lg font-semibold text-stone-600 md:text-xl">{agenda}</span>
          </Stat>
        </>
      )}
    </div>
  )
}
