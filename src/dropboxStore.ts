import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  completeDropboxAuthIfNeeded,
  getCurrentAccountName,
  refreshDropboxToken,
  startDropboxAuth,
} from './lib/dropbox'

const DEFAULT_APP_KEY = 'blz766mohzwgqo2'

interface DropboxState {
  appKey: string
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  accountName: string | null
  connecting: boolean

  setAppKey: (key: string) => void
  connect: () => void
  disconnect: () => void
  completeAuthIfNeeded: () => Promise<void>
  getValidAccessToken: () => Promise<string | null>
}

export const useDropboxStore = create<DropboxState>()(
  persist(
    (set, get) => ({
      appKey: DEFAULT_APP_KEY,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      accountName: null,
      connecting: false,

      setAppKey: (key) => set({ appKey: key }),

      connect: () => {
        set({ connecting: true })
        startDropboxAuth(get().appKey || DEFAULT_APP_KEY)
      },

      disconnect: () => set({ accessToken: null, refreshToken: null, expiresAt: null, accountName: null }),

      completeAuthIfNeeded: async () => {
        const appKey = get().appKey || DEFAULT_APP_KEY
        const result = await completeDropboxAuthIfNeeded(appKey)
        set({ connecting: false })
        if (!result) return
        set({ accessToken: result.accessToken, refreshToken: result.refreshToken ?? get().refreshToken, expiresAt: result.expiresAt })
        const name = await getCurrentAccountName(result.accessToken)
        set({ accountName: name })
      },

      getValidAccessToken: async () => {
        const s = get()
        if (!s.accessToken) return null
        if (s.expiresAt && s.expiresAt - Date.now() > 60_000) return s.accessToken
        if (!s.refreshToken) return s.accessToken
        const refreshed = await refreshDropboxToken(s.appKey || DEFAULT_APP_KEY, s.refreshToken)
        if (!refreshed) return null
        set({ accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt })
        return refreshed.accessToken
      },
    }),
    { name: '501-trip-planner-dropbox' },
  ),
)
