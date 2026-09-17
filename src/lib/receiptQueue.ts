// Offline queue for scanned receipts. Stored in IndexedDB (survives reloads,
// handles binary Blobs natively, unlike localStorage). Flushed whenever the
// app comes back online or is reopened.

import { createSharedLink, uploadToDropbox } from './dropbox'
import { useDropboxStore } from '../dropboxStore'
import { receiptFolder } from './dropboxPath'

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

export async function flushReceiptQueue(): Promise<void> {
  if (flushing || !navigator.onLine) return
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
