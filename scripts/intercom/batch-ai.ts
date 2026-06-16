/**
 * Batch Gemini summarization + classification for export pipelines.
 */
import { buildSummarizeBatchRequest, SUMMARIZE_MODEL } from './summarize.ts'
import {
  applyEmptyTranscriptConfidenceCap,
  applySecurityOverride,
  buildClassifyBatchRequest,
  CLASSIFY_MODEL,
  normalizeClassification,
  validateClassification,
} from './topic-classify.ts'
import { classifyByRules, shouldSkipSummarization } from './topic-rules.ts'
import { runBatchJob, type BatchRequestItem } from './gemini-batch.ts'
import type { StoredConversation, TopicClassification } from './types.ts'

interface RawClassification {
  topic?: string
  secondaryTopics?: string[]
  topicConfidence?: string
  isSupportTicket?: boolean
}

function summarizeKey(id: string): string {
  return `${id}::summarize`
}

function classifyKey(id: string): string {
  return `${id}::classify`
}

export async function batchSummarizeConversations(
  conversations: StoredConversation[],
  apiKey: string,
  displayName: string,
): Promise<Map<string, string>> {
  const pending = conversations.filter((c) => !shouldSkipSummarization(c))
  if (pending.length === 0) {
    return new Map()
  }

  const items: BatchRequestItem[] = pending.map((conversation) => ({
    key: summarizeKey(conversation.id),
    request: buildSummarizeBatchRequest(conversation),
  }))

  const results = await runBatchJob(SUMMARIZE_MODEL, items, displayName, apiKey, {
    onPoll: (status) => console.log(`  Summarize batch state: ${status.state}`),
  })

  const summaries = new Map<string, string>()
  for (const conversation of pending) {
    const key = summarizeKey(conversation.id)
    const result = results.get(key)
    if (!result?.text) {
      throw new Error(
        `Batch summarize failed for ${conversation.id}: ${result?.error ?? 'missing result'}`,
      )
    }
    summaries.set(conversation.id, result.text)
  }

  return summaries
}

export async function batchClassifyConversations(
  conversations: StoredConversation[],
  apiKey: string,
  displayName: string,
): Promise<Map<string, TopicClassification>> {
  const pending = conversations.filter((conversation) => !classifyByRules(conversation))
  if (pending.length === 0) {
    return new Map()
  }

  const items: BatchRequestItem[] = []
  for (const conversation of pending) {
    items.push({
      key: classifyKey(conversation.id),
      request: await buildClassifyBatchRequest(conversation),
    })
  }

  const results = await runBatchJob(CLASSIFY_MODEL, items, displayName, apiKey, {
    onPoll: (status) => console.log(`  Classify batch state: ${status.state}`),
  })

  const classifications = new Map<string, TopicClassification>()
  for (const conversation of pending) {
    const key = classifyKey(conversation.id)
    const result = results.get(key)
    if (!result?.text) {
      throw new Error(
        `Batch classify failed for ${conversation.id}: ${result?.error ?? 'missing result'}`,
      )
    }

    const raw = JSON.parse(result.text) as RawClassification
    const normalized = normalizeClassification(raw)
    const validated = validateClassification(normalized)
    const secured = applySecurityOverride(conversation, validated)
    const capped = applyEmptyTranscriptConfidenceCap(conversation, secured)
    classifications.set(conversation.id, capped)
  }

  return classifications
}

export function resolveRuleOrBatchClassification(
  conversation: StoredConversation,
  batchClassifications: Map<string, TopicClassification>,
): TopicClassification {
  const ruleResult = classifyByRules(conversation)
  if (ruleResult) {
    return applyEmptyTranscriptConfidenceCap(conversation, ruleResult)
  }

  const batchResult = batchClassifications.get(conversation.id)
  if (!batchResult) {
    throw new Error(`Missing batch classification for ${conversation.id}`)
  }

  return batchResult
}
