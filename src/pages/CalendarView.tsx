import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useActiveTrip } from '../store'
import { destinationForDate, money } from '../lib/derive'
import { monthMatrix, todayIso } from '../lib/date'
import { WeatherChip } from '../components/WeatherChip'
import { DayDetailModal } from '../components/DayDetailModal'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView() {
  const active = useActiveTrip()
  const today = todayIso()

  const tripStart = new Date(active.trip.startDate + 'T00:00:00')
  const [viewYear, setViewYear] = useState(tripStart.getFullYear())
  const [viewMonth, setViewMonth] = useState(tripStart.getMonth())
  const [openDate, setOpenDate] = useState<string | null>(null)

  useEffect(() => {
    const start = new Date(active.trip.startDate + 'T00:00:00')
    setViewYear(start.getFullYear())
    setViewMonth(start.getMonth())
  }, [active.id])

  const weeks = useMemo(() => monthMatrix(viewYear, viewMonth), [viewYear, viewMonth])

  function goMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900 md:text-lg">{monthLabel}</h2>
          <div className="flex gap-1">
            <button
              onClick={() => goMonth(-1)}
              className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:bg-stone-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => goMonth(1)}
              className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:bg-stone-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
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
              week.map((date) => (
                <DayCell
                  key={date}
                  date={date}
                  inMonth={new Date(date + 'T00:00:00').getMonth() === viewMonth}
                  isToday={date === today}
                  onOpen={() => setOpenDate(date)}
                />
              )),
            )}
          </div>
        </div>
      </div>

      {openDate && <DayDetailModal date={openDate} onClose={() => setOpenDate(null)} />}
    </div>
  )
}

function DayCell({ date, inMonth, isToday, onOpen }: { date: string; inMonth: boolean; isToday: boolean; onOpen: () => void }) {
  const active = useActiveTrip()
  const destination = destinationForDate(active.destinations, date)
  const inTrip = date >= active.trip.startDate && date <= active.trip.endDate
  const dayEvents = active.events.filter((e) => e.date === date).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const dayNum = Number(date.slice(8, 10))

  return (
    <button
      onClick={onOpen}
      className={`flex min-h-[84px] flex-col items-stretch gap-1 p-1.5 text-left align-top sm:min-h-[110px] md:p-2 ${
        inTrip ? 'bg-brand-mint/5' : 'bg-white'
      } ${inMonth ? '' : 'opacity-40'} hover:bg-brand-mint/10`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium md:h-6 md:w-6 md:text-xs ${
            isToday ? 'bg-brand-dark text-white' : 'text-stone-700'
          }`}
        >
          {dayNum}
        </span>
        {destination && <WeatherChip destination={destination} date={date} compact />}
      </div>

      {destination && (
        <div className="truncate text-[10px] font-medium text-stone-500 md:text-[11px]">{destination.city}</div>
      )}

      <div className="flex-1 space-y-0.5 overflow-hidden">
        {dayEvents.slice(0, 2).map((ev) => (
          <div
            key={ev.id}
            className="truncate rounded bg-brand-dark/5 px-1 py-0.5 text-[10px] font-medium text-stone-700 md:text-[11px]"
          >
            {ev.time && <span className="text-stone-400">{ev.time.slice(0, 5)} </span>}
            {ev.title}
          </div>
        ))}
        {dayEvents.length > 2 && (
          <div className="truncate px-1 text-[10px] font-medium text-brand-mint-dark">+{dayEvents.length - 2} more</div>
        )}
      </div>

      {dayEvents.some((e) => !!e.cost) && (
        <div className="text-right text-[10px] font-semibold text-stone-500">
          {money(dayEvents.reduce((sum, e) => sum + (e.cost ?? 0), 0))}
        </div>
      )}
    </button>
  )
}
