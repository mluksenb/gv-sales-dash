/**
 * Gemini issue-summary generation. Prompt changes apply to new exports only;
 * do not bulk-regenerate existing issueSummary fields (see summarize-backfill.ts).
 */
import type { StoredConversation } from './types.ts'
import { extractUsageMetadata, type GeminiUsageMetadata } from './gemini-usage.ts'

export const SUMMARIZE_MODEL = 'gemini-2.5-flash-lite'
const MODEL = SUMMARIZE_MODEL

export const SUMMARIZE_SYSTEM_INSTRUCTION = `Tu résumes des conversations de support pour des analystes qui doivent comprendre le besoin ou le problème du client.

Rédige exactement UNE phrase simple en français (même si la conversation est dans une autre langue). Pas de rebonds (« mais », « ensuite », « il s'est avéré ») : reste au motif initial.

La phrase doit exprimer directement le besoin, la question ou l'inquiétude du client — pas les demandes ultérieures dans l'échange.

Formulation :
- Commence par le besoin : « Le client veut… », « Le client souhaite… », « La cliente s'inquiète de… », « Le client, suite à…, souhaite… »
- Ne mentionne jamais le support, le contact, la demande d'aide ou l'ouverture d'un ticket — c'est implicite
- Évite : « a contacté le support », « contacté le support pour », « demande au support », « a écrit au support »

Inclure :
- Le contexte pertinent (produits Goodvest : assurance vie, PER, Goodvie, etc.)
- Ce qui motive le client du point de vue du client

Ne pas inclure :
- Les montants en euros, les chiffres ou les dates précises
- Le déroulé de l'échange ou ce que le client/support a dit tour par tour
- Ce que le support a répondu, les étapes de résolution ou la fin de la conversation
- Ce qui a été découvert ou corrigé pendant l'échange (erreur assureur, trop-perçu, remboursement, etc.)
- Les noms des agents ou le routage interne

Exemples de style attendu :
« Le client veut obtenir des précisions concernant le bénéficiaire de son assurance vie Goodvie. »
« Le client, suite à une notification d'incident de sécurité, souhaite connaître précisément les informations personnelles et financières le concernant qui auraient été compromises et demander leur transmission sécurisée. »
« Le client (ayant ouvert des contrats d'assurance vie et PER il y a quelques mois) a constaté un prélèvement sur son compte qu'il ne comprenait pas. »`

const SYSTEM_INSTRUCTION = SUMMARIZE_SYSTEM_INSTRUCTION

export function buildSummarizeBatchRequest(
  conversation: StoredConversation,
): Record<string, unknown> {
  return {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: buildSummarizePrompt(conversation) }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 100,
    },
  }
}

export function buildSummarizePrompt(conversation: StoredConversation): string {
  const context: string[] = [
    `Channel: ${conversation.medium}`,
    `Resolution: ${conversation.resolution}`,
  ]

  if (conversation.subject) {
    context.push(`Email subject: ${conversation.subject}`)
  }
  if (conversation.aiTitle) {
    context.push(`Chat topic tag: ${conversation.aiTitle}`)
  }

  return `${context.join('\n')}

Transcript:
${conversation.transcript}

Rédige une seule phrase en français qui exprime directement le besoin du client, sans mentionner le support ni le fait d'avoir contacté.`
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
  usageMetadata?: GeminiUsageMetadata
}

export interface SummarizeResult {
  summary: string
  usage: GeminiUsageMetadata | null
}

async function requestSummary(
  conversation: StoredConversation,
  apiKey: string,
): Promise<SummarizeResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(buildSummarizeBatchRequest(conversation)),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    const error = new Error(
      `Gemini API error: ${response.status} ${response.statusText}\n${body}`,
    ) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  const data = (await response.json()) as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

  if (!text) {
    throw new Error('Gemini returned an empty summary')
  }

  return { summary: text, usage: extractUsageMetadata(data) }
}

export async function summarizeConversation(
  conversation: StoredConversation,
  apiKey: string,
): Promise<SummarizeResult> {
  const retryableStatuses = new Set([429, 500, 503, 504])
  const maxAttempts = 4

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestSummary(conversation, apiKey)
    } catch (error) {
      const status = (error as Error & { status?: number }).status
      const isLastAttempt = attempt === maxAttempts
      if (!status || !retryableStatuses.has(status) || isLastAttempt) {
        throw error
      }
      await delay(1000 * attempt)
    }
  }

  throw new Error('Gemini summary failed after retries')
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
