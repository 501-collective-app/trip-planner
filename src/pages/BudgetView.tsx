import { useMemo, useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useStore, useActiveTrip } from '../store'
import { destinationsForDateRange, money, spentByCategory, totalSpent } from '../lib/derive'
import { todayIso, tomorrowIso } from '../lib/date'
import { currencyForCountry } from '../data/currencies'
import { formatMoney, toUsd } from '../lib/currency'
import { selectOnFocus } from '../lib/formUtils'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../types'
import { Modal } from '../components/Modal'
import { ReceiptCapture } from '../components/ReceiptCapture'
import { ScanReceiptsButton } from '../components/ScanReceiptsFlow'

const COLORS = ['#81e0ae', '#072225', '#ffc800', '#2563eb', '#dc2626', '#0891b2', '#64748b']

export function BudgetView() {
  const active = useActiveTrip()
  const { trip, expenses } = active
  const removeExpense = useStore((s) => s.removeExpense)
  const [adding, setAdding] = useState(false)

  const spent = totalSpent(expenses)
  const remaining = trip.totalBudget - spent
  const byCategory = spentByCategory(expenses)
  const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-stone-400">Total budget</div>
          <div className="mt-1 text-xl font-semibold text-stone-900 md:text-2xl">{money(trip.totalBudget)}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-stone-400">Spent</div>
          <div className="mt-1 text-xl font-semibold text-stone-900 md:text-2xl">{money(spent)}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-stone-400">
            {remaining < 0 ? 'Over budget' : 'Remaining'}
          </div>
          <div className={`mt-1 text-xl font-semibold md:text-2xl ${remaining < 0 ? 'text-red-600' : 'text-brand-mint-dark'}`}>
            {money(Math.abs(remaining))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 lg:col-span-1">
          <h3 className="mb-2 text-sm font-semibold text-stone-900">Spend by category</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-stone-400">No expenses logged yet.</p>
          ) : (
            <div style={{ width: '100%', height: 208 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={1}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={2}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => money(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 space-y-1.5">
            {chartData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-stone-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {c.name}
                </span>
                <span className="font-medium text-stone-800">{money(c.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-stone-900">Expense log</h3>
            <div className="flex gap-2">
              <ScanReceiptsButton tripId={active.id} tripName={trip.name} dropboxFolder={trip.dropboxFolder} />
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 rounded-lg bg-brand-mint-dark px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
              >
                <Plus size={14} />
                Log expense
              </button>
            </div>
          </div>
          <div className="max-h-[420px] divide-y divide-stone-100 overflow-y-auto">
            {sorted.length === 0 && <div className="px-5 py-4 text-sm text-stone-400">No expenses yet.</div>}
            {sorted.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-20 shrink-0 text-xs text-stone-400">{e.date}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-stone-900">{e.description}</div>
                  <div className="text-xs text-stone-500">
                    {e.category}
                    {e.paidBy ? ` · paid by ${e.paidBy}` : ''}
                    {e.currency !== 'USD' ? ` · ${formatMoney(e.originalAmount, e.currency)}` : ''}
                  </div>
                </div>
                {e.receiptUrl && (
                  <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="shrink-0 text-stone-300 hover:text-brand-mint-dark">
                    <ExternalLink size={14} />
                  </a>
                )}
                <div className="shrink-0 text-sm font-semibold text-stone-900">{money(e.amount)}</div>
                <button
                  onClick={() => removeExpense(e.id)}
                  className="shrink-0 rounded-lg p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {adding && <AddExpense onClose={() => setAdding(false)} />}
    </div>
  )
}

function AddExpense({ onClose }: { onClose: () => void }) {
  const active = useActiveTrip()
  const { destinations, team, trip } = active
  const addExpense = useStore((s) => s.addExpense)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Other')
  const [date, setDate] = useState(todayIso())
  const [destinationId, setDestinationId] = useState(destinations[0]?.id ?? '')
  const [paidBy, setPaidBy] = useState(team[0]?.name ?? '')
  const [currency, setCurrency] = useState('USD')
  const [submitting, setSubmitting] = useState(false)
  const [receiptPath, setReceiptPath] = useState<string | undefined>()
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>()

  const currencyOptions = useMemo(() => {
    const options = new Map<string, string>([['USD', '$']])
    const today = todayIso()
    const tomorrow = tomorrowIso()
    for (const d of destinationsForDateRange(destinations, today, tomorrow)) {
      const c = currencyForCountry(d.country)
      if (c) options.set(c.code, c.symbol)
    }
    const selectedDest = destinations.find((d) => d.id === destinationId)
    if (selectedDest) {
      const c = currencyForCountry(selectedDest.country)
      if (c) options.set(c.code, c.symbol)
    }
    return Array.from(options.entries())
  }, [destinations, destinationId])

  async function submit() {
    if (!description.trim() || !amount) return
    setSubmitting(true)
    const entered = Number(amount)
    const { usd, rate } = await toUsd(entered, currency)
    addExpense({
      description: description.trim(),
      amount: usd,
      currency,
      originalAmount: entered,
      fxRateToUsd: rate,
      category,
      date,
      destinationId,
      paidBy,
      receiptPath,
      receiptUrl,
    })
    setSubmitting(false)
    onClose()
  }

  return (
    <Modal title="Log an expense" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Description</span>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
        </label>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Amount</span>
            <input className="input" type="number" min={0} value={amount} onFocus={selectOnFocus} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Currency</span>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencyOptions.map(([code, symbol]) => (
                <option key={code} value={code}>
                  {code} ({symbol})
                </option>
              ))}
            </select>
          </label>
        </div>
        {currency !== 'USD' && <p className="-mt-2 text-xs text-stone-400">Converted to USD at today's rate when you save.</p>}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Date</span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Category</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Destination</span>
            <select className="input" value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.city}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Paid by</span>
          <select className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {team.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <ReceiptCapture
          tripId={active.id}
          tripName={trip.name}
          dropboxFolder={trip.dropboxFolder}
          expenseDate={date}
          expenseDescription={description}
          receiptPath={receiptPath}
          receiptUrl={receiptUrl}
          onChange={(path, url) => {
            setReceiptPath(path)
            setReceiptUrl(url)
          }}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-lg bg-brand-mint-dark px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Log expense'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
