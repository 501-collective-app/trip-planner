import { useEffect, useRef, useState } from 'react'
import { Camera, Check, CloudOff, Loader2, Plus, X } from 'lucide-react'
import { useDropboxStore } from '../dropboxStore'
import { createSharedLink, uploadToDropbox } from '../lib/dropbox'
import { queueReceipt, flushReceiptQueue } from '../lib/receiptQueue'
import { receiptFolder } from '../lib/dropboxPath'

type Step = 'capturing' | 'confirm' | 'saving' | 'another'

export function ScanReceiptsFlow({
  tripId,
  tripName,
  dropboxFolder,
  onClose,
}: {
  tripId: string
  tripName: string
  dropboxFolder?: string
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>('capturing')
  const [photo, setPhoto] = useState<{ file: File; previewUrl: string } | null>(null)
  const [queued, setQueued] = useState(false)
  const [addedCount, setAddedCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const accessToken = useDropboxStore((s) => s.accessToken)
  const getValidAccessToken = useDropboxStore((s) => s.getValidAccessToken)

  useEffect(() => {
    if (step === 'capturing') inputRef.current?.click()
  }, [step])

  function handleFile(file: File) {
    setPhoto({ file, previewUrl: URL.createObjectURL(file) })
    setStep('confirm')
  }

  function retake() {
    if (photo) URL.revokeObjectURL(photo.previewUrl)
    setPhoto(null)
    setStep('capturing')
  }

  async function confirmAdd() {
    if (!photo) return
    setStep('saving')
    setQueued(false)

    let succeeded = false
    if (navigator.onLine) {
      try {
        const token = await getValidAccessToken()
        if (token) {
          const stamp = new Date().toISOString().replace(/[:.]/g, '-')
          const path = `${receiptFolder(tripName, dropboxFolder)}/${stamp}.jpg`
          const uploadedPath = await uploadToDropbox(token, path, photo.file)
          await createSharedLink(token, uploadedPath)
          succeeded = true
        }
      } catch {
        succeeded = false
      }
    }

    if (!succeeded) {
      await queueReceipt({ id: crypto.randomUUID(), blob: photo.file, tripId, tripName, dropboxFolder, createdAt: new Date().toISOString() })
      setQueued(true)
    }

    URL.revokeObjectURL(photo.previewUrl)
    setPhoto(null)
    setAddedCount((n) => n + 1)
    setStep('another')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) handleFile(file)
          else if (addedCount === 0) onClose() // they cancelled the camera with nothing captured yet
          else setStep('another')
        }}
      />

      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
      >
        <span className="text-sm font-medium text-white/70">
          {addedCount > 0 ? `${addedCount} receipt${addedCount === 1 ? '' : 's'} added` : 'Scan receipts'}
        </span>
        <button onClick={onClose} className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        {step === 'capturing' && <p className="text-sm text-white/50">Opening camera&hellip;</p>}

        {step === 'confirm' && photo && (
          <div className="w-full max-w-md">
            <img src={photo.previewUrl} alt="Captured receipt" className="max-h-[65vh] w-full rounded-xl object-contain" />
            <p className="mt-4 text-center text-base font-medium text-white">Add this receipt?</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={retake}
                className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                Retake
              </button>
              <button
                onClick={confirmAdd}
                className="flex-1 rounded-xl bg-brand-mint py-3 text-sm font-semibold text-brand-dark hover:brightness-95"
              >
                Add receipt
              </button>
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Saving&hellip;</p>
          </div>
        )}

        {step === 'another' && (
          <div className="w-full max-w-md text-center">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                queued ? 'bg-amber-400/20 text-amber-300' : 'bg-brand-mint/20 text-brand-mint'
              }`}
            >
              {queued ? <CloudOff size={26} /> : <Check size={26} />}
            </div>
            <p className="text-base font-medium text-white">{queued ? 'Saved — will upload once online' : 'Uploaded to Dropbox'}</p>
            {!accessToken && !queued && (
              <p className="mt-1 text-xs text-white/40">Connect Dropbox in Settings to actually upload receipts.</p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                Done
              </button>
              <button
                onClick={() => setStep('capturing')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-mint py-3 text-sm font-semibold text-brand-dark hover:brightness-95"
              >
                <Plus size={16} />
                Add another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ScanReceiptsButton({
  tripId,
  tripName,
  dropboxFolder,
  className,
}: {
  tripId: string
  tripName: string
  dropboxFolder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    flushReceiptQueue()
    const onOnline = () => flushReceiptQueue()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? 'flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100'}
      >
        <Camera size={14} />
        Scan receipts
      </button>
      {open && <ScanReceiptsFlow tripId={tripId} tripName={tripName} dropboxFolder={dropboxFolder} onClose={() => setOpen(false)} />}
    </>
  )
}
