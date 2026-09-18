// Queue for scanned receipts, stored in IndexedDB (survives reloads, handles
// binary Blobs natively unlike localStorage). Receipts are queued whenever
// we're offline, or not confirmed to be in the US, or not confirmed to be on
// wifi — uploading dozens of photos is exactly the kind of thing that should
// never happen silently over international cellular. The queue auto-flushes
// once one of those is confirmed, or can be flushed on demand (an "Upload
// now" button) when the platform can't auto-detect either signal.

import { createSharedLink, uploadToDropbox } from './dropbox'
import { useDropboxStore } from '../dropboxStore'
import { receiptFolder } from './dropboxPath'
import { canAutoUpload } from './network'

export interface QueuedReceipt {
  id: string
  blob: Blob
  tripId: string
  tripName: string
  dropboxFolder?: string
  createdAt: string
}

const DB_NAME = '501-trip-planner-receipts'
const STORE = 'queue'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function queueReceipt(item: QueuedReceipt): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQueuedReceipts(): Promise<QueuedReceipt[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as QueuedReceipt[])
    req.onerror = () => reject(req.error)
  })
}

export async function removeQueuedReceipt(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

let flushing = false

// `force: true` bypasses the wifi check — used by an explicit "Upload now"
// button, since we can't auto-detect wifi at all on iOS Safari.
export async function flushReceiptQueue(force = false): Promise<void> {
  if (flushing) return
  if (!force && !(await canAutoUpload())) return
  if (!navigator.onLine) return
  flushing = true
  try {
    const items = await getQueuedReceipts()
    if (items.length === 0) return
    const dropbox = useDropboxStore.getState()
    const token = await dropbox.getValidAccessToken()
    if (!token) return

    for (const item of items) {
      try {
        const stamp = item.createdAt.replace(/[:.]/g, '-')
        const path = `${receiptFolder(item.tripName, item.dropboxFolder)}/${stamp}.jpg`
        const uploadedPath = await uploadToDropbox(token, path, item.blob)
        await createSharedLink(token, uploadedPath)
        await removeQueuedReceipt(item.id)
      } catch {
        // leave it queued, try again next flush
      }
    }
  } finally {
    flushing = false
  }
}
