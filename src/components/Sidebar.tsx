import { CalendarDays, Wallet, ListChecks, Users, Settings } from 'lucide-react'
import { BrandMark } from './BrandMark'

export type Tab = 'calendar' | 'budget' | 'activities' | 'team' | 'settings'

export const NAV: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'activities', label: 'Activities', icon: ListChecks },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col bg-brand-dark md:flex">
      <div className="border-b border-white/10 px-5 py-6">
        <BrandMark />
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

      <div className="border-t border-white/10 p-4 text-xs text-white/30">
        Prototype &middot; data stored locally in this browser
      </div>
    </aside>
  )
}
