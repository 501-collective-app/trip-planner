import { useState } from 'react'
import { Mail } from 'lucide-react'
import { useStore } from '../store'
import { BrandMark } from '../components/BrandMark'

export function SignIn() {
  const signInWithEmail = useStore((s) => s.signInWithEmail)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function submit() {
    if (!email.trim()) return
    setSending(true)
    setError(null)
    const { error } = await signInWithEmail(email.trim())
    setSending(false)
    if (error) setError(error)
    else setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <BrandMark on="light" />
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint/15 text-brand-mint-dark">
              <Mail size={20} />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Check your email</h2>
            <p className="mt-1 text-sm text-stone-500">
              We sent a sign-in link to <span className="font-medium text-stone-700">{email}</span>. Open it on this device to
              continue.
            </p>
            <button onClick={() => setSent(false)} className="mt-4 text-xs font-medium text-stone-400 hover:text-stone-600">
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-stone-900">Sign in</h2>
            <p className="mt-1 mb-4 text-sm text-stone-500">
              We'll email you a link, no password to remember. Ask your trip lead to invite your email to see a shared trip.
            </p>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <button
              onClick={submit}
              disabled={sending || !email.trim()}
              className="mt-3 w-full rounded-lg bg-brand-mint-dark px-4 py-2.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send sign-in link'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
