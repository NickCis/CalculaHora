import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleTokenRequest, type TokenApiBody } from '../lib/oauth-token.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as TokenApiBody | undefined
    if (!body?.grant_type) {
      return res.status(400).json({ error: 'Invalid request body' })
    }
    const tokens = await handleTokenRequest(body)
    return res.status(200).json(tokens)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Token exchange failed'
    return res.status(400).json({ error: message })
  }
}
