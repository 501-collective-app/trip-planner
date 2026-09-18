// Dropbox OAuth 2.0 with PKCE — works entirely client-side, no server secret.
// Docs: https://developers.dropbox.com/oauth-guide

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateVerifier(): string {
  const arr = new Uint8Array(64)
  crypto.getRandomValues(arr)
  return base64UrlEncode(arr.buffer).slice(0, 128)
}

async function generateChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(digest)
}

export function redirectUri(): string {
  return window.location.origin + window.location.pathname
}

export async function startDropboxAuth(appKey: string) {
  const verifier = generateVerifier()
  sessionStorage.setItem('dbx_verifier', verifier)
  const challenge = await generateChallenge(verifier)
  const params = new URLSearchParams({
    client_id: appKey,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: redirectUri(),
    token_access_type: 'offline',
  })
  window.location.href = `https://www.dropbox.com/oauth2/authorize?${params}`
}

export interface TokenResult {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

export async function completeDropboxAuthIfNeeded(appKey: string): Promise<TokenResult | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (!code) return null
  const verifier = sessionStorage.getItem('dbx_verifier')
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  window.history.replaceState({}, '', url.toString())
  if (!verifier) return null

  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: appKey,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  })
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return null
  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

export async function refreshDropboxToken(appKey: string, refreshToken: string): Promise<TokenResult | null> {
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: appKey })
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return null
  const data = await res.json()
  return { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
}

export async function uploadToDropbox(accessToken: string, path: string, file: Blob): Promise<string> {
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'add', autorename: true, mute: true }),
      'Content-Type': 'application/octet-stream',
    },
    body: file,
  })
  if (!res.ok) throw new Error(`Dropbox upload failed: ${await res.text()}`)
  const data = await res.json()
  return data.path_display as string
}

export async function createSharedLink(accessToken: string, path: string): Promise<string | null> {
  const res = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  if (res.ok) return (await res.json()).url as string

  const listRes = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, direct_only: true }),
  })
  if (listRes.ok) {
    const data = await listRes.json()
    return data.links?.[0]?.url ?? null
  }
  return null
}

export async function getCurrentAccountName(accessToken: string): Promise<string | null> {
  const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.name?.display_name ?? null
}
