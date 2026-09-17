// Calls our own Supabase Edge Function proxy (never AeroDataBox directly),
// so the RapidAPI key stays server-side. See supabase/functions/flight-status.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export interface FlightStatus {
  status: string | null
  departure: { airport: string | null; terminal: string | null; gate: string | null; scheduledTime: string | null; revisedTime: string | null }
  arrival: { airport: string | null; terminal: string | null; gate: string | null; baggageBelt: string | null; scheduledTime: string | null; revisedTime: string | null }
}

export async function fetchFlightStatus(flightNumber: string, dateIso: string): Promise<{ data: FlightStatus | null; error: string | null }> {
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
