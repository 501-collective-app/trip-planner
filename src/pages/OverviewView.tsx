import { useMemo, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  Wallet,
  ListChecks,
  Users,
  Contact as ContactIcon,
  Plane,
  ArrowRight,
  AlertCircle,
  X,
  Clock,
  CalendarClock,
  Plus,
  Check,
  BedDouble,
} from 'lucide-react'
import { useStore, useActiveTrip } from '../store'
import { budgetStatus, destinationForDate, money, scheduledActivityCost, totalSpent } from '../lib/derive'
import { todayIso, formatDateRange, countdownParts, formatCountdown, isExpiringSoon } from '../lib/date'
import { fmtAmPmInZone, firstDepartureFloored, sortedFlightEvents } from '../lib/flightHelpers'
import { airportTimeZone } from '../lib/airports'
import { WeatherChip } from '../components/WeatherChip'
import type { Tab } from '../components/Sidebar'

const BUDGET_BAR_CLASSES = { green: 'bg-brand-mint-dark', yellow: 'bg-amber-400', red: 'bg-red-500' } as const

function useDismissedAttention(tripId: string): [Set<string>, (kind: string) => void] {
  const storageKey = `attention-dismissed-${tripId}`
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  })

  function dismiss(kind: string) {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(kind)
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]))
      } catch {
        // ignore, per-viewer convenience only
      }
      return next
    })
  }

  return [dismissed, dismiss]
}

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
  const countdown = useMemo(() => {
    if (tripStatus !== 'upcoming') return null
    const target = firstDepartureFloored(flights) ?? new Date(trip.startDate + 'T00:00:00')
    return formatCountdown(countdownParts(new Date(), target))
  }, [tripStatus, trip.startDate, flights])

  const invitedCount = active.team.filter((m) => m.status === 'invited').length
  const flightsMissingSeats = flights.filter(
    (f) => f.event.attendeeIds.length > 0 && f.event.attendeeIds.some((id) => !f.flight?.seats[id]),
  ).length
  const allAttentionItems: { kind: string; label: string }[] = []
  if (invitedCount > 0)
    allAttentionItems.push({ kind: 'invited', label: `${invitedCount} teammate${invitedCount === 1 ? '' : 's'} still invited, not confirmed` })
  if (flightsMissingSeats > 0)
    allAttentionItems.push({ kind: 'missing-seats', label: `${flightsMissingSeats} flight${flightsMissingSeats === 1 ? '' : 's'} missing a seat assignment` })
  if (remaining < 0) allAttentionItems.push({ kind: 'over-budget', label: `Over budget by ${money(Math.abs(remaining))}` })
  const expiringPassports = active.team.filter((m) => {
    const expiry = active.sensitiveByMember[m.id]?.passportExpiry
    return expiry && isExpiringSoon(expiry, trip.endDate)
  })
  if (expiringPassports.length > 0)
    allAttentionItems.push({
      kind: 'passport-expiring',
      label: `${expiringPassports.length} passport${expiringPassports.length === 1 ? '' : 's'} expiring within 6 months of trip end`,
    })

  const [dismissed, dismiss] = useDismissedAttention(active.id)
  const attentionItems = allAttentionItems.filter((i) => !dismissed.has(i.kind))

  const { usedPct, tone: budgetTone } = budgetStatus(spent, committed, trip.totalBudget)

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 md:px-6 md:py-6">
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-brand-dark px-6 py-8 shadow-lg md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-mint/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand-yellow/10" />
        <div className="relative">
          <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">{formatDateRange(trip.startDate, trip.endDate)}</h1>
          {tripStatus === 'upcoming' && countdown && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-brand-mint backdrop-blur-sm md:text-base">
              <Clock size={16} />
              Starts in {countdown}
            </div>
          )}
          {tripStatus === 'active' && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-mint/20 px-4 py-2 text-sm font-bold text-brand-mint md:text-base">
              <CalendarClock size={16} />
              Trip is live right now
            </div>
          )}
          {tripStatus === 'past' && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/60 md:text-base">
              This trip has ended
            </div>
          )}
        </div>
      </div>

      {attentionItems.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle size={14} />
            </span>
            Needs attention
          </div>
          <ul className="space-y-1 pl-8 text-sm text-amber-700">
            {attentionItems.map((item) => (
              <li key={item.kind} className="flex items-center justify-between gap-2">
                <span className="font-medium">{item.label}</span>
                <button
                  onClick={() => dismiss(item.kind)}
                  title="Dismiss permanently"
                  className="shrink-0 rounded p-0.5 text-amber-400 hover:bg-amber-100 hover:text-amber-700"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Budget */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-stone-900">Budget</h2>
          <button onClick={() => onNavigate('budget')} className="flex items-center gap-1 text-sm font-semibold text-brand-mint-dark hover:underline">
            Details <ArrowRight size={13} />
          </button>
        </div>
        <div className="mb-4 h-3 overflow-hidden rounded-full bg-stone-100">
          <div className={`h-full rounded-full transition-all ${BUDGET_BAR_CLASSES[budgetTone]}`} style={{ width: `${usedPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MiniStat label="Total budget" value={money(trip.totalBudget)} swatch="bg-stone-300" />
          <MiniStat label="Paid so far" value={money(spent)} swatch="bg-[#2f6b5e]" />
          <MiniStat label="Scheduled" value={money(committed)} swatch="bg-[#9adb8b]" />
          <MiniStat
            label={remaining < 0 ? 'Over budget' : 'Remaining'}
            value={money(Math.abs(remaining))}
            tone={remaining < 0 ? 'danger' : 'positive'}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2f6b5e]/18 text-[#2f6b5e]">
                <CalendarDays size={15} />
              </span>
              Today
            </h2>
            <button onClick={() => onNavigate('calendar')} className="flex items-center gap-1 text-sm font-semibold text-brand-mint-dark hover:underline">
              Full calendar <ArrowRight size={13} />
            </button>
          </div>
          {tripStatus !== 'active' ? (
            <p className="text-sm text-stone-400">{tripStatus === 'upcoming' ? "You're not on this trip yet." : 'Trip is over.'}</p>
          ) : (
            <>
              {todayDestination && (
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-stone-700">{todayDestination.city}, {todayDestination.country}</span>
                  <WeatherChip destination={todayDestination} date={today} />
                </div>
              )}
              {todayDestination?.lodgingName && (
                <div className="mb-2 flex items-center gap-1.5 text-sm text-stone-500">
                  <BedDouble size={14} className="shrink-0 text-brand-mint-dark" />
                  {todayDestination.lodgingName}
                  {todayDestination.lodgingCheckin && <span className="text-stone-400">&middot; check-in {todayDestination.lodgingCheckin}</span>}
                </div>
              )}
              {todayEvents.length === 0 && <p className="text-sm text-stone-400">Nothing scheduled today.</p>}
              <div className="space-y-1.5">
                {todayEvents.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm">
                    <span className="text-stone-400">{ev.time}</span>
                    <span className="truncate text-stone-700">{ev.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4f9a7e]/20 text-[#2f5c4c]">
                <Plane size={15} />
              </span>
              Next flight
            </h2>
            <button onClick={() => onNavigate('flights')} className="flex items-center gap-1 text-sm font-semibold text-brand-mint-dark hover:underline">
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
                {nextFlight.flight?.departureTime
                  ? fmtAmPmInZone(nextFlight.flight.departureTime, airportTimeZone(nextFlight.flight.departureAirport))
                  : nextFlight.event.time}{' '}
                &middot; {nextFlight.event.date}
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-400">No upcoming flights.</p>
          )}
        </div>
      </div>

      <ChecklistCard />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <QuickLink icon={<CalendarDays size={20} />} label="Calendar" hue="grad-1" onClick={() => onNavigate('calendar')} />
        <QuickLink icon={<Plane size={20} />} label="Flights" hue="grad-2" onClick={() => onNavigate('flights')} />
        <QuickLink icon={<Wallet size={20} />} label="Budget" hue="grad-3" onClick={() => onNavigate('budget')} />
        <QuickLink icon={<ListChecks size={20} />} label="Activities" hue="grad-4" onClick={() => onNavigate('activities')} />
        <QuickLink icon={<Users size={20} />} label="Team" hue="grad-5" onClick={() => onNavigate('team')} />
        <QuickLink icon={<ContactIcon size={20} />} label="Contacts" hue="grad-6" onClick={() => onNavigate('contacts')} />
      </div>
    </div>
  )
}

function ChecklistCard() {
  const active = useActiveTrip()
  const addChecklistItem = useStore((s) => s.addChecklistItem)
  const toggleChecklistItem = useStore((s) => s.toggleChecklistItem)
  const removeChecklistItem = useStore((s) => s.removeChecklistItem)
  const [text, setText] = useState('')

  const remaining = active.checklist.filter((c) => !c.done).length

  function submit() {
    if (!text.trim()) return
    addChecklistItem(text)
    setText('')
  }

  return (
    <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#cdd246]/30 text-[#71741f]">
            <Check size={15} />
          </span>
          Prep checklist
        </h2>
        {active.checklist.length > 0 && (
          <span className="text-sm font-semibold text-stone-400">{remaining} left</span>
        )}
      </div>

      <div className="mb-3 flex gap-2">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Add a to-do — visas, insurance, packing…"
        />
        <button
          onClick={submit}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-mint-dark px-3 py-2 text-sm font-medium text-white hover:brightness-95"
        >
          <Plus size={15} />
        </button>
      </div>

      {active.checklist.length === 0 ? (
        <p className="text-sm text-stone-400">Nothing on the list yet.</p>
      ) : (
        <div className="space-y-1">
          {active.checklist.map((item) => (
            <div key={item.id} className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-stone-50">
              <button
                onClick={() => toggleChecklistItem(item.id, !item.done)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  item.done ? 'border-brand-mint-dark bg-brand-mint-dark text-white' : 'border-stone-300 text-transparent'
                }`}
              >
                <Check size={12} strokeWidth={3} />
              </button>
              <span className={`flex-1 text-sm ${item.done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{item.text}</span>
              <button
                onClick={() => removeChecklistItem(item.id)}
                className="shrink-0 rounded p-1 text-stone-300 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, tone, swatch }: { label: string; value: string; tone?: 'danger' | 'positive'; swatch?: string }) {
  const color = tone === 'danger' ? 'text-red-600' : tone === 'positive' ? 'text-brand-mint-dark' : 'text-stone-900'
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">
        {swatch && <span className={`h-2 w-2 rounded-full ${swatch}`} />}
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold md:text-xl ${color}`}>{value}</div>
    </div>
  )
}

// A real 6-stop gradient from brand teal through brand mint to brand yellow, so
// the row reads as one deliberate flow left-to-right instead of arbitrary tints.
type Hue = 'grad-1' | 'grad-2' | 'grad-3' | 'grad-4' | 'grad-5' | 'grad-6'

const HUE_CLASSES: Record<Hue, string> = {
  'grad-1': 'bg-[#2f6b5e]/18 text-[#2f6b5e] hover:border-[#2f6b5e]',
  'grad-2': 'bg-[#4f9a7e]/20 text-[#2f5c4c] hover:border-[#4f9a7e]',
  'grad-3': 'bg-[#70c99e]/22 text-[#3e6f57] hover:border-[#70c99e]',
  'grad-4': 'bg-[#9adb8b]/28 text-[#4d6e46] hover:border-[#9adb8b]',
  'grad-5': 'bg-[#cdd246]/30 text-[#71741f] hover:border-[#cdd246]',
  'grad-6': 'bg-brand-yellow/30 text-brand-gold hover:border-brand-gold',
}

function QuickLink({ icon, label, hue, onClick }: { icon: ReactNode; label: string; hue: Hue; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-2xl border border-stone-200 p-4 text-stone-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${HUE_CLASSES[hue]}`}
    >
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  )
}
