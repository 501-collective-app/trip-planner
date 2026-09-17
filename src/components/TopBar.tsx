import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useActiveTrip } from '../store'
import { BrandMark } from './BrandMark'
import { TripSwitcherModal } from './TripSwitcherModal'
import { ClockRow } from './ClockRow'
import type { Tab } from './Sidebar'

export function TopBar({ onHome }: { onHome: (t: Tab) => void }) {
  const trip = useActiveTrip()
  const [switching, setSwitching] = useState(false)

  return (
    <header
      className="border-b border-stone-200 bg-white px-4 py-3 md:px-6 md:py-4"
      style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
    >
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => onHome('overview')} className="flex items-center gap-3 md:hidden">
          <div className="scale-75 origin-left">
            <BrandMark size="sm" on="light" />
          </div>
        </button>

        <button
          onClick={() => setSwitching(true)}
          className="ml-auto flex min-w-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <span className="max-w-[46vw] truncate md:max-w-xs">{trip.trip.name}</span>
          <ChevronDown size={14} className="shrink-0 text-stone-400" />
        </button>
      </div>
      <div className="mt-2">
        <ClockRow />
      </div>

      {switching && <TripSwitcherModal onClose={() => setSwitching(false)} />}
    </header>
  )
}
