import { useRef, useState } from 'react'
import { Camera, Check, ExternalLink, Loader2 } from 'lucide-react'
import { useDropboxStore } from '../dropboxStore'
import { createSharedLink, uploadToDropbox } from '../lib/dropbox'

export function ReceiptCapture({
  tripName,
  expenseDate,
  expenseDescription,
  receiptPath,
  receiptUrl,
  onChange,
}: {
  tripName: string
  expenseDate: string
  expenseDescription: string
  receiptPath?: string
  receiptUrl?: string
  onChange: (path: string | undefined, url: string | undefined) => void
}) {
  const accessToken = useDropboxStore((s) => s.accessToken)
  const getValidAccessToken = useDropboxStore((s) => s.getValidAccessToken)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const token = await getValidAccessToken()
    if (!token) {
      setStatus('error')
      return
    }
    setStatus('uploading')
    try {
      const safeTrip = (tripName || 'Trip').replace(/[^a-z0-9]+/gi, '-').slice(0, 40)
      const safeDesc = (expenseDescription || 'receipt').replace(/[^a-z0-9]+/gi, '-').slice(0, 40)
      const ext = file.type.includes('png') ? 'png' : 'jpg'
      const path = `/${safeTrip}/Receipts/${expenseDate}-${safeDesc}.${ext}`
      const uploadedPath = await uploadToDropbox(token, path, file)
      const url = await createSharedLink(token, uploadedPath)
      onChange(uploadedPath, url ?? undefined)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  if (!accessToken) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-xs text-stone-500">
        Connect Dropbox in Settings to attach receipt photos.
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {receiptPath ? (
        <div className="flex items-center gap-2 rounded-lg bg-brand-mint/10 px-3 py-2 text-xs font-medium text-brand-mint-dark">
          <Check size={14} />
          <span className="min-w-0 flex-1 truncate">Receipt uploaded to Dropbox</span>
          {receiptUrl && (
            <a href={receiptUrl} target="_blank" rel="noreferrer" className="shrink-0 hover:underline">
              <ExternalLink size={13} />
            </a>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 text-stone-400 hover:text-stone-600"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 py-2.5 text-sm font-medium text-stone-500 hover:border-brand-mint-dark hover:text-brand-mint-dark disabled:opacity-60"
        >
          {status === 'uploading' ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Uploading to Dropbox&hellip;
            </>
          ) : (
            <>
              <Camera size={15} /> Scan receipt
            </>
          )}
        </button>
      )}
      {status === 'error' && (
        <p className="mt-1 text-xs text-red-600">Couldn't upload — check your Dropbox connection in Settings and try again.</p>
      )}
    </div>
  )
}
