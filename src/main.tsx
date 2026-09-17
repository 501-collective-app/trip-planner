import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useDropboxStore } from './dropboxStore'

if (new URLSearchParams(window.location.search).has('code')) {
  useDropboxStore.getState().completeAuthIfNeeded()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
