import { useEffect, type ReactNode } from 'react'
import { useStore } from '../store'
import { supabaseConfigured } from '../lib/supabaseClient'
import { SignIn } from './SignIn'
import { NamePrompt } from './NamePrompt'
import { BrandMark } from '../components/BrandMark'

export function AuthGate({ children }: { children: ReactNode }) {
  const authLoading = useStore((s) => s.authLoading)
  const session = useStore((s) => s.session)
  const needsName = useStore((s) => s.needsName)
  const activeTripData = useStore((s) => s.activeTripData)
  const trips = useStore((s) => s.trips)
  const initAuth = useStore((s) => s.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 flex justify-center">
            <BrandMark on="light" />
          </div>
          <p className="text-sm text-stone-600">
            Not connected to a database yet. Add <code className="rounded bg-stone-100 px-1">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-stone-100 px-1">VITE_SUPABASE_ANON_KEY</code> and restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  if (authLoading) return <LoadingScreen />
  if (!session) return <SignIn />
  if (needsName) return <NamePrompt />
  if (trips.length === 0 || !activeTripData) return <LoadingScreen />

  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark">
      <div className="animate-pulse">
        <BrandMark size="huge" />
      </div>
    </div>
  )
}
