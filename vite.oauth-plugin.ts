import { loadEnv, type Plugin, type ResolvedConfig } from 'vite'
import { handleTokenRequest, type TokenApiBody } from './server/oauth-token'

function applyEnv(config: ResolvedConfig): void {
  const env = loadEnv(config.mode, config.envDir, '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

export function oauthApiDevPlugin(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'oauth-api-dev',
    configResolved(resolved) {
      config = resolved
      applyEnv(resolved)
    },
    configureServer(server) {
      applyEnv(config)

      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/oauth/token' || req.method !== 'POST') {
          next()
          return
        }

        applyEnv(config)

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(chunk as Buffer)
          }
          const body = JSON.parse(Buffer.concat(chunks).toString()) as TokenApiBody
          const tokens = await handleTokenRequest(body)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(tokens))
        } catch (e) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: e instanceof Error ? e.message : 'Token exchange failed',
            }),
          )
        }
      })
    },
  }
}
