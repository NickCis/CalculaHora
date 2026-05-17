export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type?: string
}

function getOAuthEnv(): { clientId: string; clientSecret: string } {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID ?? ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ''

  const missing: string[] = []
  if (!clientId) missing.push('VITE_GOOGLE_CLIENT_ID (or GOOGLE_CLIENT_ID)')
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET')

  if (missing.length > 0) {
    throw new Error(
      `Missing env: ${missing.join(', ')}. Set them in Vercel project settings or .env locally.`,
    )
  }

  return { clientId, clientSecret }
}

async function postToGoogle(body: URLSearchParams): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(text || res.statusText)
  }
  return JSON.parse(text) as GoogleTokenResponse
}

export async function exchangeAuthorizationCode(input: {
  code: string
  codeVerifier: string
  redirectUri: string
}): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getOAuthEnv()
  return postToGoogle(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: input.code,
      code_verifier: input.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: input.redirectUri,
    }),
  )
}

export async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getOAuthEnv()
  return postToGoogle(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  )
}

export type TokenApiBody =
  | {
      grant_type: 'authorization_code'
      code: string
      code_verifier: string
      redirect_uri: string
    }
  | {
      grant_type: 'refresh_token'
      refresh_token: string
    }

export async function handleTokenRequest(body: TokenApiBody): Promise<GoogleTokenResponse> {
  if (body.grant_type === 'authorization_code') {
    return exchangeAuthorizationCode({
      code: body.code,
      codeVerifier: body.code_verifier,
      redirectUri: body.redirect_uri,
    })
  }
  return refreshGoogleToken(body.refresh_token)
}
