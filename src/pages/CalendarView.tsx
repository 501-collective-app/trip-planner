import { useMemo, useState } from 'react'
import { Plane } from 'lucide-react'
import { useActiveTrip } from '../store'
import { destinationForDate, money, tripDateRange } from '../lib/derive'
import { todayIso } from '../lib/date'
import { WeatherChip } from '../components/WeatherChip'
import { DayDetailModal } from '../components/DayDetailModal'

export function CalendarView() {
  const active = useActiveTrip()
  const today = todayIso()
  const [openDate, setOpenDate] = useState<string | null>(null)

  const dates = useMemo(() => tripDateRange(active), [active.trip.startDate, active.trip.endDate])

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
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-stone-900 md:text-lg">{rangeLabel}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {dates.map((date) => (
            <DayCell key={date} date={date} isToday={date === today} onOpen={() => setOpenDate(date)} />
          ))}
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
  const hasFlight = dayEvents.some((e) => e.category === 'Flights')
  const dayNum = Number(date.slice(8, 10))
  const weekday = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })

  return (
    <button
      onClick={onOpen}
      className={`flex min-h-[180px] flex-col items-stretch gap-1.5 rounded-xl border bg-white p-4 text-left shadow-sm hover:border-brand-mint-dark hover:shadow-md sm:min-h-[220px] ${
        isToday ? 'border-brand-dark' : 'border-stone-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lg font-semibold ${isToday ? 'text-brand-dark' : 'text-stone-800'}`}>{dayNum}</span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{weekday}</span>
          {hasFlight && <Plane size={13} className="shrink-0 rotate-45 text-brand-mint-dark" />}
        </div>
        {destination && <WeatherChip destination={destination} date={date} compact />}
      </div>

      {destination && <div className="truncate text-xs font-medium text-stone-500">{destination.city}</div>}

      <div className="flex-1 space-y-1 overflow-hidden">
        {dayEvents.slice(0, 4).map((ev) => (
          <div key={ev.id} className="truncate rounded bg-stone-50 px-1.5 py-1 text-xs font-medium text-stone-700">
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
