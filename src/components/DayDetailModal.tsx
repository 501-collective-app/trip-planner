import { useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { useActiveTrip } from '../store'
import { destinationForDate, money } from '../lib/derive'
import { WeatherChip } from './WeatherChip'
import { EventForm } from './EventForm'
import { Modal } from './Modal'
import type { CalendarEvent } from '../types'

function formatDayHeading(date: string) {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function DayDetailModal({ date, onClose }: { date: string; onClose: () => void }) {
  const active = useActiveTrip()
  const destination = destinationForDate(active.destinations, date)
  const dayEvents = active.events.filter((e) => e.date === date).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const [editing, setEditing] = useState<CalendarEvent | 'new' | null>(null)

  return (
    <Modal title={formatDayHeading(date)} onClose={onClose}>
      <div className="space-y-3">
        {destination ? (
          <div className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-sm text-stone-600">
              <MapPin size={13} />
              {destination.city}, {destination.country}
            </div>
            <WeatherChip destination={destination} date={date} />
          </div>
        ) : (
          <p className="text-sm text-stone-400">No destination set for this day.</p>
        )}

        <div className="divide-y divide-stone-100 rounded-lg border border-stone-100">
          {dayEvents.length === 0 && <div className="px-3 py-4 text-sm text-stone-400">No events scheduled yet.</div>}
          {dayEvents.map((ev) => (
            <EventRow key={ev.id} event={ev} onClick={() => setEditing(ev)} />
          ))}
        </div>

        <button
          onClick={() => setEditing('new')}
          disabled={!destination}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 py-2.5 text-sm font-medium text-stone-500 hover:border-brand-mint-dark hover:text-brand-mint-dark disabled:opacity-40"
        >
          <Plus size={15} />
          Add event
        </button>
      </div>

      {editing && destination && (
        <EventForm
          date={date}
          destinationId={destination.id}
          existing={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Modal>
  )
}

function EventRow({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const active = useActiveTrip()
  const attendees = active.team.filter((m) => event.attendeeIds.includes(m.id))

  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-stone-50">
      <div className="w-12 shrink-0 text-xs font-medium text-stone-400">{event.time}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-stone-900">{event.title}</div>
        {event.notes && <div className="truncate text-xs text-stone-500">{event.notes}</div>}
      </div>
      <span className="hidden shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500 sm:inline">
        {event.category}
      </span>
      {!!event.cost && <div className="w-14 shrink-0 text-right text-xs font-medium text-stone-600">{money(event.cost)}</div>}
      <div className="hidden -space-x-1.5 sm:flex">
        {attendees.slice(0, 4).map((m) => (
          <div
            key={m.id}
            title={m.name}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
            style={{ background: m.color }}
          >
            {m.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
          </div>
        ))}
      </div>
    </button>
  )
}
