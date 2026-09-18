import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { useStore, useActiveTrip } from '../store'
import { money } from '../lib/derive'
import { selectOnFocus } from '../lib/formUtils'
import { Modal } from '../components/Modal'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../types'

export function ActivitiesView() {
  const active = useActiveTrip()
  const { destinations, options } = active
  const toggleOption = useStore((s) => s.toggleOption)
  const [addingFor, setAddingFor] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 md:px-6 md:py-6">
      <p className="mb-6 text-sm text-stone-500">
        Toggle one on to add it to the calendar and count it toward the budget.
      </p>

      <div className="space-y-6">
        {destinations.length === 0 && (
          <p className="text-sm text-stone-400">Add destinations in Settings first.</p>
        )}
        {destinations.map((dest) => {
          const cityOptions = options.filter((o) => o.destinationId === dest.id)
          return (
            <div key={dest.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-4 py-3 md:px-5 md:py-3.5">
                <div>
                  <div className="text-sm font-semibold text-stone-900">
                    {dest.city}, {dest.country}
                  </div>
                  <div className="text-xs text-stone-500">
                    {dest.arrive} &rarr; {dest.depart}
                  </div>
                </div>
                <button
                  onClick={() => setAddingFor(dest.id)}
                  className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  <Plus size={14} />
                  Add option
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {cityOptions.length === 0 && (
                  <div className="px-5 py-4 text-sm text-stone-400">No activity options added for this city yet.</div>
                )}
                {cityOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-4 px-4 py-3.5 md:px-5">
                    <button
                      onClick={() => toggleOption(opt.id)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        opt.addedToSchedule
                          ? 'border-brand-mint-dark bg-brand-mint-dark text-white'
                          : 'border-stone-300 text-transparent hover:border-brand-mint-dark'
                      }`}
                      title={opt.addedToSchedule ? 'Added to schedule' : 'Add to schedule'}
                    >
                      <Check size={14} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-stone-900">{opt.name}</div>
                      <div className="truncate text-xs text-stone-500">{opt.description}</div>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500 sm:inline">
                      {opt.category}
                    </span>
                    <div className="w-16 shrink-0 text-right text-sm font-semibold text-stone-900">
                      {opt.cost > 0 ? money(opt.cost) : 'Free'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {addingFor && <AddOption destinationId={addingFor} onClose={() => setAddingFor(null)} />}
    </div>
  )
}

function AddOption({ destinationId, onClose }: { destinationId: string; onClose: () => void }) {
  const addOption = useStore((s) => s.addOption)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Activities')

  function submit() {
    if (!name.trim()) return
    addOption({
      destinationId,
      name: name.trim(),
      description: description.trim(),
      cost: cost ? Number(cost) : 0,
      category,
      addedToSchedule: false,
    })
    onClose()
  }

  return (
    <Modal title="Add activity option" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Description</span>
          <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Cost (USD, total)</span>
            <input className="input" type="number" min={0} value={cost} onFocus={selectOnFocus} onChange={(e) => setCost(e.target.value)} />
          </label>
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
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button onClick={submit} className="rounded-lg bg-brand-mint-dark px-4 py-2 text-sm font-medium text-white hover:brightness-95">
            Add option
          </button>
        </div>
      </div>
    </Modal>
  )
}
