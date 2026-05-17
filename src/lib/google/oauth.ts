import { STORAGE_KEYS } from '@/lib/storage/keys'
import { readJson, removeKey, writeJson } from '@/lib/storage/local-storage'
import type { GoogleTokens } from './types'

const SCOPES = [
  // XXX: We only want to access files created by this app, not all spreadsheet files
  // 'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
].join(' ')

function getClientId(): string {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!id) throw new Error('VITE_GOOGLE_CLIENT_ID is not set')
  return id
}

function redirectUri(): string {
  return `${window.location.origin}/oauth/callback`
}

function base64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function createCodeVerifier(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return base64Url(bytes.buffer)
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64Url(digest)
}

export function getStoredTokens(): GoogleTokens | null {
  return readJson<GoogleTokens>(STORAGE_KEYS.googleTokens)
}

export function storeTokens(tokens: GoogleTokens): void {
  writeJson(STORAGE_KEYS.googleTokens, tokens)
}

export function clearTokens(): void {
  removeKey(STORAGE_KEYS.googleTokens)
}

export function isAuthenticated(): boolean {
  return getStoredTokens() !== null
}

export async function startGoogleLogin(): Promise<void> {
  const verifier = await createCodeVerifier()
  const challenge = await createCodeChallenge(verifier)
  writeJson(STORAGE_KEYS.oauthVerifier, verifier)

  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

async function requestTokens(
  body:
    | {
        grant_type: 'authorization_code'
        code: string
        code_verifier: string
        redirect_uri: string
      }
    | { grant_type: 'refresh_token'; refresh_token: string },
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch('/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
  }
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${data.error ?? res.statusText}`)
  }
  if (!data.access_token || !data.expires_in) {
    throw new Error('Token exchange failed: invalid response')
  }
  return data as { access_token: string; refresh_token?: string; expires_in: number }
}

export async function handleOAuthCallback(code: string): Promise<GoogleTokens> {
  const verifier = readJson<string>(STORAGE_KEYS.oauthVerifier)
  if (!verifier) throw new Error('Missing OAuth verifier')

  const data = await requestTokens({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri(),
  })

  const existing = getStoredTokens()
  const refreshToken = data.refresh_token ?? existing?.refreshToken
  if (!refreshToken) throw new Error('No refresh token received')

  const tokens: GoogleTokens = {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  storeTokens(tokens)
  removeKey(STORAGE_KEYS.oauthVerifier)

  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })
    if (userRes.ok) {
      const user = (await userRes.json()) as { email?: string }
      tokens.email = user.email
      storeTokens(tokens)
    }
  } catch {
    /* optional */
  }

  return tokens
}

export async function refreshAccessToken(): Promise<GoogleTokens> {
  const current = getStoredTokens()
  if (!current?.refreshToken) throw new Error('Not authenticated')

  let data: { access_token: string; expires_in: number }
  try {
    data = await requestTokens({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken,
    })
  } catch {
    clearTokens()
    throw new Error('Session expired')
  }
  const tokens: GoogleTokens = {
    ...current,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  storeTokens(tokens)
  return tokens
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = getStoredTokens()
  if (!tokens) throw new Error('Not authenticated')
  if (tokens.expiresAt - Date.now() > 60_000) return tokens.accessToken
  const refreshed = await refreshAccessToken()
  return refreshed.accessToken
}

export function logout(): void {
  clearTokens()
  removeKey(STORAGE_KEYS.appFolderId)
  removeKey(STORAGE_KEYS.lastWorkspaceId)
}
