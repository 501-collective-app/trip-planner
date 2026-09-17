// Supabase Edge Function: proxies flight-status lookups to AeroDataBox so the
// RapidAPI key never reaches the browser. Deploy via the Supabase Dashboard
// (Edge Functions -> New function -> paste this file) and set the secret
// AERODATABOX_KEY under Edge Functions -> Secrets.
//
// Call it as: GET /flight-status?number=KQ100&date=2026-09-21

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  const url = new URL(req.url)
  const number = url.searchParams.get('number')
  const date = url.searchParams.get('date') // YYYY-MM-DD

  if (!number || !date) {
    return new Response(JSON.stringify({ error: 'Missing "number" or "date" query param' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('AERODATABOX_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AERODATABOX_KEY secret not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const cleanNumber = number.replace(/\s+/g, '').toUpperCase()
  const upstream = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(cleanNumber)}/${encodeURIComponent(date)}?withAircraftImage=false&withLocation=false`

  try {
    const res = await fetch(upstream, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(JSON.stringify({ error: `Upstream ${res.status}`, detail: text.slice(0, 500) }), {
        status: res.status === 404 ? 404 : 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    const flight = Array.isArray(data) ? data[0] : data
    if (!flight) {
      return new Response(JSON.stringify({ error: 'No flight found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const summary = {
      status: flight.status ?? null,
      departure: {
        airport: flight.departure?.airport?.iata ?? null,
        terminal: flight.departure?.terminal ?? null,
        gate: flight.departure?.gate ?? null,
        scheduledTime: flight.departure?.scheduledTime?.utc ?? null,
        revisedTime: flight.departure?.revisedTime?.utc ?? null,
      },
      arrival: {
        airport: flight.arrival?.airport?.iata ?? null,
        terminal: flight.arrival?.terminal ?? null,
        gate: flight.arrival?.gate ?? null,
        baggageBelt: flight.arrival?.baggageBelt ?? null,
        scheduledTime: flight.arrival?.scheduledTime?.utc ?? null,
        revisedTime: flight.arrival?.revisedTime?.utc ?? null,
      },
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Fetch failed', detail: String(err) }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
