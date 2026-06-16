/**
 * Gemini topic classification. Prompt changes apply to new exports only;
 * do not bulk-regenerate existing fields (see classify-backfill.ts).
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveTopicLabel, TOPIC_LABELS } from './taxonomy-labels.ts'
import { applyTopicCategories } from './topic-categories.ts'
import { classifyByRules } from './topic-rules.ts'
import { isSecurityIncidentResponse, TOPIC_SECURITY } from './topics.ts'
import { delay } from './summarize.ts'
import { extractUsageMetadata, type GeminiUsageMetadata } from './gemini-usage.ts'
import type { StoredConversation, TopicClassification, TopicConfidence } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const TAXONOMY_PROMPT_PATH = path.join(ROOT, 'data/intercom/taxonomy-prompt.md')

export const CLASSIFY_MODEL = 'gemini-2.5-flash-lite'
const MODEL = CLASSIFY_MODEL
const MAX_TRANSCRIPT_CHARS = 4000
const MAX_SECONDARY_TOPICS = 2

let taxonomyPromptCache: string | null = null

async function loadTaxonomyPrompt(): Promise<string> {
  if (!taxonomyPromptCache) {
    taxonomyPromptCache = await readFile(TAXONOMY_PROMPT_PATH, 'utf8')
  }
  return taxonomyPromptCache
}

const SYSTEM_INSTRUCTION = `Tu classifies des conversations support Goodvest.

Réponds UNIQUEMENT en JSON valide avec les champs :
- topic (string) : sous-catégorie primaire, libellé EXACT de la taxonomie
- secondaryTopics (array, 0 à 2 strings) : autres besoins distincts, libellés exacts ; [] si aucun
- topicConfidence ("high" | "medium" | "low")
- isSupportTicket (boolean) : false pour spam/prospection/arnaque forwardée/mail tiers ; true pour vraie demande client ou prospect

Règles :
- Classer selon le besoin INITIAL du client, pas la résolution agent.
- secondaryTopics seulement si un second besoin distinct est clairement exprimé par le client.
- Ne jamais inventer de libellé hors taxonomie.
- Incident sécurité juin 2026 (fuite, cyberattaque) → topic "Sécurité" même si MDP ou email mentionné.
- Vente publicitaire / magazine / formation B2B adressée à Goodvest → "Prospection / partenariat non sollicité", PAS "Offres commerciales" (réservé aux offres Goodvest vers clients).`

export function truncateTranscript(transcript: string, maxChars = MAX_TRANSCRIPT_CHARS): string {
  if (transcript.length <= maxChars) {
    return transcript
  }
  return `${transcript.slice(0, maxChars)}\n[… transcript tronqué …]`
}

export function buildClassifyPrompt(
  conversation: StoredConversation,
  taxonomyPrompt: string,
): string {
  const context: string[] = [
    `Channel: ${conversation.medium}`,
    `Initiated by: ${conversation.initiatedBy}`,
    `Resolution: ${conversation.resolution}`,
  ]

  if (conversation.subject) {
    context.push(`Email subject: ${conversation.subject}`)
  }
  if (conversation.aiTitle) {
    context.push(`Chat topic tag: ${conversation.aiTitle}`)
  }
  if (conversation.issueSummary) {
    context.push(`Customer need summary: ${conversation.issueSummary}`)
  }

  const transcript = truncateTranscript(conversation.transcript)

  return `${taxonomyPrompt}

---

Conversation à classifier :

${context.join('\n')}

Transcript:
${transcript}`
}

interface RawClassification {
  topic?: string
  secondaryTopics?: string[]
  topicConfidence?: string
  isSupportTicket?: boolean
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
  usageMetadata?: GeminiUsageMetadata
}

export interface ClassifyResult {
  classification: TopicClassification
  usage: GeminiUsageMetadata | null
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    secondaryTopics: {
      type: 'array',
      items: { type: 'string' },
    },
    topicConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    isSupportTicket: { type: 'boolean' },
  },
  required: ['topic', 'secondaryTopics', 'topicConfidence', 'isSupportTicket'],
}

export async function buildClassifyBatchRequest(
  conversation: StoredConversation,
): Promise<Record<string, unknown>> {
  const taxonomyPrompt = await loadTaxonomyPrompt()
  const userPrompt = buildClassifyPrompt(conversation, taxonomyPrompt)

  return {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 256,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  }
}

export function normalizeClassification(raw: RawClassification): TopicClassification {
  const topic = raw.topic?.trim() ?? ''
  const topicConfidence = parseConfidence(raw.topicConfidence)
  const isSupportTicket = raw.isSupportTicket ?? true

  const secondaryTopics = dedupeSecondaryTopics(topic, raw.secondaryTopics ?? [])

  return {
    topic,
    secondaryTopics,
    topicConfidence,
    isSupportTicket,
    classifiedBy: 'gemini',
  }
}

function parseConfidence(value: string | undefined): TopicConfidence {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }
  return 'medium'
}

export function dedupeSecondaryTopics(
  primary: string,
  secondaries: string[],
): string[] {
  const seen = new Set<string>([primary])
  const result: string[] = []

  for (const label of secondaries) {
    const trimmed = label.trim()
    if (!trimmed || seen.has(trimmed)) continue
    if (!TOPIC_LABELS.includes(trimmed as (typeof TOPIC_LABELS)[number])) continue
    seen.add(trimmed)
    result.push(trimmed)
    if (result.length >= MAX_SECONDARY_TOPICS) break
  }

  return result
}

export function validateClassification(
  classification: TopicClassification,
): TopicClassification {
  const topic = resolveTopicLabel(classification.topic)
  const secondaryTopics = classification.secondaryTopics
    .map(resolveTopicLabel)
    .filter((label) => label !== topic)

  const topicValid = TOPIC_LABELS.includes(topic as (typeof TOPIC_LABELS)[number])

  return {
    ...classification,
    topic: topicValid ? topic : 'Autre / non classifié',
    topicConfidence: topicValid ? classification.topicConfidence : 'low',
    secondaryTopics: secondaryTopics.filter((label) =>
      TOPIC_LABELS.includes(label as (typeof TOPIC_LABELS)[number]),
    ),
  }
}

/** Transcript empty — classification rests on summary/subject only. */
export function applyEmptyTranscriptConfidenceCap(
  conversation: StoredConversation,
  classification: TopicClassification,
): TopicClassification {
  if (!conversation.transcript?.trim()) {
    return { ...classification, topicConfidence: 'low' }
  }
  return classification
}

export function applySecurityOverride(
  conversation: StoredConversation,
  classification: TopicClassification,
): TopicClassification {
  if (!isSecurityIncidentResponse(conversation)) {
    return classification
  }

  return {
    topic: TOPIC_SECURITY,
    secondaryTopics: classification.secondaryTopics.filter((t) => t !== TOPIC_SECURITY),
    topicConfidence: 'high',
    isSupportTicket: true,
    classifiedBy: classification.classifiedBy ?? 'rule',
  }
}

async function requestClassification(
  conversation: StoredConversation,
  apiKey: string,
): Promise<ClassifyResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(await buildClassifyBatchRequest(conversation)),
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
    throw new Error('Gemini returned an empty classification')
  }

  const raw = JSON.parse(text) as RawClassification
  const normalized = normalizeClassification(raw)
  const validated = validateClassification(normalized)
  const secured = applySecurityOverride(conversation, validated)
  return {
    classification: applyEmptyTranscriptConfidenceCap(conversation, secured),
    usage: extractUsageMetadata(data),
  }
}

export async function classifyConversationTopics(
  conversation: StoredConversation,
  apiKey: string,
): Promise<ClassifyResult> {
  const ruleResult = classifyByRules(conversation)
  if (ruleResult) {
    return {
      classification: applyEmptyTranscriptConfidenceCap(conversation, ruleResult),
      usage: null,
    }
  }

  const retryableStatuses = new Set([429, 500, 503, 504])
  const maxAttempts = 4

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestClassification(conversation, apiKey)
    } catch (error) {
      const status = (error as Error & { status?: number }).status
      const isLastAttempt = attempt === maxAttempts
      if (!status || !retryableStatuses.has(status) || isLastAttempt) {
        throw error
      }
      await delay(1000 * attempt)
    }
  }

  throw new Error('Gemini classification failed after retries')
}

export function applyClassification(
  conversation: StoredConversation,
  classification: TopicClassification,
): StoredConversation {
  return applyTopicCategories({
    ...conversation,
    topic: classification.topic,
    secondaryTopics:
      classification.secondaryTopics.length > 0
        ? classification.secondaryTopics
        : undefined,
    topicConfidence: classification.topicConfidence,
    isSupportTicket: classification.isSupportTicket,
  })
}
