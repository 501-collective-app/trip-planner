import { CalendarDays, Wallet, ListChecks, Users, Settings, Plane, Contact as ContactIcon } from 'lucide-react'
import { BrandMark } from './BrandMark'

export type Tab = 'calendar' | 'flights' | 'budget' | 'activities' | 'team' | 'contacts' | 'settings'

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
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col bg-brand-dark md:flex">
      <div className="flex justify-center overflow-hidden border-b border-white/10 py-6">
        <BrandMark badge />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === id ? 'bg-brand-mint/15 text-brand-mint' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 text-xs text-white/30">Synced across your team, live</div>
    </aside>
  )
}
