import { useState } from 'react'
import { ChevronDown, Luggage } from 'lucide-react'
import { useActiveTrip } from '../store'
import { BrandMark } from './BrandMark'
import { TripSwitcherModal } from './TripSwitcherModal'
import { TripSummaryBar } from './TripSummaryBar'
import { BudgetPill } from './BudgetPill'
import type { Tab } from './Sidebar'

export function TopBar({ onHome }: { onHome: (t: Tab) => void }) {
  const trip = useActiveTrip()
  const [switching, setSwitching] = useState(false)

  return (
    <header
      className="border-b border-stone-200 bg-white pb-3 md:pb-[34px]"
      style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
    >
      <div className="flex items-center justify-between gap-3 px-4 md:hidden">
        <button onClick={() => onHome('overview')} className="flex items-center gap-3">
          <div className="scale-75 origin-left">
            <BrandMark size="sm" on="light" />
          </div>
        </button>

        <button
          onClick={() => setSwitching(true)}
          className="ml-auto flex min-w-0 items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:brightness-110"
        >
          <Luggage size={15} className="shrink-0 text-brand-mint" />
          <span className="max-w-[46vw] truncate">{trip.trip.name}</span>
          <ChevronDown size={14} className="shrink-0 text-white/50" />
        </button>
      </div>
      {/* Same max-w-5xl + px-3/md:px-6 as the Overview/Budget page containers,
          so the header lines up edge-to-edge with the cards below it. */}
      <div className="mx-auto mt-4 flex max-w-5xl flex-col items-stretch gap-5 px-3 md:mt-[50px] md:gap-[35px] md:px-6">
        <TripSummaryBar />
        <BudgetPill />
      </div>

      {switching && <TripSwitcherModal onClose={() => setSwitching(false)} />}
    </header>
  )
}
