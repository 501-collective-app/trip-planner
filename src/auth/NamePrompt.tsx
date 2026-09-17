import { useState } from 'react'
import { useStore } from '../store'
import { BrandMark } from '../components/BrandMark'

export function NamePrompt() {
  const saveDisplayName = useStore((s) => s.saveDisplayName)
  const email = useStore((s) => s.session?.user.email)
  const [name, setName] = useState(email?.split('@')[0] ?? '')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    await saveDisplayName(name.trim())
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <BrandMark on="light" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900">What's your name?</h2>
        <p className="mt-1 mb-4 text-sm text-stone-500">Shown to teammates on shared trips.</p>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoFocus
        />
        <button
          onClick={submit}
          disabled={saving || !name.trim()}
          className="mt-3 w-full rounded-lg bg-brand-mint-dark px-4 py-2.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
