import { getValidAccessToken } from './oauth'

export async function googleFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getValidAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { ...init, headers })
  if (res.status === 401) {
    const retryToken = await getValidAccessToken()
    headers.set('Authorization', `Bearer ${retryToken}`)
    return fetch(url, { ...init, headers })
  }
  return res
}

export async function googleJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await googleFetch(url, init)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json() as Promise<T>
}
