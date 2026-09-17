import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthGate } from './auth/AuthGate.tsx'
import { useDropboxStore } from './dropboxStore'
import { flushReceiptQueue } from './lib/receiptQueue'

if (new URLSearchParams(window.location.search).has('code')) {
  useDropboxStore.getState().completeAuthIfNeeded()
}

flushReceiptQueue()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>,
)
