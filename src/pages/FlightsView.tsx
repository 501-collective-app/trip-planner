import { useEffect, useState } from 'react'
import { Plane, Plus, Trash2, RadioTower, RotateCw } from 'lucide-react'
import { useStore, useActiveTrip } from '../store'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { fetchFlightStatus, type FlightStatus } from '../lib/flightStatus'
import type { CalendarEvent } from '../types'

function fmtUtc(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function LiveStatus({ flightNumber, date }: { flightNumber?: string; date: string }) {
  const [status, setStatus] = useState<FlightStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    if (!flightNumber) return
    setLoading(true)
    setError(null)
    const { data, error } = await fetchFlightStatus(flightNumber, date)
    setStatus(data)
    setError(error)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightNumber, date])

  if (!flightNumber) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs text-stone-400">
        <RadioTower size={13} />
        Add a flight number to get live status.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-stone-200 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
          <RadioTower size={13} />
          Live status
        </span>
        <button onClick={load} disabled={loading} className="text-stone-400 hover:text-brand-mint-dark disabled:opacity-40">
          <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {loading && !status && <p className="text-xs text-stone-400">Checking&hellip;</p>}
      {error && <p className="text-xs text-red-500">{error === 'Not configured' ? 'Flight status API not set up yet.' : error}</p>}
      {status && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-medium text-stone-700">{status.status ?? 'Unknown'}</div>
            <div className="text-stone-400">Status</div>
          </div>
          <div>
            <div className="font-medium text-stone-700">
              {status.departure.gate ? `Gate ${status.departure.gate}` : '—'}
              {status.departure.terminal ? ` (T${status.departure.terminal})` : ''}
            </div>
            <div className="text-stone-400">{fmtUtc(status.departure.revisedTime ?? status.departure.scheduledTime) ?? 'Departure'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtDateTime(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2)
}

export function FlightsView() {
  const active = useActiveTrip()
  const flightEvents = active.events.filter((e) => e.category === 'Flights').sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
  const [adding, setAdding] = useState(false)
  const [openEventId, setOpenEventId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-stone-500">Every flight on this trip, with seat assignments.</p>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-mint-dark px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
        >
          <Plus size={14} />
          Add flight
        </button>
      </div>

      <div className="space-y-3">
        {flightEvents.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 px-5 py-8 text-center text-sm text-stone-400">
            No flights added yet.
          </div>
        )}
        {flightEvents.map((ev) => (
          <FlightCard key={ev.id} event={ev} onOpen={() => setOpenEventId(ev.id)} />
        ))}
      </div>

      {adding && <AddFlightForm onClose={() => setAdding(false)} />}
      {openEventId && <FlightDetailModal eventId={openEventId} onClose={() => setOpenEventId(null)} />}
    </div>
  )
}

function FlightCard({ event, onOpen }: { event: CalendarEvent; onOpen: () => void }) {
  const active = useActiveTrip()
  const flight = active.flightsByEvent[event.id]
  const attendees = active.team.filter((m) => event.attendeeIds.includes(m.id))

  return (
    <button onClick={onOpen} className="flex w-full flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 text-left hover:border-brand-mint-dark">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-mint/15 text-brand-mint-dark">
            <Plane size={16} className="rotate-45" />
          </div>
          <div>
            <div className="text-sm font-semibold text-stone-900">
              {flight?.airline || event.title}
              {flight?.flightNumber ? ` ${flight.flightNumber}` : ''}
            </div>
            <div className="text-xs text-stone-500">
              {flight?.departureAirport && flight?.arrivalAirport
                ? `${flight.departureAirport} → ${flight.arrivalAirport}`
                : event.title}
            </div>
          </div>
        </div>
        {!!event.cost && <div className="text-sm font-semibold text-stone-600">${event.cost.toLocaleString()}</div>}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-stone-500">{fmtDateTime(flight?.departureTime) ?? `${event.date} ${event.time ?? ''}`}</div>
        <div className="flex -space-x-1.5">
          {attendees.slice(0, 6).map((m) => (
            <div
              key={m.id}
              title={`${m.name}${flight?.seats[m.id] ? ` · ${flight.seats[m.id]}` : ''}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
              style={{ background: m.color }}
            >
              {initials(m.name)}
            </div>
          ))}
        </div>
      </div>
    </button>
  )
}

function AddFlightForm({ onClose }: { onClose: () => void }) {
  const active = useActiveTrip()
  const addFlight = useStore((s) => s.addFlight)
  const [title, setTitle] = useState('')
  const [airline, setAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [departureAirport, setDepartureAirport] = useState('')
  const [arrivalAirport, setArrivalAirport] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [destinationId, setDestinationId] = useState(active.destinations[0]?.id ?? '')
  const [attendeeIds, setAttendeeIds] = useState<string[]>(active.team.map((m) => m.id))

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function submit() {
    if (!departureTime) return
    const dep = new Date(departureTime)
    const date = dep.toISOString().slice(0, 10)
    const time = departureTime.slice(11, 16)
    const label = title.trim() || `${airline || 'Flight'}${flightNumber ? ` ${flightNumber}` : ''}`.trim() || 'Flight'

    addFlight(
      { date, time, title: label, destinationId, attendeeIds, notes: undefined, cost: undefined },
      {
        airline: airline.trim() || undefined,
        flightNumber: flightNumber.trim() || undefined,
        departureAirport: departureAirport.trim().toUpperCase() || undefined,
        arrivalAirport: arrivalAirport.trim().toUpperCase() || undefined,
        departureTime: dep.toISOString(),
        arrivalTime: arrivalTime ? new Date(arrivalTime).toISOString() : undefined,
      },
    )
    onClose()
  }

  return (
    <Modal title="Add flight" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Airline</span>
            <input className="input" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="e.g. Kenya Airways" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Flight number</span>
            <input className="input" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="e.g. KQ100" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">From (airport code)</span>
            <input className="input" value={departureAirport} onChange={(e) => setDepartureAirport(e.target.value)} placeholder="JFK" maxLength={4} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">To (airport code)</span>
            <input className="input" value={arrivalAirport} onChange={(e) => setArrivalAirport(e.target.value)} placeholder="NBO" maxLength={4} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Departs</span>
            <input className="input" type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Arrives (optional)</span>
            <input className="input" type="datetime-local" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Label (optional, defaults to airline + flight #)</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Flight to Nairobi" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Destination this connects to</span>
          <select className="input" value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
            {active.destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.city}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Who's on this flight</span>
          <div className="flex flex-wrap gap-2">
            {active.team.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleAttendee(m.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  attendeeIds.includes(m.id)
                    ? 'border-brand-mint-dark/40 bg-brand-mint/15 text-brand-mint-dark'
                    : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!departureTime}
            className="rounded-lg bg-brand-mint-dark px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-40"
          >
            Add flight
          </button>
        </div>
      </div>
    </Modal>
  )
}

function FlightDetailModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const active = useActiveTrip()
  const event = active.events.find((e) => e.id === eventId)
  const flight = active.flightsByEvent[eventId]
  const updateFlightDetails = useStore((s) => s.updateFlightDetails)
  const setFlightSeat = useStore((s) => s.setFlightSeat)
  const removeEvent = useStore((s) => s.removeEvent)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [airline, setAirline] = useState(flight?.airline ?? '')
  const [flightNumber, setFlightNumber] = useState(flight?.flightNumber ?? '')
  const [departureAirport, setDepartureAirport] = useState(flight?.departureAirport ?? '')
  const [arrivalAirport, setArrivalAirport] = useState(flight?.arrivalAirport ?? '')

  if (!event) return null
  const attendees = active.team.filter((m) => event.attendeeIds.includes(m.id))

  function saveField(patch: Partial<{ airline: string; flightNumber: string; departureAirport: string; arrivalAirport: string }>) {
    updateFlightDetails(eventId, patch)
  }

  return (
    <Modal title={flight?.airline ? `${flight.airline} ${flight.flightNumber ?? ''}`.trim() : event.title} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
          {fmtDateTime(flight?.departureTime) ?? `${event.date} ${event.time ?? ''}`}
          {flight?.arrivalTime && <> &rarr; {fmtDateTime(flight.arrivalTime)}</>}
        </div>

        <LiveStatus flightNumber={flight?.flightNumber} date={event.date} />
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Airline</span>
            <input
              className="input"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              onBlur={() => saveField({ airline })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Flight number</span>
            <input
              className="input"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              onBlur={() => saveField({ flightNumber })}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">From</span>
            <input
              className="input"
              value={departureAirport}
              onChange={(e) => setDepartureAirport(e.target.value.toUpperCase())}
              onBlur={() => saveField({ departureAirport })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">To</span>
            <input
              className="input"
              value={arrivalAirport}
              onChange={(e) => setArrivalAirport(e.target.value.toUpperCase())}
              onBlur={() => saveField({ arrivalAirport })}
            />
          </label>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Seat assignments</div>
          <div className="space-y-2">
            {attendees.length === 0 && <p className="text-sm text-stone-400">Nobody assigned to this flight yet.</p>}
            {attendees.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-brand-dark"
                  style={{ background: m.color }}
                >
                  {initials(m.name)}
                </div>
                <span className="flex-1 text-sm text-stone-700">{m.name}</span>
                <input
                  className="input w-24 text-center"
                  defaultValue={flight?.seats[m.id] ?? ''}
                  placeholder="Seat"
                  onBlur={(e) => setFlightSeat(eventId, m.id, e.target.value.toUpperCase())}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700">
            <Trash2 size={14} />
            Delete flight
          </button>
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Close
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete flight"
          message={`Remove "${event.title}" and its seat assignments? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeEvent(eventId)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}
