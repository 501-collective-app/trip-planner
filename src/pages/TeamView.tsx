import { useState } from 'react'
import { Plus, Trash2, Mail } from 'lucide-react'
import { useStore, useActiveTrip } from '../store'
import { Modal } from '../components/Modal'

const PALETTE = ['#81e0ae', '#ffc800', '#2563eb', '#ea580c', '#dc2626', '#0891b2', '#7c3aed', '#c026d3']

export function TeamView() {
  const team = useActiveTrip().team
  const removeTeamMember = useStore((s) => s.removeTeamMember)
  const updateTeamMember = useStore((s) => s.updateTeamMember)
  const [inviting, setInviting] = useState(false)

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-stone-500">Everyone with access to this trip's calendar and budget.</p>
        <button
          onClick={() => setInviting(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-mint-dark px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
        >
          <Plus size={14} />
          Invite teammate
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="divide-y divide-stone-100">
          {team.length === 0 && <div className="px-5 py-4 text-sm text-stone-400">No teammates added yet.</div>}
          {team.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-4 md:px-5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-brand-dark"
                style={{ background: m.color }}
              >
                {m.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-stone-900">{m.name}</div>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  {m.role} <span className="hidden text-stone-300 sm:inline">&middot;</span>
                  <span className="hidden items-center gap-1 sm:flex">
                    <Mail size={11} /> {m.email}
                  </span>
                </div>
              </div>
              <button
                onClick={() => updateTeamMember(m.id, { status: m.status === 'confirmed' ? 'invited' : 'confirmed' })}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  m.status === 'confirmed' ? 'bg-brand-mint/20 text-brand-mint-dark' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {m.status === 'confirmed' ? 'Confirmed' : 'Invited'}
              </button>
              <button
                onClick={() => removeTeamMember(m.id)}
                className="shrink-0 rounded-lg p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {inviting && <InviteForm onClose={() => setInviting(false)} />}
    </div>
  )
}

function InviteForm({ onClose }: { onClose: () => void }) {
  const team = useActiveTrip().team
  const addTeamMember = useStore((s) => s.addTeamMember)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')

  function submit() {
    if (!name.trim() || !email.trim()) return
    addTeamMember({
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || 'Team member',
      color: PALETTE[team.length % PALETTE.length],
      status: 'invited',
    })
    onClose()
  }

  return (
    <Modal title="Invite a teammate" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Role</span>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Logistics" />
        </label>
        <p className="text-xs text-stone-400">
          They'll get full access to this trip the next time they sign in with this exact email. This doesn't email them
          automatically, let them know yourself for now.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button onClick={submit} className="rounded-lg bg-brand-mint-dark px-4 py-2 text-sm font-medium text-white hover:brightness-95">
            Add to team
          </button>
        </div>
      </div>
    </Modal>
  )
}
