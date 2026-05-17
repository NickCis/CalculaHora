import { handleTokenRequest, type TokenApiBody } from '../../server/oauth-token'

type Req = { method?: string; body?: TokenApiBody }
type Res = {
  status: (code: number) => { json: (data: unknown) => void }
  setHeader: (name: string, value: string) => void
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body
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
