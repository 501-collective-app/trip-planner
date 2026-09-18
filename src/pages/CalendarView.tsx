import { useMemo, useState } from 'react'
import { Plane, BedDouble } from 'lucide-react'
import { useActiveTrip } from '../store'
import { destinationForDate, money, tripDateRange } from '../lib/derive'
import { todayIso, formatDateRangeLong } from '../lib/date'
import { fmtAmPm, fmtAmPmInZone, homeboundStartIso, isFinalLanding, isHomeboundLeg, sortedFlightEvents } from '../lib/flightHelpers'
import { airportTimeZone } from '../lib/airports'
import { WeatherChip } from '../components/WeatherChip'
import { DayDetailModal } from '../components/DayDetailModal'

export function CalendarView() {
  const active = useActiveTrip()
  const today = todayIso()
  const [openDate, setOpenDate] = useState<string | null>(null)

  const dates = useMemo(() => tripDateRange(active), [active.trip.startDate, active.trip.endDate])

  const flights = useMemo(() => sortedFlightEvents(active.events, active.flightsByEvent), [active.events, active.flightsByEvent])
  const homeboundStart = useMemo(() => homeboundStartIso(active.destinations), [active.destinations])
  const finalLandingByEventId = useMemo(() => {
    const set = new Set<string>()
    flights.forEach((f, i) => {
      if (isFinalLanding(flights, i)) set.add(f.event.id)
    })
    return set
  }, [flights])

  const rangeLabel = useMemo(
    () => formatDateRangeLong(active.trip.startDate, active.trip.endDate),
    [active.trip.startDate, active.trip.endDate],
  )

  return (
    <div className="px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-stone-900 md:text-2xl">{rangeLabel}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {dates.map((date) => (
            <DayCell
              key={date}
              date={date}
              isToday={date === today}
              homeboundStart={homeboundStart}
              finalLandingByEventId={finalLandingByEventId}
              onOpen={() => setOpenDate(date)}
            />
          ))}
        </div>
      </div>

      {openDate && <DayDetailModal date={openDate} onClose={() => setOpenDate(null)} />}
    </div>
  )
}

function DayCell({
  date,
  isToday,
  homeboundStart,
  finalLandingByEventId,
  onOpen,
}: {
  date: string
  isToday: boolean
  homeboundStart: string | undefined
  finalLandingByEventId: Set<string>
  onOpen: () => void
}) {
  const active = useActiveTrip()
  const destination = destinationForDate(active.destinations, date)
  const dayEvents = active.events.filter((e) => e.date === date).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const dayFlights = dayEvents.filter((e) => e.category === 'Flights')
  const hasReturnFlight = dayFlights.some((e) => isHomeboundLeg(e, homeboundStart))
  const hasFlight = dayFlights.length > 0
  const dayNum = Number(date.slice(8, 10))
  const weekday = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })

  return (
    <button
      onClick={onOpen}
      className="flex min-h-[260px] flex-col items-stretch gap-2 rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm hover:border-brand-mint-dark hover:shadow-md sm:min-h-[300px]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-semibold ${
              isToday ? 'bg-brand-dark text-white' : 'bg-brand-mint/15 text-stone-800'
            }`}
          >
            {dayNum}
          </span>
          <span className="text-base font-medium uppercase tracking-wide text-stone-400">{weekday}</span>
          {hasFlight && (
            <Plane size={19} className={`shrink-0 text-brand-mint-dark ${hasReturnFlight ? 'rotate-[225deg]' : 'rotate-45'}`} />
          )}
        </div>
        {destination && <WeatherChip destination={destination} date={date} compact />}
      </div>

      {destination && (
        <div className="truncate text-center text-lg font-extrabold text-brand-dark [text-shadow:0_0_16px_rgba(129,224,174,0.6)]">
          {destination.city}
        </div>
      )}

      <div className="flex-1 space-y-1.5 overflow-hidden">
        {dayEvents.slice(0, 4).map((ev) => {
          const flight = ev.category === 'Flights' ? active.flightsByEvent[ev.id] : undefined
          const isFinal = finalLandingByEventId.has(ev.id)
          return (
            <div key={ev.id} className="rounded bg-stone-50 px-2 py-1.5 text-base font-medium text-stone-700">
              <div className="truncate">
                {ev.time && (
                  <span className="text-stone-400">
                    {fmtAmPm(ev.time)}
                    {flight?.departureAirport ? ` ${flight.departureAirport}` : ''}{' '}
                  </span>
                )}
                {ev.title}
              </div>
              {isFinal && flight?.arrivalTime && (
                <div className="truncate font-semibold text-red-400">
                  Land: {fmtAmPmInZone(flight.arrivalTime, airportTimeZone(flight.arrivalAirport))} {flight.arrivalAirport}
                </div>
              )}
            </div>
          )
        })}
        {dayEvents.length > 4 && (
          <div className="truncate px-2 text-base font-medium text-brand-mint-dark">+{dayEvents.length - 4} more</div>
        )}
      </div>

      {dayEvents.some((e) => !!e.cost) && (
        <div className="text-right text-base font-semibold text-stone-500">
          {money(dayEvents.reduce((sum, e) => sum + (e.cost ?? 0), 0))}
        </div>
      )}

      {destination?.lodgingName && (
        <div className="mt-1 flex items-center gap-1.5 self-start truncate rounded-full bg-brand-mint/10 px-2.5 py-1 text-sm font-semibold text-brand-mint-dark shadow-[0_0_14px_-3px_rgba(129,224,174,0.7)]">
          <BedDouble size={13} className="shrink-0" />
          {destination.lodgingName}
        </div>
      )}
    </button>
  )
}
