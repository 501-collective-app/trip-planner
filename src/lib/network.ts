// Gates expensive uploads (receipt photos) so they don't quietly burn
// through someone's data plan overseas.
//
// Two signals, combined:
//  1. Location: is the device currently in the US? Uses the Geolocation API,
//     which (unlike Network Information below) works on iOS Safari — this is
//     the primary, reliable signal for "I'm home, data is unlimited."
//  2. Connection type: `navigator.connection.type === 'wifi'`. Only exists in
//     Chromium browsers (Chrome/Edge/Android) — NOT Safari or Firefox. Kept
//     as a second path so Android users still get auto-upload on hotel wifi
//     while abroad, without needing a location fix.
//
// If neither signal can confirm we're in a safe spot, receipts queue instead
// of uploading — the safe default is to wait, never to guess wrong.

export type ConnectionKind = 'wifi' | 'cellular' | 'unknown'

interface NetworkInformationLike {
  type?: string
  addEventListener?: (type: 'change', listener: () => void) => void
  removeEventListener?: (type: 'change', listener: () => void) => void
}

function getConnection(): NetworkInformationLike | undefined {
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike
    mozConnection?: NetworkInformationLike
    webkitConnection?: NetworkInformationLike
  }
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection
}

export function getConnectionKind(): ConnectionKind {
  const conn = getConnection()
  if (!conn?.type) return 'unknown'
  if (conn.type === 'wifi' || conn.type === 'ethernet') return 'wifi'
  if (conn.type === 'cellular') return 'cellular'
  return 'unknown'
}

export function connectionKindIsDetectable(): boolean {
  return !!getConnection()?.type
}

// Rough bounding boxes (continental US, Alaska, Hawaii). Good enough to
// distinguish "at home" from "abroad" — not meant to be precise near borders.
const US_BOUNDS = [
  { minLat: 24.5, maxLat: 49.5, minLon: -125, maxLon: -66.9 }, // CONUS
  { minLat: 51, maxLat: 71.5, minLon: -179, maxLon: -129 }, // Alaska
  { minLat: 18.5, maxLat: 22.5, minLon: -160.5, maxLon: -154.5 }, // Hawaii
]

function isUSCoordinate(lat: number, lon: number): boolean {
  return US_BOUNDS.some((b) => lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon)
}

let usaCache: { value: boolean | null; at: number } | null = null
const USA_CACHE_MS = 10 * 60_000 // avoid re-prompting/re-fixing GPS on every single photo

// null = couldn't determine (no geolocation support, permission denied, or timed out).
export function isLikelyInUSA(): Promise<boolean | null> {
  if (usaCache && Date.now() - usaCache.at < USA_CACHE_MS) return Promise.resolve(usaCache.value)
  if (!('geolocation' in navigator)) return Promise.resolve(null)

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 8000)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout)
        const inUS = isUSCoordinate(pos.coords.latitude, pos.coords.longitude)
        usaCache = { value: inUS, at: Date.now() }
        resolve(inUS)
      },
      () => {
        clearTimeout(timeout)
        usaCache = { value: null, at: Date.now() }
        resolve(null)
      },
      { maximumAge: 5 * 60_000, timeout: 8000 },
    )
  })
}

export async function canAutoUpload(): Promise<boolean> {
  if (!navigator.onLine) return false
  if ((await isLikelyInUSA()) === true) return true
  return getConnectionKind() === 'wifi'
}

// Fires whenever online/offline status or connection type changes, so a
// queue can auto-flush the moment conditions look safe again.
export function onConnectionChange(cb: () => void): () => void {
  const conn = getConnection()
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  conn?.addEventListener?.('change', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
    conn?.removeEventListener?.('change', cb)
  }
}
