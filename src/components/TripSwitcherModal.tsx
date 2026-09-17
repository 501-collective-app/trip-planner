import { useState } from 'react'
import { Archive, Check, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'

export function TripSwitcherModal({ onClose }: { onClose: () => void }) {
  const trips = useStore((s) => s.trips)
  const activeTripId = useStore((s) => s.activeTripId)
  const switchTrip = useStore((s) => s.switchTrip)
  const createTrip = useStore((s) => s.createTrip)
  const archiveTrip = useStore((s) => s.archiveTrip)
  const unarchiveTrip = useStore((s) => s.unarchiveTrip)
  const deleteTrip = useStore((s) => s.deleteTrip)

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const active = trips.filter((t) => !t.archived)
  const archived = trips.filter((t) => t.archived)

  function submitNew() {
    if (!newName.trim()) return
    createTrip(newName.trim())
    setNewName('')
    setCreating(false)
    onClose()
  }

  return (
    <Modal title="Your trips" onClose={onClose}>
      <div className="space-y-1">
        {active.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
              t.id === activeTripId ? 'bg-brand-mint/15' : 'hover:bg-stone-50'
            }`}
          >
            <button
              onClick={() => {
                switchTrip(t.id)
                onClose()
              }}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  t.id === activeTripId ? 'border-brand-mint-dark bg-brand-mint-dark text-white' : 'border-stone-300'
                }`}
              >
                {t.id === activeTripId && <Check size={12} />}
              </span>
              <span className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-stone-900">{t.trip.name}</div>
                <div className="truncate text-xs text-stone-500">
                  {t.trip.startDate} &rarr; {t.trip.endDate}
                </div>
              </span>
            </button>
            <button
              onClick={() => archiveTrip(t.id)}
              title="Archive trip"
              className="shrink-0 rounded-lg p-1.5 text-stone-300 hover:bg-stone-100 hover:text-stone-600"
            >
              <Archive size={15} />
            </button>
          </div>
        ))}

        {active.length === 0 && <p className="px-3 py-2 text-sm text-stone-400">No active trips.</p>}
      </div>

      {creating ? (
        <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
          <input
            className="input"
            placeholder="Trip name, e.g. Southeast Asia 2027"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitNew()}
            autoFocus
          />
          <button
            onClick={submitNew}
            className="shrink-0 rounded-lg bg-brand-mint-dark px-3 py-2 text-sm font-medium text-white hover:brightness-95"
          >
            Create
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-500 hover:border-brand-mint-dark hover:text-brand-mint-dark"
        >
          <Plus size={15} />
          New trip
        </button>
      )}

      <div className="mt-4 border-t border-stone-100 pt-3">
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700"
        >
          <Archive size={13} />
          Archived trips ({archived.length})
        </button>
        {showArchived && (
          <div className="mt-2 space-y-1">
            {archived.length === 0 && <p className="px-1 py-1 text-xs text-stone-400">No archived trips yet.</p>}
            {archived.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-stone-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-stone-600">{t.trip.name}</div>
                  <div className="truncate text-xs text-stone-400">
                    {t.trip.startDate} &rarr; {t.trip.endDate}
                  </div>
                </div>
                <button
                  onClick={() => unarchiveTrip(t.id)}
                  title="Restore trip"
                  className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-brand-mint-dark"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(t.id)}
                  title="Delete permanently"
                  className="shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete trip"
          message={`Permanently delete "${trips.find((t) => t.id === confirmDeleteId)?.trip.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            deleteTrip(confirmDeleteId)
            setConfirmDeleteId(null)
          }}
        />
      )}
    </Modal>
  )
}
