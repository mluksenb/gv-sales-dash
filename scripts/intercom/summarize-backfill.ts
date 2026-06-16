#!/usr/bin/env node
/**
 * Backfills issueSummary only where it is missing (Gemini Batch API — 50% cheaper).
 *
 * Skips files that already have issueSummary. When the summarization prompt
 * changes, do NOT wipe existing summaries and rerun this script — that wastes
 * Gemini tokens. The current prompt applies only to new exports (fetch-export)
 * and any conversation still missing issueSummary.
 *
 * Usage:
 *   npm run intercom:summarize-backfill
 *   npm run intercom:summarize-backfill -- --inline   # real-time API (full price)
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { batchSummarizeConversations } from './batch-ai.ts'
import { loadEnvFile } from './load-env.ts'
import {
  addUsageTotals,
  createUsageTotals,
  logUsageTotals,
} from './gemini-usage.ts'
import { delay, summarizeConversation } from './summarize.ts'
import { shouldSkipSummarization } from './topic-rules.ts'
import { CONVERSATIONS_DIR, writeStoredConversation } from './storage.ts'
import type { StoredConversation } from './types.ts'

async function loadPendingSummaries(): Promise<{
  pending: StoredConversation[]
  skipped: number
}> {
  const files = (await readdir(CONVERSATIONS_DIR)).filter((name) => name.endsWith('.json'))
  const pending: StoredConversation[] = []
  let skipped = 0

  for (const file of files) {
    const conversation = JSON.parse(
      await readFile(path.join(CONVERSATIONS_DIR, file), 'utf8'),
    ) as StoredConversation

    if (conversation.issueSummary?.trim() || shouldSkipSummarization(conversation)) {
      skipped += 1
      continue
    }

    pending.push(conversation)
  }

  return { pending, skipped }
}

async function backfillInline(
  pending: StoredConversation[],
  geminiKey: string,
): Promise<{ summarized: number; failed: number }> {
  let summarized = 0
  let failed = 0
  const usageTotals = createUsageTotals()

  for (const conversation of pending) {
    try {
      const { summary, usage } = await summarizeConversation(conversation, geminiKey)
      addUsageTotals(usageTotals, usage)
      conversation.issueSummary = summary
      await writeStoredConversation(conversation)
      summarized += 1

      if (summarized % 10 === 0) {
        console.log(`Summarized ${summarized} conversations...`)
      }

      await delay(200)
    } catch (error) {
      failed += 1
      console.error(`Error summarizing ${conversation.id}:`, error)
    }
  }

  logUsageTotals('summarize-backfill inline', usageTotals)
  return { summarized, failed }
}

async function backfillBatch(
  pending: StoredConversation[],
  geminiKey: string,
): Promise<{ summarized: number; failed: number }> {
  if (pending.length === 0) {
    return { summarized: 0, failed: 0 }
  }

  const batchSuffix = new Date().toISOString().replace(/[:.]/g, '-')
  console.log(`Submitting summarize batch for ${pending.length} conversations...`)

  const summaries = await batchSummarizeConversations(
    pending,
    geminiKey,
    `intercom-summarize-backfill-${batchSuffix}`,
  )

  let summarized = 0
  let failed = 0

  for (const conversation of pending) {
    const summary = summaries.get(conversation.id)
    if (!summary) {
      failed += 1
      console.error(`Missing batch summary for ${conversation.id}`)
      continue
    }

    try {
      conversation.issueSummary = summary
      await writeStoredConversation(conversation)
      summarized += 1
    } catch (error) {
      failed += 1
      console.error(`Error writing ${conversation.id}:`, error)
    }
  }

  return { summarized, failed }
}

async function main(): Promise<void> {
  await loadEnvFile()

  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiKey) {
    console.error('GEMINI_API_KEY is required. Add it to .env (see .env.example).')
    process.exit(1)
  }

  const useInline = process.argv.includes('--inline')
  const { pending, skipped } = await loadPendingSummaries()

  console.log(
    `${pending.length} conversations need summaries (${skipped} skipped), ${useInline ? 'inline' : 'batch'} mode`,
  )

  const { summarized, failed } = useInline
    ? await backfillInline(pending, geminiKey)
    : await backfillBatch(pending, geminiKey)

  console.log(`Done. Summarized ${summarized}, skipped ${skipped}, failed ${failed}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
