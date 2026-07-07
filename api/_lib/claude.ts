/**
 * Pré-contrôle IA des documents KYC — appel du modèle (Claude / Anthropic).
 * Module serveur uniquement : utilisé par la fonction Vercel `api/kyc-precheck.ts`
 * et le middleware de dev Vite. Ne pas importer depuis le frontend.
 */
import Anthropic from '@anthropic-ai/sdk'
import {
  buildPrompt,
  getDocDefinition,
  toPrecheckResult,
  type PrecheckRequest,
  type PrecheckResult,
  type RawModelOutput,
} from './kyc.js'

/**
 * Pré-contrôle "léger" : Haiku 4.5 est le modèle le plus rapide et le plus
 * économique avec vision + PDF + structured outputs. Surclasser via
 * CLAUDE_PRECHECK_MODEL (ex. claude-sonnet-4-6) si la précision l'exige.
 */
const DEFAULT_MODEL = 'claude-haiku-4-5'

/**
 * Schéma imposé à la réponse (structured outputs) — le JSON est garanti valide.
 * L'ORDRE des propriétés est délibéré : le décodage contraint suit l'ordre du
 * schéma, donc le modèle extrait d'abord les valeurs brutes (extracted), puis,
 * pour chaque critère, écrit son observation AVANT de conclure (status).
 */
const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['extracted', 'documentSummary', 'criteria'],
  properties: {
    extracted: {
      type: 'object',
      additionalProperties: false,
      required: [
        'typeDocument',
        'nom',
        'prenoms',
        'dateNaissance',
        'nationalite',
        'adresse',
        'dateEmission',
        'dateExpiration',
        'iban',
        'bic',
      ],
      properties: {
        typeDocument: { type: 'string' },
        nom: { type: 'string' },
        prenoms: { type: 'string' },
        dateNaissance: { type: 'string' },
        nationalite: { type: 'string' },
        adresse: { type: 'string' },
        dateEmission: { type: 'string' },
        dateExpiration: { type: 'string' },
        iban: { type: 'string' },
        bic: { type: 'string' },
      },
    },
    documentSummary: { type: 'string' },
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'observation', 'status', 'detail', 'suggestedFix'],
        properties: {
          id: { type: 'string' },
          observation: { type: 'string' },
          status: { type: 'string', enum: ['pass', 'fail'] },
          detail: { type: 'string' },
          suggestedFix: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['field', 'value'],
              properties: {
                field: {
                  type: 'string',
                  enum: [
                    'civilite',
                    'prenoms',
                    'nom',
                    'dateNaissance',
                    'nationalite',
                    'adresse',
                    'codePostal',
                    'ville',
                    'pays',
                  ],
                },
                value: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const

const IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type ImageMediaType = (typeof IMAGE_MEDIA_TYPES)[number]

export async function runPrecheck(
  payload: PrecheckRequest,
  apiKey: string,
  modelOverride?: string,
): Promise<PrecheckResult> {
  const def = getDocDefinition(payload.docType)
  if (!def) throw new Error(`Type de document inconnu : ${payload.docType}`)
  if (!payload.files?.length) throw new Error('Aucun fichier fourni')

  const client = new Anthropic({ apiKey })
  const model = modelOverride || DEFAULT_MODEL

  const content: Anthropic.ContentBlockParam[] = [
    ...payload.files.map((f): Anthropic.ContentBlockParam => {
      if (f.mimeType === 'application/pdf') {
        return {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: f.dataBase64 },
        }
      }
      if (!IMAGE_MEDIA_TYPES.includes(f.mimeType as ImageMediaType)) {
        throw new Error(`Format de fichier non pris en charge : ${f.mimeType}`)
      }
      return {
        type: 'image',
        source: { type: 'base64', media_type: f.mimeType as ImageMediaType, data: f.dataBase64 },
      }
    }),
    { type: 'text', text: buildPrompt(def, payload.client, payload.files.length) },
  ]

  // Température 0 pour des verdicts reproductibles ; le paramètre n'existe plus
  // sur Opus 4.7+ — on ne l'envoie que pour les familles qui l'acceptent.
  const supportsTemperature = /haiku|sonnet/.test(model)

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model,
      max_tokens: 4096,
      ...(supportsTemperature ? { temperature: 0 } : {}),
      output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
      messages: [{ role: 'user', content }],
    })
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Erreur Claude (${error.status ?? '?'}) : ${error.message.slice(0, 300)}`, {
        cause: error,
      })
    }
    throw error
  }

  if (response.stop_reason === 'refusal') {
    throw new Error('Le modèle a refusé d’analyser ce document.')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Réponse du modèle tronquée (max_tokens atteint).')
  }

  const rawText = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
  if (!rawText) throw new Error('Réponse Claude vide')

  let parsed: RawModelOutput
  try {
    parsed = JSON.parse(rawText) as RawModelOutput
  } catch {
    throw new Error('Réponse Claude non parsable en JSON')
  }

  return toPrecheckResult(def, parsed)
}
