import { useEffect, useMemo, useState } from 'react'
import { Plane, Plus, Trash2, RadioTower, RotateCw, Clock, Route } from 'lucide-react'
import { useStore, useActiveTrip } from '../store'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { fetchFlightStatus, type FlightStatus } from '../lib/flightStatus'
import {
  fmtAmPm,
  fmtAmPmFromIso,
  fmtAmPmInZone,
  fmtShortDateInZone,
  formatDurationMs,
  homeboundStartIso,
  isHomeboundLeg,
  sortedFlightEvents,
  zonedTimeToUtcIso,
  type FlightEventWithDetails,
} from '../lib/flightHelpers'
import { airportTimeZone, airportCoords, greatCircleMiles } from '../lib/airports'
import type { CalendarEvent } from '../types'

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2)
}

export function FlightsView() {
  const active = useActiveTrip()
  const flights = useMemo(() => sortedFlightEvents(active.events, active.flightsByEvent), [active.events, active.flightsByEvent])
  const homeboundStart = useMemo(() => homeboundStartIso(active.destinations), [active.destinations])
  const [adding, setAdding] = useState(false)
  const [openEventId, setOpenEventId] = useState<string | null>(null)

  const outbound = flights.filter((f) => !isHomeboundLeg(f.event, homeboundStart))
  const returning = flights.filter((f) => isHomeboundLeg(f.event, homeboundStart))

  return (
    <div className="px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex items-center justify-end">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-lg bg-brand-mint-dark px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
          >
            <Plus size={14} />
            Add flight
          </button>
        </div>

        {flights.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 px-5 py-10 text-center text-base text-stone-400">
            No flights added yet.
          </div>
        )}

        <FlightGroup label="Outbound" tone="green" flights={outbound} onOpen={setOpenEventId} />
        <FlightGroup label="Return" tone="yellow" flights={returning} onOpen={setOpenEventId} />
      </div>

      {adding && <AddFlightForm onClose={() => setAdding(false)} />}
      {openEventId && <FlightDetailModal eventId={openEventId} onClose={() => setOpenEventId(null)} />}
    </div>
  )
}

function FlightGroup({
  label,
  tone,
  flights,
  onOpen,
}: {
  label: string
  tone: 'green' | 'yellow'
  flights: FlightEventWithDetails[]
  onOpen: (eventId: string) => void
}) {
  if (flights.length === 0) return null

  const first = flights[0]
  const last = flights[flights.length - 1]
  const depIso = first.flight?.departureTime
  const arrIso = last.flight?.arrivalTime
  const totalTime = depIso && arrIso ? formatDurationMs(new Date(arrIso).getTime() - new Date(depIso).getTime()) : null

  const depCoords = airportCoords(first.flight?.departureAirport)
  const arrCoords = airportCoords(last.flight?.arrivalAirport)
  const totalMiles = depCoords && arrCoords ? Math.round(greatCircleMiles(depCoords, arrCoords)) : null

  const toneClasses =
    tone === 'green'
      ? { border: 'border-emerald-200', bg: 'bg-emerald-50/50', glow: 'shadow-[0_0_50px_-12px_rgba(16,185,129,0.45)]', text: 'text-emerald-700' }
      : { border: 'border-amber-200', bg: 'bg-amber-50/50', glow: 'shadow-[0_0_50px_-12px_rgba(217,161,10,0.45)]', text: 'text-amber-700' }

  return (
    <div className={`mb-8 rounded-2xl border ${toneClasses.border} ${toneClasses.bg} ${toneClasses.glow} p-4 md:p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <h3 className={`text-sm font-bold uppercase tracking-wide ${toneClasses.text}`}>{label}</h3>
        <div className={`flex items-center gap-4 text-sm font-semibold ${toneClasses.text}`}>
          {totalTime && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {totalTime} total
            </span>
          )}
          {totalMiles && (
            <span className="flex items-center gap-1.5">
              <Route size={14} />
              {totalMiles.toLocaleString()} mi as the crow flies
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {flights.map(({ event }) => (
          <FlightCard key={event.id} event={event} isReturn={tone === 'yellow'} onOpen={() => onOpen(event.id)} />
        ))}
      </div>
    </div>
  )
}

function FlightCard({ event, isReturn, onOpen }: { event: CalendarEvent; isReturn: boolean; onOpen: () => void }) {
  const active = useActiveTrip()
  const flight = active.flightsByEvent[event.id]
  const attendees = active.team.filter((m) => event.attendeeIds.includes(m.id))

  return (
    <button
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-5 text-left hover:border-brand-mint-dark hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-mint/15 text-brand-mint-dark">
          <Plane size={22} className={isReturn ? 'rotate-[225deg]' : 'rotate-45'} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-stone-900">
            {flight?.airline || event.title}
          </div>
          <div className="truncate text-base text-stone-500">{flight?.flightNumber ?? event.title}</div>
        </div>
      </div>

      {flight?.departureAirport && flight?.arrivalAirport && (
        <div className="text-2xl font-bold text-stone-800">
          {flight.departureAirport} <span className="text-stone-300">&rarr;</span> {flight.arrivalAirport}
        </div>
      )}

      <div className="space-y-1 text-base">
        <div className="text-stone-600">
          Take off:{' '}
          <span className="font-semibold">
            {flight?.departureTime ? fmtAmPmInZone(flight.departureTime, airportTimeZone(flight.departureAirport)) : fmtAmPm(event.time ?? '00:00')}
          </span>
          {flight?.departureAirport && <span className="text-stone-400"> {flight.departureAirport}</span>}
          {flight?.departureTime && (
            <span className="text-stone-400"> &middot; {fmtShortDateInZone(flight.departureTime, airportTimeZone(flight.departureAirport))}</span>
          )}
        </div>
        {flight?.arrivalTime && (
          <div className="font-semibold text-red-400">
            Land: {fmtAmPmInZone(flight.arrivalTime, airportTimeZone(flight.arrivalAirport))}
            {flight.arrivalAirport && <span> {flight.arrivalAirport}</span>}
            <span className="text-red-300"> &middot; {fmtShortDateInZone(flight.arrivalTime, airportTimeZone(flight.arrivalAirport))}</span>
          </div>
        )}
      </div>

      <LiveStatusCompact flightNumber={flight?.flightNumber} date={event.date} />

      {attendees.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
          {attendees.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-stone-50 py-1 pl-1 pr-2.5 text-sm">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ background: m.color }}
              >
                {initials(m.name)}
              </span>
              <span className="text-stone-700">{m.name}</span>
              {flight?.seats[m.id] && <span className="font-semibold text-stone-500">{flight.seats[m.id]}</span>}
            </div>
          ))}
        </div>
      )}
    </button>
  )
}

function LiveStatusCompact({ flightNumber, date }: { flightNumber?: string; date: string }) {
  const [status, setStatus] = useState<FlightStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!flightNumber) return
    setLoading(true)
    fetchFlightStatus(flightNumber, date).then(({ data, error }) => {
      setStatus(data)
      setError(error)
      setLoading(false)
    })
  }, [flightNumber, date])

  if (!flightNumber) return null
  if (loading) return <div className="text-sm text-stone-400">Checking live status&hellip;</div>

  if (error || !status) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm font-medium text-stone-400">
        <RadioTower size={13} />
        Status unavailable
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm font-medium text-stone-600">
      <RadioTower size={13} className="text-brand-mint-dark" />
      {status.status ?? 'Status unavailable'}
      {status.departure.gate && <span className="text-stone-400">&middot; Gate {status.departure.gate}</span>}
    </div>
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
    const depAirport = departureAirport.trim().toUpperCase() || undefined
    const arrAirport = arrivalAirport.trim().toUpperCase() || undefined
    const depZone = airportTimeZone(depAirport)
    const depIso = depZone ? zonedTimeToUtcIso(departureTime, depZone) : new Date(departureTime).toISOString()
    const date = departureTime.slice(0, 10)
    const time = departureTime.slice(11, 16)
    const label = title.trim() || `${airline || 'Flight'}${flightNumber ? ` ${flightNumber}` : ''}`.trim() || 'Flight'

    const arrZone = airportTimeZone(arrAirport)
    const arrIso = arrivalTime ? (arrZone ? zonedTimeToUtcIso(arrivalTime, arrZone) : new Date(arrivalTime).toISOString()) : undefined

    addFlight(
      { date, time, title: label, destinationId, attendeeIds, notes: undefined, cost: undefined },
      {
        airline: airline.trim() || undefined,
        flightNumber: flightNumber.trim() || undefined,
        departureAirport: depAirport,
        arrivalAirport: arrAirport,
        departureTime: depIso,
        arrivalTime: arrIso,
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
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-400">
        <RadioTower size={14} />
        Add a flight number to get live status.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-stone-200 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-stone-400">
          <RadioTower size={14} />
          Live status
        </span>
        <button onClick={load} disabled={loading} className="text-stone-400 hover:text-brand-mint-dark disabled:opacity-40">
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {loading && !status && <p className="text-sm text-stone-400">Checking&hellip;</p>}
      {error && <p className="text-sm text-red-500">{error === 'Not configured' ? 'Flight status API not set up yet.' : error}</p>}
      {status && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium text-stone-700">{status.status ?? 'Unknown'}</div>
            <div className="text-stone-400">Status</div>
          </div>
          <div>
            <div className="font-medium text-stone-700">
              {status.departure.gate ? `Gate ${status.departure.gate}` : 'Not assigned yet'}
              {status.departure.terminal ? ` (T${status.departure.terminal})` : ''}
            </div>
            <div className="text-stone-400">{status.departure.revisedTime ? fmtAmPmFromIso(status.departure.revisedTime) : 'Departure'}</div>
          </div>
        </div>
      )}
    </div>
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
        <div className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
          Take off:{' '}
          <span className="font-semibold">
            {flight?.departureTime ? fmtAmPmInZone(flight.departureTime, airportTimeZone(flight.departureAirport)) : `${event.date} ${event.time ?? ''}`}
          </span>
          {flight?.departureAirport && ` ${flight.departureAirport}`}
          {flight?.departureTime && (
            <span className="text-stone-400"> &middot; {fmtShortDateInZone(flight.departureTime, airportTimeZone(flight.departureAirport))}</span>
          )}
          {flight?.arrivalTime && (
            <div className="font-semibold text-red-400">
              Land: {fmtAmPmInZone(flight.arrivalTime, airportTimeZone(flight.arrivalAirport))}
              {flight.arrivalAirport && ` ${flight.arrivalAirport}`}
              <span className="text-red-300"> &middot; {fmtShortDateInZone(flight.arrivalTime, airportTimeZone(flight.arrivalAirport))}</span>
            </div>
          )}
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
                <span className="min-w-0 flex-1 truncate text-sm text-stone-700">{m.name}</span>
                <input
                  className="input !w-24 shrink-0 text-center"
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
