import { useMemo, type ReactNode } from 'react'
import { CalendarDays, Wallet, ListChecks, Users, Contact as ContactIcon, Plane, ArrowRight, AlertCircle } from 'lucide-react'
import { useActiveTrip } from '../store'
import { destinationForDate, money, scheduledActivityCost, totalSpent } from '../lib/derive'
import { todayIso } from '../lib/date'
import { fmtAmPmFromIso, sortedFlightEvents } from '../lib/flightHelpers'
import { WeatherChip } from '../components/WeatherChip'
import type { Tab } from '../components/Sidebar'

export function OverviewView({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const active = useActiveTrip()
  const { trip } = active
  const today = todayIso()

  const spent = totalSpent(active.expenses)
  const committed = scheduledActivityCost(active.events)
  const remaining = trip.totalBudget - spent - committed

  const todayEvents = active.events.filter((e) => e.date === today).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const todayDestination = destinationForDate(active.destinations, today)

  const flights = useMemo(() => sortedFlightEvents(active.events, active.flightsByEvent), [active.events, active.flightsByEvent])
  const nextFlight = useMemo(() => flights.find((f) => f.flight?.departureTime && new Date(f.flight.departureTime) > new Date()), [flights])

  const tripStatus = today < trip.startDate ? 'upcoming' : today > trip.endDate ? 'past' : 'active'
  const daysUntil = Math.ceil((new Date(trip.startDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)

  const invitedCount = active.team.filter((m) => m.status === 'invited').length
  const flightsMissingSeats = flights.filter(
    (f) => f.event.attendeeIds.length > 0 && f.event.attendeeIds.some((id) => !f.flight?.seats[id]),
  ).length
  const attentionItems: string[] = []
  if (invitedCount > 0) attentionItems.push(`${invitedCount} teammate${invitedCount === 1 ? '' : 's'} still invited, not confirmed`)
  if (flightsMissingSeats > 0) attentionItems.push(`${flightsMissingSeats} flight${flightsMissingSeats === 1 ? '' : 's'} missing a seat assignment`)
  if (remaining < 0) attentionItems.push(`Over budget by ${money(Math.abs(remaining))}`)

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">{trip.name}</h1>
        <p className="text-base text-stone-500">
          {trip.organization} &middot; {trip.startDate} to {trip.endDate}
        </p>
        {tripStatus === 'upcoming' && (
          <p className="mt-1 text-sm font-medium text-brand-mint-dark">Starts in {daysUntil} day{daysUntil === 1 ? '' : 's'}</p>
        )}
        {tripStatus === 'past' && <p className="mt-1 text-sm font-medium text-stone-400">This trip has ended.</p>}
      </div>

      {attentionItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <AlertCircle size={16} />
            Needs attention
          </div>
          <ul className="space-y-1 text-sm text-amber-700">
            {attentionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total budget" value={money(trip.totalBudget)} />
        <StatTile label="Paid so far" value={money(spent)} />
        <StatTile label="Scheduled" value={money(committed)} />
        <StatTile label={remaining < 0 ? 'Over budget' : 'Remaining'} value={money(Math.abs(remaining))} tone={remaining < 0 ? 'danger' : 'positive'} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">Today</h2>
            <button onClick={() => onNavigate('calendar')} className="flex items-center gap-1 text-sm font-medium text-brand-mint-dark hover:underline">
              Full calendar <ArrowRight size={13} />
            </button>
          </div>
          {tripStatus !== 'active' ? (
            <p className="text-sm text-stone-400">{tripStatus === 'upcoming' ? "You're not on this trip yet." : 'Trip is over.'}</p>
          ) : (
            <>
              {todayDestination && (
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700">{todayDestination.city}, {todayDestination.country}</span>
                  <WeatherChip destination={todayDestination} date={today} />
                </div>
              )}
              {todayEvents.length === 0 && <p className="text-sm text-stone-400">Nothing scheduled today.</p>}
              <div className="space-y-1.5">
                {todayEvents.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 rounded bg-stone-50 px-2.5 py-1.5 text-sm">
                    <span className="text-stone-400">{ev.time}</span>
                    <span className="truncate text-stone-700">{ev.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">Next flight</h2>
            <button onClick={() => onNavigate('flights')} className="flex items-center gap-1 text-sm font-medium text-brand-mint-dark hover:underline">
              All flights <ArrowRight size={13} />
            </button>
          </div>
          {nextFlight ? (
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-stone-900">
                <Plane size={18} className="text-brand-mint-dark" />
                {nextFlight.flight?.departureAirport} <ArrowRight size={16} className="text-stone-300" /> {nextFlight.flight?.arrivalAirport}
              </div>
              <div className="mt-1 text-sm text-stone-600">
                {nextFlight.flight?.airline} {nextFlight.flight?.flightNumber}
              </div>
              <div className="mt-1 text-sm font-semibold text-stone-700">
                {nextFlight.flight?.departureTime ? fmtAmPmFromIso(nextFlight.flight.departureTime) : nextFlight.event.time} &middot; {nextFlight.event.date}
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-400">No upcoming flights.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
        <QuickLink icon={<CalendarDays size={20} />} label="Calendar" onClick={() => onNavigate('calendar')} />
        <QuickLink icon={<Plane size={20} />} label="Flights" onClick={() => onNavigate('flights')} />
        <QuickLink icon={<Wallet size={20} />} label="Budget" onClick={() => onNavigate('budget')} />
        <QuickLink icon={<ListChecks size={20} />} label="Activities" onClick={() => onNavigate('activities')} />
        <QuickLink icon={<Users size={20} />} label="Team" onClick={() => onNavigate('team')} />
        <QuickLink icon={<ContactIcon size={20} />} label="Contacts" onClick={() => onNavigate('contacts')} />
      </div>
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'positive' }) {
  const color = tone === 'danger' ? 'text-red-600' : tone === 'positive' ? 'text-brand-mint-dark' : 'text-stone-900'
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold md:text-xl ${color}`}>{value}</div>
    </div>
  )
}

function QuickLink({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-stone-200 bg-white p-4 text-stone-600 hover:border-brand-mint-dark hover:text-brand-mint-dark"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
