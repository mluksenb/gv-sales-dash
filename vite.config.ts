import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * En dev, Vite ne sert pas les fonctions Vercel du dossier api/.
 * Ce middleware rejoue api/kyc-precheck.ts sur /api/kyc-precheck
 * pour que la page /docs-ai fonctionne avec `npm run dev`.
 */
function kycPrecheckDevApi(env: Record<string, string | undefined>): Plugin {
  const claudeApiKey = env.CLAUDE_API_KEY || env.ANTHROPIC_API_KEY
  return {
    name: 'kyc-precheck-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/kyc-precheck', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Méthode non autorisée' }))
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          void (async () => {
            res.setHeader('Content-Type', 'application/json')
            if (!claudeApiKey) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'CLAUDE_API_KEY non configurée (voir .env)' }))
              return
            }
            try {
              const { runPrecheck } = await import('./api/_lib/claude.ts')
              const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
              const result = await runPrecheck(payload, claudeApiKey, env.CLAUDE_PRECHECK_MODEL)
              res.end(JSON.stringify(result))
            } catch (error) {
              res.statusCode = 502
              const message = error instanceof Error ? error.message : 'Erreur inconnue'
              res.end(JSON.stringify({ error: message }))
            }
          })()
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), kycPrecheckDevApi(env)],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          support: resolve(__dirname, 'support.html'),
          docsAi: resolve(__dirname, 'docs-ai.html'),
        },
      },
    },
  }
})
