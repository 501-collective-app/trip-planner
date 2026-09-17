import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, Trash2, Mail, Camera, ShieldCheck, Users as UsersIcon, Plane } from 'lucide-react'
import { useStore, useActiveTrip } from '../store'
import { Modal } from '../components/Modal'
import type { MemberType, TeamMember } from '../types'

const PALETTE = ['#81e0ae', '#ffc800', '#2563eb', '#ea580c', '#dc2626', '#0891b2', '#7c3aed', '#c026d3']

function useMyEmail() {
  return useStore((s) => s.session?.user.email?.toLowerCase())
}

export function TeamView() {
  const team = useActiveTrip().team
  const myEmail = useMyEmail()
  const isLeader = team.some((m) => m.memberType === 'trip_leader' && m.email.toLowerCase() === myEmail)
  const [inviting, setInviting] = useState(false)
  const [openMemberId, setOpenMemberId] = useState<string | null>(null)

  const leaders = team.filter((m) => m.memberType === 'trip_leader')
  const members = team.filter((m) => m.memberType === 'team_member')

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

      <RosterSection title="Trip Leaders" icon={<ShieldCheck size={14} />} members={leaders} isLeader={isLeader} myEmail={myEmail} onOpen={setOpenMemberId} />
      <RosterSection title="Team Members" icon={<UsersIcon size={14} />} members={members} isLeader={isLeader} myEmail={myEmail} onOpen={setOpenMemberId} />

      {inviting && <InviteForm onClose={() => setInviting(false)} />}
      {openMemberId && <MemberDetailModal memberId={openMemberId} isLeader={isLeader} onClose={() => setOpenMemberId(null)} />}
    </div>
  )
}

function RosterSection({
  title,
  icon,
  members,
  isLeader,
  myEmail,
  onOpen,
}: {
  title: string
  icon: ReactNode
  members: TeamMember[]
  isLeader: boolean
  myEmail: string | undefined
  onOpen: (id: string) => void
}) {
  const removeTeamMember = useStore((s) => s.removeTeamMember)
  const updateTeamMember = useStore((s) => s.updateTeamMember)

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
        {icon}
        {title} ({members.length})
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="divide-y divide-stone-100">
          {members.length === 0 && <div className="px-5 py-4 text-sm text-stone-400">Nobody here yet.</div>}
          {members.map((m) => {
            const canToggleStatus = isLeader || m.email.toLowerCase() === myEmail
            return (
              <div key={m.id} className="flex items-center gap-4 px-4 py-4 md:px-5">
                <button onClick={() => onOpen(m.id)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
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
                </button>
                {canToggleStatus ? (
                  <button
                    onClick={() => updateTeamMember(m.id, { status: m.status === 'confirmed' ? 'invited' : 'confirmed' })}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      m.status === 'confirmed' ? 'bg-brand-mint/20 text-brand-mint-dark' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {m.status === 'confirmed' ? 'Confirmed' : 'Invited'}
                  </button>
                ) : (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      m.status === 'confirmed' ? 'bg-brand-mint/20 text-brand-mint-dark' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {m.status === 'confirmed' ? 'Confirmed' : 'Invited'}
                  </span>
                )}
                {isLeader && (
                  <button
                    onClick={() => removeTeamMember(m.id)}
                    className="shrink-0 rounded-lg p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InviteForm({ onClose }: { onClose: () => void }) {
  const team = useActiveTrip().team
  const addTeamMember = useStore((s) => s.addTeamMember)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [memberType, setMemberType] = useState<MemberType>('team_member')

  function submit() {
    if (!name.trim() || !email.trim()) return
    addTeamMember({
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || 'Team member',
      color: PALETTE[team.length % PALETTE.length],
      status: 'invited',
      memberType,
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
        <div>
          <span className="mb-1 block text-xs font-medium text-stone-500">Type</span>
          <MemberTypeToggle value={memberType} onChange={setMemberType} />
        </div>
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

function MemberTypeToggle({ value, onChange, disabled }: { value: MemberType; onChange: (v: MemberType) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2">
      {(['trip_leader', 'team_member'] as MemberType[]).map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onChange(type)}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            value === type ? 'border-brand-mint-dark bg-brand-mint/15 text-brand-mint-dark' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
          }`}
        >
          {type === 'trip_leader' ? 'Trip Leader' : 'Team Member'}
        </button>
      ))}
    </div>
  )
}

function MemberFlightsSection({ memberId }: { memberId: string }) {
  const active = useActiveTrip()
  const setFlightSeat = useStore((s) => s.setFlightSeat)
  const flights = active.events
    .filter((e) => e.category === 'Flights' && e.attendeeIds.includes(memberId))
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))

  if (flights.length === 0) return null

  return (
    <div className="border-t border-stone-100 pt-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
        <Plane size={13} />
        Flights &amp; seats
      </div>
      <div className="space-y-2">
        {flights.map((ev) => {
          const flight = active.flightsByEvent[ev.id]
          const label = flight?.airline ? `${flight.airline} ${flight.flightNumber ?? ''}`.trim() : ev.title
          return (
            <div key={ev.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-stone-700">{label}</div>
                <div className="text-xs text-stone-400">{ev.date}</div>
              </div>
              <input
                className="input w-24 text-center"
                defaultValue={flight?.seats[memberId] ?? ''}
                placeholder="Seat"
                onBlur={(e) => setFlightSeat(ev.id, memberId, e.target.value.toUpperCase())}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MemberDetailModal({ memberId, isLeader, onClose }: { memberId: string; isLeader: boolean; onClose: () => void }) {
  const active = useActiveTrip()
  const member = active.team.find((m) => m.id === memberId)
  const sensitive = active.sensitiveByMember[memberId]
  const updateTeamMember = useStore((s) => s.updateTeamMember)
  const updateMemberSensitive = useStore((s) => s.updateMemberSensitive)
  const uploadPassportPhoto = useStore((s) => s.uploadPassportPhoto)
  const getPassportPhotoUrl = useStore((s) => s.getPassportPhotoUrl)

  const [role, setRole] = useState(member?.role ?? '')
  const [legalName, setLegalName] = useState(sensitive?.legalName ?? '')
  const [emergencyContact, setEmergencyContact] = useState(sensitive?.emergencyContact ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (sensitive?.passportPhotoPath) getPassportPhotoUrl(sensitive.passportPhotoPath).then(setPhotoUrl)
  }, [sensitive?.passportPhotoPath, getPassportPhotoUrl])

  if (!member) return null

  function saveRole() {
    if (role.trim() && role !== member!.role) updateTeamMember(memberId, { role: role.trim() })
  }
  function saveLegalName() {
    if (legalName !== (sensitive?.legalName ?? '')) updateMemberSensitive(memberId, { legalName })
  }
  function saveEmergencyContact() {
    if (emergencyContact !== (sensitive?.emergencyContact ?? '')) updateMemberSensitive(memberId, { emergencyContact })
  }

  async function handlePhoto(file: File) {
    setUploading(true)
    await uploadPassportPhoto(memberId, file)
    setUploading(false)
  }

  return (
    <Modal title={member.name} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Role</span>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} onBlur={saveRole} disabled={!isLeader} />
        </label>

        <div>
          <span className="mb-1 block text-xs font-medium text-stone-500">Type</span>
          <MemberTypeToggle
            value={member.memberType}
            disabled={!isLeader}
            onChange={(v) => updateTeamMember(memberId, { memberType: v })}
          />
        </div>

        <MemberFlightsSection memberId={memberId} />

        <div className="border-t border-stone-100 pt-4">
          {isLeader ? (
            <>
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                <ShieldCheck size={13} />
                Visible to trip leaders only
              </div>

              <div className="mb-3">
                {photoUrl ? (
                  <div className="relative">
                    <img src={photoUrl} alt="Passport" className="h-40 w-full rounded-lg object-cover" />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 py-6 text-sm font-medium text-stone-500 hover:border-brand-mint-dark hover:text-brand-mint-dark disabled:opacity-60"
                  >
                    <Camera size={16} />
                    {uploading ? 'Uploading…' : 'Add passport photo'}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhoto(file)
                    e.target.value = ''
                  }}
                />
              </div>

              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-medium text-stone-500">Full legal name</span>
                <input className="input" value={legalName} onChange={(e) => setLegalName(e.target.value)} onBlur={saveLegalName} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-stone-500">Emergency contact</span>
                <input
                  className="input"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  onBlur={saveEmergencyContact}
                  placeholder="Name + phone number"
                />
              </label>
            </>
          ) : (
            <p className="text-xs text-stone-400">Passport photo and emergency contact are only visible to trip leaders.</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
