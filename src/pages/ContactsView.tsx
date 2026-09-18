import { useState } from 'react'
import { Plus, Trash2, Phone, Mail, MessageCircle } from 'lucide-react'
import { useStore, useActiveTrip } from '../store'
import { Modal } from '../components/Modal'
import type { Contact } from '../types'

function waHref(phone: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
}
function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`
}

export function ContactsView() {
  const contacts = useActiveTrip().contacts
  const removeContact = useStore((s) => s.removeContact)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-6 flex items-center justify-end">
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-mint-dark px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
        >
          <Plus size={14} />
          Add contact
        </button>
      </div>

      <div className="space-y-3">
        {contacts.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 px-5 py-8 text-center text-sm text-stone-400">
            No contacts added yet.
          </div>
        )}
        {contacts.map((c) => (
          <div key={c.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => setEditingId(c.id)} className="min-w-0 flex-1 text-left">
                <div className="text-base font-semibold text-stone-900">{c.name}</div>
                {c.role && <div className="text-sm text-stone-500">{c.role}</div>}
                {c.notes && <div className="mt-1 text-sm text-stone-400">{c.notes}</div>}
              </button>
              <button
                onClick={() => removeContact(c.id)}
                className="shrink-0 rounded-lg p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
            {(c.phone || c.email) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.phone && c.hasWhatsApp !== false && (
                  <a
                    href={waHref(c.phone)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3 py-1.5 text-sm font-medium text-[#128C7E] hover:bg-[#25D366]/20"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                )}
                {c.phone && (
                  <a
                    href={telHref(c.phone)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-200"
                  >
                    <Phone size={14} />
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-200"
                  >
                    <Mail size={14} />
                    {c.email}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {adding && <ContactForm onClose={() => setAdding(false)} />}
      {editingId && <ContactForm existing={contacts.find((c) => c.id === editingId)} onClose={() => setEditingId(null)} />}
    </div>
  )
}

function ContactForm({ existing, onClose }: { existing?: Contact; onClose: () => void }) {
  const addContact = useStore((s) => s.addContact)
  const updateContact = useStore((s) => s.updateContact)
  const [name, setName] = useState(existing?.name ?? '')
  const [role, setRole] = useState(existing?.role ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [hasWhatsApp, setHasWhatsApp] = useState(existing?.hasWhatsApp ?? true)

  function submit() {
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      role: role.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      hasWhatsApp,
    }
    if (existing) updateContact(existing.id, payload)
    else addContact(payload)
    onClose()
  }

  return (
    <Modal title={existing ? 'Edit contact' : 'Add contact'} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Role</span>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Trip organizer, Kenya" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Phone</span>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254795557099" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hasWhatsApp} onChange={(e) => setHasWhatsApp(e.target.checked)} className="h-4 w-4 rounded border-stone-300" />
          <span className="text-sm text-stone-600">Has WhatsApp (uncheck for airline support lines, offices, etc.)</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Email</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Notes</span>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button onClick={submit} className="rounded-lg bg-brand-mint-dark px-4 py-2 text-sm font-medium text-white hover:brightness-95">
            {existing ? 'Save' : 'Add contact'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
