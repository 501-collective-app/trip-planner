import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useActiveTrip } from '../store'
import { BrandMark } from './BrandMark'
import { TripSwitcherModal } from './TripSwitcherModal'

export function TopBar({ title }: { title: string }) {
  const trip = useActiveTrip()
  const [switching, setSwitching] = useState(false)

  return (
    <header
      className="border-b border-stone-200 bg-white px-4 py-3 md:px-6 md:py-4"
      style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:hidden">
          <div className="scale-75 origin-left">
            <BrandMark size="sm" />
          </div>
        </div>
        <h1 className="hidden text-xl font-semibold text-stone-900 md:block">{title}</h1>

        <button
          onClick={() => setSwitching(true)}
          className="flex min-w-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <span className="max-w-[46vw] truncate md:max-w-xs">{trip.trip.name}</span>
          <ChevronDown size={14} className="shrink-0 text-stone-400" />
        </button>
      </div>
      <h1 className="mt-1 text-lg font-semibold text-stone-900 md:hidden">{title}</h1>

      {switching && <TripSwitcherModal onClose={() => setSwitching(false)} />}
    </header>
  )
}
