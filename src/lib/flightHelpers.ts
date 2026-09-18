import type { CalendarEvent, Destination, FlightDetails } from '../types'
import { utcOffsetMinutes } from './timezone'
import { airportTimeZone } from './airports'

// "12:39" -> "12:39p"
export function fmtAmPm(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'p' : 'a'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')}${period}`
}

export function fmtAmPmFromIso(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  const period = h >= 12 ? 'p' : 'a'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')}${period}`
}

// Formats a UTC instant in a specific IANA zone (the airport's local time), never the browser's.
// Falls back to fmtAmPmFromIso (browser-local) if the zone is unknown.
export function fmtAmPmInZone(iso: string, timeZone: string | undefined): string {
  if (!timeZone) return fmtAmPmFromIso(iso)
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(
    new Date(iso),
  )
  const hour = parts.find((p) => p.type === 'hour')?.value ?? ''
  const minute = parts.find((p) => p.type === 'minute')?.value ?? ''
  const period = parts.find((p) => p.type === 'dayPeriod')?.value === 'PM' ? 'p' : 'a'
  return `${hour}:${minute}${period}`
}

// "9.19.26" in a specific IANA zone. Falls back to the browser-local date if the zone is unknown.
export function fmtShortDateInZone(iso: string, timeZone: string | undefined): string {
  const d = new Date(iso)
  if (!timeZone) {
    return `${d.getMonth() + 1}.${d.getDate()}.${String(d.getFullYear()).slice(-2)}`
  }
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d)
  const month = parts.find((p) => p.type === 'month')?.value ?? ''
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  const year = parts.find((p) => p.type === 'year')?.value ?? ''
  return `${month}.${day}.${year.slice(-2)}`
}

// Converts a <input type="datetime-local"> value ("2026-09-19T12:39"), meant as
// wall-clock time AT the given IANA zone, into the correct UTC ISO instant.
export function zonedTimeToUtcIso(localDateTime: string, timeZone: string): string {
  const [datePart, timePart] = localDateTime.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = (timePart ?? '00:00').split(':').map(Number)
  let guessUtcMs = Date.UTC(y, mo - 1, d, h, mi)
  // Two passes handles DST-transition edge cases; offset stabilizes after one.
  for (let i = 0; i < 2; i++) {
    const offsetMin = utcOffsetMinutes(new Date(guessUtcMs), timeZone)
    guessUtcMs = Date.UTC(y, mo - 1, d, h, mi) - offsetMin * 60_000
  }
  return new Date(guessUtcMs).toISOString()
}

export interface FlightEventWithDetails {
  event: CalendarEvent
  flight?: FlightDetails
}

export function sortedFlightEvents(events: CalendarEvent[], flightsByEvent: Record<string, FlightDetails>): FlightEventWithDetails[] {
  return events
    .filter((e) => e.category === 'Flights')
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
    .map((event) => ({ event, flight: flightsByEvent[event.id] }))
}

// The very first flight's departure airport, used as "home" for detecting return legs.
export function homeAirport(flights: FlightEventWithDetails[]): string | undefined {
  return flights[0]?.flight?.departureAirport
}

// The date the journey home begins: the latest "depart" date among the trip's
// destinations. Every flight departing on or after this date, however many
// connections it takes, is headed home (not just the final leg).
export function homeboundStartIso(destinations: Destination[]): string | undefined {
  if (destinations.length === 0) return undefined
  return destinations.reduce((latest, d) => (d.depart > latest ? d.depart : latest), destinations[0].depart)
}

export function isHomeboundLeg(event: CalendarEvent, homeboundStart: string | undefined): boolean {
  if (!homeboundStart) return false
  return event.date >= homeboundStart
}

// The first flight's departure instant, floored down to the hour in the
// departure airport's local time (12:45 -> 12:00), for a "starts in X" countdown
// that targets the moment you actually need to be at the gate, not midnight.
export function firstDepartureFloored(flights: FlightEventWithDetails[]): Date | null {
  const first = flights.find((f) => f.flight?.departureTime)
  const iso = first?.flight?.departureTime
  if (!iso) return null

  const zone = airportTimeZone(first!.flight!.departureAirport)
  if (!zone) {
    const d = new Date(iso)
    d.setMinutes(0, 0, 0)
    return d
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  const hour = get('hour') === '24' ? '00' : get('hour')
  const localDateTime = `${get('year')}-${get('month')}-${get('day')}T${hour}:00`
  return new Date(zonedTimeToUtcIso(localDateTime, zone))
}

// "1d 6h 25m" / "18h 25m" / "45m" — total elapsed wall-clock time, including layovers.
export function formatDurationMs(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (days > 0 || hours > 0) parts.push(`${hours}h`)
  parts.push(`${minutes}m`)
  return parts.join(' ')
}

// True if there's no next flight, or a >6h gap before the next one departs —
// i.e. this is the last leg of a connected run, not a same-day connection.
export function isFinalLanding(flights: FlightEventWithDetails[], index: number): boolean {
  const current = flights[index]
  if (!current?.flight?.arrivalTime) return false
  const next = flights[index + 1]
  if (!next?.flight?.departureTime) return true
  const gapMs = new Date(next.flight.departureTime).getTime() - new Date(current.flight.arrivalTime).getTime()
  return gapMs > 6 * 60 * 60 * 1000
}
