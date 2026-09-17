import { useActiveTrip } from '../store'
import { money, scheduledActivityCost, totalSpent } from '../lib/derive'

export function BudgetBar() {
  const active = useActiveTrip()
  const { trip, expenses, events } = active

  const spent = totalSpent(expenses)
  const committed = scheduledActivityCost(events)
  const remaining = trip.totalBudget - spent - committed
  const pctSpent = trip.totalBudget > 0 ? Math.min(100, (spent / trip.totalBudget) * 100) : 0
  const pctCommitted = trip.totalBudget > 0 ? Math.min(100 - pctSpent, (committed / trip.totalBudget) * 100) : 0
  const over = remaining < 0

  return (
    <div className="border-b border-stone-200 bg-white px-4 py-3 md:px-6 md:py-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <Stat label="Total budget" value={money(trip.totalBudget)} />
        <Stat label="Paid so far" value={money(spent)} />
        <Stat label="Scheduled (unpaid)" value={money(committed)} />
        <Stat
          label={over ? 'Over budget' : 'Remaining'}
          value={money(Math.abs(remaining))}
          tone={over ? 'danger' : 'positive'}
        />
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className="flex h-full">
          <div className="h-full bg-brand-mint-dark" style={{ width: `${pctSpent}%` }} />
          <div className="h-full bg-brand-yellow" style={{ width: `${pctCommitted}%` }} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'positive' }) {
  const color = tone === 'danger' ? 'text-red-600' : tone === 'positive' ? 'text-brand-mint-dark' : 'text-stone-900'
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{label}</div>
      <div className={`text-base font-semibold md:text-lg ${color}`}>{value}</div>
    </div>
  )
}
