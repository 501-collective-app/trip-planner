import { useEffect, useState } from 'react'
import { Plus, Trash2, Search, RotateCcw, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { useStore, useActiveTrip } from '../store'
import { useDropboxStore } from '../dropboxStore'
import { geocodeCity } from '../lib/geocode'
import { getQueuedReceipts } from '../lib/receiptQueue'
import { receiptFolder } from '../lib/dropboxPath'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function SettingsView() {
  const active = useActiveTrip()
  const { trip, destinations } = active
  const updateTrip = useStore((s) => s.updateTrip)
  const removeDestination = useStore((s) => s.removeDestination)
  const resetActiveTripToSample = useStore((s) => s.resetActiveTripToSample)
  const [addingDest, setAddingDest] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-4 md:px-6 md:py-6">
      <section className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">
        <h3 className="mb-4 text-sm font-semibold text-stone-900">Trip details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Trip name</span>
            <input className="input" value={trip.name} onChange={(e) => updateTrip({ name: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Organization</span>
            <input className="input" value={trip.organization} onChange={(e) => updateTrip({ organization: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Start date</span>
            <input className="input" type="date" value={trip.startDate} onChange={(e) => updateTrip({ startDate: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">End date</span>
            <input className="input" type="date" value={trip.endDate} onChange={(e) => updateTrip({ endDate: e.target.value })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-stone-500">Total budget (USD)</span>
            <input
              className="input"
              type="number"
              min={0}
              value={trip.totalBudget}
              onChange={(e) => updateTrip({ totalBudget: Number(e.target.value) })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3.5 md:px-5">
          <h3 className="text-sm font-semibold text-stone-900">Destinations</h3>
          <button
            onClick={() => setAddingDest(true)}
            className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
          >
            <Plus size={14} />
            Add destination
          </button>
        </div>
        <div className="divide-y divide-stone-100">
          {destinations.length === 0 && <div className="px-5 py-4 text-sm text-stone-400">No destinations yet.</div>}
          {destinations.map((d) => (
            <div key={d.id} className="flex items-center gap-4 px-4 py-3.5 md:px-5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-stone-900">
                  {d.city}, {d.country}
                </div>
                <div className="text-xs text-stone-500">
                  {d.arrive} &rarr; {d.depart} &middot; {d.lat.toFixed(2)}, {d.lon.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => removeDestination(d.id)}
                className="shrink-0 rounded-lg p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <DropboxSection />

      <section className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">
        <h3 className="mb-1 text-sm font-semibold text-stone-900">Reset this trip</h3>
        <p className="mb-3 text-xs text-stone-500">Wipe your changes and restore the sample data for this trip.</p>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
        >
          <RotateCcw size={13} />
          Reset to sample data
        </button>
      </section>

      <AccountSection />

      {addingDest && <AddDestination onClose={() => setAddingDest(false)} />}
      {confirmReset && (
        <ConfirmDialog
          title="Reset this trip"
          message="This replaces this trip's data with the sample data. Continue?"
          confirmLabel="Reset"
          danger
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetActiveTripToSample()
            setConfirmReset(false)
          }}
        />
      )}
    </div>
  )
}

function AccountSection() {
  const email = useStore((s) => s.session?.user.email)
  const signOut = useStore((s) => s.signOut)

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">
      <h3 className="mb-1 text-sm font-semibold text-stone-900">Account</h3>
      <p className="mb-3 text-xs text-stone-500">Signed in as {email}</p>
      <button
        onClick={() => signOut()}
        className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
      >
        Sign out
      </button>
    </section>
  )
}

function DropboxFolderField() {
  const active = useActiveTrip()
  const { trip } = active
  const updateTrip = useStore((s) => s.updateTrip)
  const [value, setValue] = useState(trip.dropboxFolder ?? '')
  const autoPath = receiptFolder(trip.name)

  return (
    <div className="mt-4 border-t border-stone-100 pt-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">Receipts folder for this trip (in your Dropbox)</span>
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => updateTrip({ dropboxFolder: value.trim() || undefined })}
          placeholder={autoPath}
        />
      </label>
      <p className="mt-1 text-xs text-stone-400">
        Leave blank to auto-use <span className="font-mono">{autoPath}</span>. Each trip can point at its own folder — set this
        per trip in its own Settings page.
      </p>
    </div>
  )
}

function DropboxSection() {
  const appKey = useDropboxStore((s) => s.appKey)
  const setAppKey = useDropboxStore((s) => s.setAppKey)
  const accessToken = useDropboxStore((s) => s.accessToken)
  const accountName = useDropboxStore((s) => s.accountName)
  const connecting = useDropboxStore((s) => s.connecting)
  const connect = useDropboxStore((s) => s.connect)
  const disconnect = useDropboxStore((s) => s.disconnect)
  const completeAuthIfNeeded = useDropboxStore((s) => s.completeAuthIfNeeded)
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('code')) completeAuthIfNeeded()
  }, [completeAuthIfNeeded])

  useEffect(() => {
    getQueuedReceipts().then((items) => setPendingCount(items.length))
    const id = setInterval(() => getQueuedReceipts().then((items) => setPendingCount(items.length)), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-stone-900">
        {accessToken ? <Cloud size={16} className="text-brand-mint-dark" /> : <CloudOff size={16} className="text-stone-400" />}
        Receipts &middot; Dropbox
      </h3>
      <p className="mb-3 text-xs text-stone-500">
        Connect Dropbox to upload receipt photos straight from the expense log. Uses your own Dropbox app, nothing goes through
        a third-party server.
      </p>

      {!!pendingCount && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {pendingCount} receipt{pendingCount === 1 ? '' : 's'} saved offline, waiting to upload once you're back online.
        </p>
      )}

      {accessToken ? (
        <div className="flex items-center justify-between rounded-lg bg-brand-mint/10 px-3 py-2.5">
          <div className="text-sm text-stone-700">
            Connected{accountName ? ` as ${accountName}` : ''}
          </div>
          <button onClick={disconnect} className="text-xs font-medium text-stone-500 hover:text-red-600">
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Dropbox App key</span>
            <input
              className="input"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="From dropbox.com/developers/apps"
            />
          </label>
          <button
            onClick={connect}
            disabled={!appKey || connecting}
            className="flex items-center gap-1.5 rounded-lg bg-brand-mint-dark px-3 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50"
          >
            {connecting ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
            Connect Dropbox
          </button>
          <p className="text-xs text-stone-400">
            You'll be sent to dropbox.com to approve access, then back here. Add this page's URL as a redirect URI on your
            Dropbox app first.
          </p>
        </div>
      )}

      <DropboxFolderField />
    </section>
  )
}

function AddDestination({ onClose }: { onClose: () => void }) {
  const addDestination = useStore((s) => s.addDestination)
  const [cityQuery, setCityQuery] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [arrive, setArrive] = useState('')
  const [depart, setDepart] = useState('')
  const [looking, setLooking] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function lookup() {
    setLooking(true)
    setNotFound(false)
    const result = await geocodeCity(cityQuery)
    setLooking(false)
    if (!result) {
      setNotFound(true)
      return
    }
    setCity(result.name)
    setCountry(result.country)
    setLat(result.lat)
    setLon(result.lon)
  }

  function submit() {
    if (!city.trim() || lat === null || lon === null || !arrive || !depart) return
    addDestination({ city: city.trim(), country: country.trim(), lat, lon, arrive, depart })
    onClose()
  }

  return (
    <Modal title="Add destination" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-stone-500">Search for a city</span>
          <div className="flex gap-2">
            <input
              className="input"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="e.g. Kigali"
              onKeyDown={(e) => e.key === 'Enter' && lookup()}
              autoFocus
            />
            <button
              onClick={lookup}
              disabled={looking || !cityQuery.trim()}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-dark px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
            >
              <Search size={13} />
              {looking ? 'Looking up...' : 'Look up'}
            </button>
          </div>
          {notFound && <p className="mt-1 text-xs text-red-600">City not found, try a different spelling.</p>}
        </label>

        {lat !== null && lon !== null && (
          <div className="rounded-lg bg-brand-mint/10 px-3 py-2 text-xs text-brand-mint-dark">
            Found: {city}, {country} ({lat.toFixed(2)}, {lon.toFixed(2)})
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Arrive</span>
            <input className="input" type="date" value={arrive} onChange={(e) => setArrive(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-500">Depart</span>
            <input className="input" type="date" value={depart} onChange={(e) => setDepart(e.target.value)} />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={lat === null}
            className="rounded-lg bg-brand-mint-dark px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-40"
          >
            Add destination
          </button>
        </div>
      </div>
    </Modal>
  )
}
