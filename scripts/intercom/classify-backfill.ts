#!/usr/bin/env node
/**
 * Backfills topic classification only where fields are missing (Gemini Batch API).
 *
 * Skips files that already have topic, topicConfidence, and isSupportTicket.
 * When the classification prompt changes, do NOT wipe existing values and rerun
 * in bulk — that wastes Gemini tokens.
 *
 * Usage:
 *   npm run intercom:classify-backfill
 *   npm run intercom:classify-backfill -- --inline   # real-time API (full price)
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  batchClassifyConversations,
  resolveRuleOrBatchClassification,
} from './batch-ai.ts'
import { applyClassification, classifyConversationTopics } from './topic-classify.ts'
import { applyTopicCategories } from './topic-categories.ts'
import { classifyByRules } from './topic-rules.ts'
import {
  addUsageTotals,
  createUsageTotals,
  logUsageTotals,
} from './gemini-usage.ts'
import { delay } from './summarize.ts'
import { loadEnvFile } from './load-env.ts'
import { CONVERSATIONS_DIR, writeStoredConversation } from './storage.ts'
import type { StoredConversation } from './types.ts'

function needsClassification(conversation: StoredConversation): boolean {
  return (
    !conversation.topic?.trim() ||
    conversation.topicConfidence === undefined ||
    conversation.isSupportTicket === undefined
  )
}

async function loadPendingClassifications(): Promise<{
  ruleOrMetadata: Array<{ conversation: StoredConversation; updated: StoredConversation }>
  geminiPending: StoredConversation[]
  skipped: number
}> {
  const files = (await readdir(CONVERSATIONS_DIR)).filter((name) => name.endsWith('.json'))
  const ruleOrMetadata: Array<{
    conversation: StoredConversation
    updated: StoredConversation
  }> = []
  const geminiPending: StoredConversation[] = []
  let skipped = 0

  for (const file of files) {
    const conversation = JSON.parse(
      await readFile(path.join(CONVERSATIONS_DIR, file), 'utf8'),
    ) as StoredConversation

    if (!needsClassification(conversation)) {
      skipped += 1
      continue
    }

    const ruleResult = classifyByRules(conversation)

    if (ruleResult) {
      ruleOrMetadata.push({
        conversation,
        updated: applyClassification(conversation, ruleResult),
      })
      continue
    }

    if (!conversation.issueSummary?.trim()) {
      console.warn(`Skipping ${conversation.id}: missing issueSummary`)
      skipped += 1
      continue
    }

    if (conversation.topic?.trim()) {
      ruleOrMetadata.push({
        conversation,
        updated: applyTopicCategories({
          ...conversation,
          topicConfidence: conversation.topicConfidence ?? 'medium',
          isSupportTicket: conversation.isSupportTicket ?? true,
        }),
      })
      continue
    }

    geminiPending.push(conversation)
  }

  return { ruleOrMetadata, geminiPending, skipped }
}

async function backfillInline(
  geminiPending: StoredConversation[],
  geminiKey: string,
): Promise<{ geminiClassified: number; failed: number }> {
  let geminiClassified = 0
  let failed = 0
  const usageTotals = createUsageTotals()

  for (const conversation of geminiPending) {
    try {
      const { classification, usage } = await classifyConversationTopics(
        conversation,
        geminiKey,
      )
      addUsageTotals(usageTotals, usage)
      const updated = applyClassification(conversation, classification)
      await writeStoredConversation(updated)
      geminiClassified += 1

      if (geminiClassified % 10 === 0) {
        console.log(`Classified ${geminiClassified} conversations (inline)...`)
      }

      await delay(200)
    } catch (error) {
      failed += 1
      console.error(`Error classifying ${conversation.id}:`, error)
    }
  }

  logUsageTotals('classify-backfill inline', usageTotals)
  return { geminiClassified, failed }
}

async function backfillBatch(
  geminiPending: StoredConversation[],
  geminiKey: string,
): Promise<{ geminiClassified: number; failed: number }> {
  if (geminiPending.length === 0) {
    return { geminiClassified: 0, failed: 0 }
  }

  const batchSuffix = new Date().toISOString().replace(/[:.]/g, '-')
  console.log(`Submitting classify batch for ${geminiPending.length} conversations...`)

  const classifications = await batchClassifyConversations(
    geminiPending,
    geminiKey,
    `intercom-classify-backfill-${batchSuffix}`,
  )

  let geminiClassified = 0
  let failed = 0

  for (const conversation of geminiPending) {
    try {
      const classification = resolveRuleOrBatchClassification(
        conversation,
        classifications,
      )
      const updated = applyClassification(conversation, classification)
      await writeStoredConversation(updated)
      geminiClassified += 1
    } catch (error) {
      failed += 1
      console.error(`Error classifying ${conversation.id}:`, error)
    }
  }

  return { geminiClassified, failed }
}

async function main(): Promise<void> {
  await loadEnvFile()

  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiKey) {
    console.error('GEMINI_API_KEY is required. Add it to .env (see .env.example).')
    process.exit(1)
  }

  const useInline = process.argv.includes('--inline')
  const { ruleOrMetadata, geminiPending, skipped } = await loadPendingClassifications()

  for (const { updated } of ruleOrMetadata) {
    await writeStoredConversation(updated)
  }

  const ruleClassified = ruleOrMetadata.length
  console.log(
    `${geminiPending.length} conversations need Gemini classification (${ruleClassified} by rules/metadata, ${skipped} skipped), ${useInline ? 'inline' : 'batch'} mode`,
  )

  const { geminiClassified, failed } = useInline
    ? await backfillInline(geminiPending, geminiKey)
    : await backfillBatch(geminiPending, geminiKey)

  const classified = ruleClassified + geminiClassified
  console.log(
    `Done. Classified ${classified} (${ruleClassified} by rules/metadata, ${geminiClassified} by Gemini), skipped ${skipped}, failed ${failed}`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
