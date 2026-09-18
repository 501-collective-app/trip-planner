import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthGate } from './auth/AuthGate.tsx'
import { useDropboxStore } from './dropboxStore'
import { flushReceiptQueue } from './lib/receiptQueue'
import { onConnectionChange } from './lib/network'

if (new URLSearchParams(window.location.search).has('code')) {
  useDropboxStore.getState().completeAuthIfNeeded()
}

flushReceiptQueue()
onConnectionChange(() => flushReceiptQueue())
// Reopening/foregrounding the app is a natural moment to recheck location
// (connection-type events don't fire just because you landed in a new country).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') flushReceiptQueue()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>,
)
