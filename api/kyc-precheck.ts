import { runPrecheck } from './_lib/claude'
import type { PrecheckRequest } from './_lib/kyc'

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'CLAUDE_API_KEY non configurée' }, { status: 500 })
  }

  let payload: PrecheckRequest
  try {
    payload = (await request.json()) as PrecheckRequest
  } catch {
    return Response.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }
  if (!payload?.docType || !payload?.client || !Array.isArray(payload?.files) || payload.files.length === 0) {
    return Response.json({ error: 'Requête incomplète : docType, client et files sont requis' }, { status: 400 })
  }

  try {
    const result = await runPrecheck(payload, apiKey, process.env.CLAUDE_PRECHECK_MODEL)
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return Response.json({ error: message }, { status: 502 })
  }
}
