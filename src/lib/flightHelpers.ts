import type { CalendarEvent, FlightDetails } from '../types'

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

export function isReturnLeg(flight: FlightDetails | undefined, home: string | undefined): boolean {
  if (!flight?.arrivalAirport || !home) return false
  return flight.arrivalAirport === home
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
