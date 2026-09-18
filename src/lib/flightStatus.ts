// Calls our own Supabase Edge Function proxy (never AeroDataBox directly),
// so the RapidAPI key stays server-side. See supabase/functions/flight-status.
//
// Requests are cached (5 min) and serialized with a small stagger, since a
// page can mount many flight cards at once and free-tier RapidAPI plans
// rate-limit bursts of concurrent requests — without this, some cards would
// randomly fail while others succeeded. Failures retry once automatically.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export interface FlightStatus {
  status: string | null
  departure: { airport: string | null; terminal: string | null; gate: string | null; scheduledTime: string | null; revisedTime: string | null }
  arrival: { airport: string | null; terminal: string | null; gate: string | null; baggageBelt: string | null; scheduledTime: string | null; revisedTime: string | null }
}

type Result = { data: FlightStatus | null; error: string | null }

const CACHE_TTL_MS = 5 * 60_000
const cache = new Map<string, { at: number; result: Result }>()
const inFlight = new Map<string, Promise<Result>>()

// Serializes requests with a small gap between each, instead of firing them
// all at once, so a page full of flight cards doesn't burst-trigger rate limits.
let queueTail: Promise<void> = Promise.resolve()
const STAGGER_MS = 250

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueTail.then(fn)
  queueTail = run.then(
    () => new Promise((resolve) => setTimeout(resolve, STAGGER_MS)),
    () => new Promise((resolve) => setTimeout(resolve, STAGGER_MS)),
  )
  return run
}

async function doFetch(flightNumber: string, dateIso: string): Promise<Result> {
  if (!SUPABASE_URL || !ANON_KEY) return { data: null, error: 'Not configured' }

  const url = `${SUPABASE_URL}/functions/v1/flight-status?number=${encodeURIComponent(flightNumber)}&date=${encodeURIComponent(dateIso)}`
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY } })
    const body = await res.json()
    if (!res.ok) return { data: null, error: body.error ?? `Request failed (${res.status})` }
    return { data: body as FlightStatus, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

export async function fetchFlightStatus(flightNumber: string, dateIso: string): Promise<Result> {
  const key = `${flightNumber.toUpperCase()}_${dateIso}`

  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.result

  const pending = inFlight.get(key)
  if (pending) return pending

  const promise = (async () => {
    let result = await enqueue(() => doFetch(flightNumber, dateIso))
    if (result.error) {
      // one retry, since transient rate-limit/network blips are common with bursty page loads
      result = await enqueue(() => doFetch(flightNumber, dateIso))
    }
    cache.set(key, { at: Date.now(), result })
    inFlight.delete(key)
    return result
  })()

  inFlight.set(key, promise)
  return promise
}
