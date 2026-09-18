import { useState } from 'react'
import { CalendarDays, Wallet, ListChecks, Users, Settings, Plane, Contact as ContactIcon, Luggage, ChevronDown } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { TripSwitcherModal } from './TripSwitcherModal'
import { useActiveTrip } from '../store'

export type Tab = 'overview' | 'calendar' | 'flights' | 'budget' | 'activities' | 'team' | 'contacts' | 'settings'

export const NAV: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'activities', label: 'Activities', icon: ListChecks },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'contacts', label: 'Contacts', icon: ContactIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const activeTrip = useActiveTrip()
  const [switching, setSwitching] = useState(false)

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col bg-brand-dark md:flex">
      <button
        onClick={() => onTab('overview')}
        className="relative z-10 flex flex-col items-center overflow-hidden bg-white pb-6 pt-8 hover:bg-stone-50"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-mint/20 blur-2xl" />
        <BrandMark on="light" size="md" />
        <span className="relative mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">Trip Planner</span>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-brand-mint via-brand-mint-dark to-brand-yellow" />
      </button>

      <div className="px-3 pt-4">
        <button
          onClick={() => setSwitching(true)}
          className="flex w-full min-w-0 items-center gap-2 rounded-full bg-brand-mint px-4 py-2.5 text-sm font-bold text-brand-dark shadow-sm transition-colors hover:brightness-95"
        >
          <Luggage size={15} className="shrink-0 text-brand-dark/70" />
          <span className="min-w-0 flex-1 truncate text-left">{activeTrip.trip.name}</span>
          <ChevronDown size={14} className="shrink-0 text-brand-dark/50" />
        </button>
      </div>

      <nav className="flex-1 space-y-2 p-3 pt-4">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
              tab === id
                ? 'border-brand-mint/30 bg-brand-mint/15 text-brand-mint'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 text-xs text-white/30">Synced across your team, live</div>

      {switching && <TripSwitcherModal onClose={() => setSwitching(false)} />}
    </aside>
  )
}
