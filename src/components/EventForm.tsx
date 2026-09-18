import { useState, type ReactNode } from 'react'
import { useStore, useActiveTrip } from '../store'
import { Modal } from './Modal'
import { selectOnFocus } from '../lib/formUtils'
import { EXPENSE_CATEGORIES, type CalendarEvent, type ExpenseCategory } from '../types'

export function EventForm({
  date,
  destinationId,
  existing,
  onClose,
}: {
  date: string
  destinationId: string
  existing?: CalendarEvent
  onClose: () => void
}) {
  const team = useActiveTrip().team
  const addEvent = useStore((s) => s.addEvent)
  const updateEvent = useStore((s) => s.updateEvent)
  const removeEvent = useStore((s) => s.removeEvent)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [time, setTime] = useState(existing?.time ?? '09:00')
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'Activities')
  const [cost, setCost] = useState(existing?.cost?.toString() ?? '')
  const [attendeeIds, setAttendeeIds] = useState<string[]>(existing?.attendeeIds ?? team.map((m) => m.id))
  const [notes, setNotes] = useState(existing?.notes ?? '')

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function submit() {
    if (!title.trim()) return
    const payload = {
      date,
      destinationId,
      title: title.trim(),
      time,
      category,
      cost: cost ? Number(cost) : undefined,
      attendeeIds,
      notes: notes.trim() || undefined,
    }
    if (existing) {
      updateEvent(existing.id, payload)
    } else {
      addEvent(payload)
    }
    onClose()
  }

  return (
    <Modal title={existing ? 'Edit event' : 'Add event'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Site visit with partner team"
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Time">
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Category">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Estimated cost (optional, adds to budget as scheduled/unpaid)">
          <input
            className="input"
            type="number"
            min={0}
            value={cost}
            onFocus={selectOnFocus}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="Who's going">
          <div className="flex flex-wrap gap-2">
            {team.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleAttendee(m.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  attendeeIds.includes(m.id)
                    ? 'border-brand-mint-dark/40 bg-brand-mint/15 text-brand-mint-dark'
                    : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Notes (optional)">
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="flex items-center justify-between pt-2">
          <div>
            {existing && (
              <button
                onClick={() => {
                  removeEvent(existing.id)
                  onClose()
                }}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Delete event
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
              Cancel
            </button>
            <button
              onClick={submit}
              className="rounded-lg bg-brand-mint-dark px-4 py-2 text-sm font-medium text-white hover:brightness-95"
            >
              {existing ? 'Save' : 'Add event'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  )
}
