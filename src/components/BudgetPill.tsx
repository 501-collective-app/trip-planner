import { Wallet } from 'lucide-react'
import { useActiveTrip } from '../store'
import { budgetStatus, money, scheduledActivityCost, totalSpent } from '../lib/derive'

const BAR_TONE_CLASSES = { green: 'bg-brand-mint-dark', yellow: 'bg-amber-400', red: 'bg-red-500' } as const
const TEXT_TONE_CLASSES = { green: 'text-brand-mint-dark', yellow: 'text-amber-600', red: 'text-red-600' } as const

// Compact, always-visible budget summary for the header — replaces the old
// full-width BudgetBar that only showed on Calendar/Budget (everywhere else
// you had no idea where the budget stood).
export function BudgetPill() {
  const active = useActiveTrip()
  const { trip, expenses, events } = active

  const spent = totalSpent(expenses)
  const committed = scheduledActivityCost(events)
  const remaining = trip.totalBudget - spent - committed
  const over = remaining < 0
  const { usedPct, tone } = budgetStatus(spent, committed, trip.totalBudget)

  return (
    <div className="flex w-full items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
      <Wallet size={15} className="shrink-0 text-brand-mint-dark" />
      <span className="shrink-0 text-sm font-bold text-stone-900">
        {money(spent)} <span className="font-medium text-stone-400">of</span> {money(trip.totalBudget)}
      </span>
      <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full transition-all ${BAR_TONE_CLASSES[tone]}`} style={{ width: `${usedPct}%` }} />
      </div>
      <span className={`shrink-0 text-sm font-bold ${TEXT_TONE_CLASSES[tone]}`}>
        {over ? 'Over by ' : ''}
        {money(Math.abs(remaining))}
        {!over ? ' left' : ''}
      </span>
    </div>
  )
}
