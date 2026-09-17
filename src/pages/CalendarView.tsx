import { useMemo, useState } from 'react'
import { useActiveTrip } from '../store'
import { destinationForDate, money } from '../lib/derive'
import { tripRangeWeeks, todayIso } from '../lib/date'
import { WeatherChip } from '../components/WeatherChip'
import { DayDetailModal } from '../components/DayDetailModal'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView() {
  const active = useActiveTrip()
  const today = todayIso()
  const [openDate, setOpenDate] = useState<string | null>(null)

  const weeks = useMemo(
    () => tripRangeWeeks(active.trip.startDate, active.trip.endDate),
    [active.trip.startDate, active.trip.endDate],
  )

  const rangeLabel = useMemo(() => {
    const start = new Date(active.trip.startDate + 'T00:00:00')
    const end = new Date(active.trip.endDate + 'T00:00:00')
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    const startFmt = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    const endFmt = end.toLocaleDateString('en-US', sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'long', day: 'numeric', year: 'numeric' })
    return `${startFmt} – ${endFmt}`
  }, [active.trip.startDate, active.trip.endDate])

  return (
    <div className="px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-stone-900 md:text-lg">{rangeLabel}</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-200">
          <div className="grid grid-cols-7 bg-white">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-stone-400 md:text-xs">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {weeks.map((week) =>
              week.map((date) => {
                const inTrip = date >= active.trip.startDate && date <= active.trip.endDate
                return inTrip ? (
                  <DayCell key={date} date={date} isToday={date === today} onOpen={() => setOpenDate(date)} />
                ) : (
                  <div key={date} className="bg-stone-50" />
                )
              }),
            )}
          </div>
        </div>
      </div>

      {openDate && <DayDetailModal date={openDate} onClose={() => setOpenDate(null)} />}
    </div>
  )
}

function DayCell({ date, isToday, onOpen }: { date: string; isToday: boolean; onOpen: () => void }) {
  const active = useActiveTrip()
  const destination = destinationForDate(active.destinations, date)
  const dayEvents = active.events.filter((e) => e.date === date).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const dayNum = Number(date.slice(8, 10))

  return (
    <button
      onClick={onOpen}
      className="flex min-h-[120px] flex-col items-stretch gap-1.5 bg-brand-mint/5 p-2 text-left align-top hover:bg-brand-mint/10 sm:min-h-[150px] md:p-3"
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium md:h-7 md:w-7 md:text-sm ${
            isToday ? 'bg-brand-dark text-white' : 'text-stone-700'
          }`}
        >
          {dayNum}
        </span>
        {destination && <WeatherChip destination={destination} date={date} compact />}
      </div>

      {destination && <div className="truncate text-xs font-medium text-stone-500">{destination.city}</div>}

      <div className="flex-1 space-y-1 overflow-hidden">
        {dayEvents.slice(0, 4).map((ev) => (
          <div key={ev.id} className="truncate rounded bg-brand-dark/5 px-1.5 py-1 text-xs font-medium text-stone-700">
            {ev.time && <span className="text-stone-400">{ev.time.slice(0, 5)} </span>}
            {ev.title}
          </div>
        ))}
        {dayEvents.length > 4 && (
          <div className="truncate px-1.5 text-xs font-medium text-brand-mint-dark">+{dayEvents.length - 4} more</div>
        )}
      </div>

      {dayEvents.some((e) => !!e.cost) && (
        <div className="text-right text-xs font-semibold text-stone-500">
          {money(dayEvents.reduce((sum, e) => sum + (e.cost ?? 0), 0))}
        </div>
      )}
    </button>
  )
}
