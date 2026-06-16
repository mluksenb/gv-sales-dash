#!/usr/bin/env node
/**
 * Fetches conversations from Intercom REST API, normalizes, summarizes, and writes files.
 * Reads INTERCOM_ACCESS_TOKEN and GEMINI_API_KEY from .env or the environment.
 *
 * Known IDs (in manifest.jsonl) are fully skipped — no fetch, transform, or summarize.
 *
 * Usage:
 *   npm run intercom:export
 *   npm run intercom:export -- --search
 *   npm run intercom:export -- --search --offset 200
 *   npm run intercom:export -- --search --offset 603 --limit 600 --concurrency 10
 *   npm run intercom:export -- --continue --limit 600 --batch
 *   npm run intercom:export -- data/intercom/export-ids.json
 */
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runWithConcurrency } from './concurrency.ts'
import {
  batchClassifyConversations,
  batchSummarizeConversations,
  resolveRuleOrBatchClassification,
} from './batch-ai.ts'
import { loadEnvFile } from './load-env.ts'
import { normalizeConversation } from './normalize.ts'
import {
  DEFAULT_RECENT_LIMIT,
  pickMostRecentByCreatedAt,
  searchOlderConversationHits,
  searchRecentConversationIds,
} from './search-ids.ts'
import { applyClassification, classifyConversationTopics } from './topic-classify.ts'
import { classifyByRules, shouldSkipSummarization } from './topic-rules.ts'
import { summarizeConversation } from './summarize.ts'
import {
  addUsageTotals,
  createUsageTotals,
  logUsageTotals,
  type GeminiUsageTotals,
} from './gemini-usage.ts'
import {
  formatSenseCheckReport,
  isoToUnix,
  senseCheckSearchHits,
} from './validate-export-dates.ts'
import {
  CONVERSATIONS_DIR,
  MANIFEST_PATH,
  loadContinuationAnchor,
  loadExistingIds,
  writeStoredConversation,
} from './storage.ts'
import type { ManifestEntry, RawIntercomConversation, StoredConversation } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DEFAULT_IDS_PATH = path.join(ROOT, 'data/intercom/export-ids.json')
const DEFAULT_CONCURRENCY = 10
const DEFAULT_NOT_BEFORE = '2026-01-01T00:00:00.000Z'

const INTERCOM_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'Intercom-Version': '2.11',
} as const

function authHeaders(token: string): Record<string, string> {
  return {
    ...INTERCOM_HEADERS,
    Authorization: `Bearer ${token}`,
  }
}

async function fetchConversation(
  token: string,
  id: string,
): Promise<RawIntercomConversation> {
  const response = await fetch(`https://api.intercom.io/conversations/${id}`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${id}: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as RawIntercomConversation
}

function parseOffset(args: string[]): number {
  const index = args.indexOf('--offset')
  if (index === -1) return 0
  const value = Number.parseInt(args[index + 1] ?? '', 10)
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function parseLimit(args: string[]): number {
  const index = args.indexOf('--limit')
  if (index === -1) return DEFAULT_RECENT_LIMIT
  const value = Number.parseInt(args[index + 1] ?? '', 10)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_RECENT_LIMIT
}

function parseConcurrency(args: string[]): number {
  const index = args.indexOf('--concurrency')
  if (index === -1) return DEFAULT_CONCURRENCY
  const value = Number.parseInt(args[index + 1] ?? '', 10)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CONCURRENCY
}

function parseNotBefore(args: string[]): string | undefined {
  const index = args.indexOf('--not-before')
  if (index === -1) return undefined
  const value = args[index + 1]?.trim()
  return value || undefined
}

async function resolveIds(token: string, args: string[]): Promise<string[]> {
  if (args.includes('--continue')) {
    const limit = parseLimit(args)
    const anchorIso = await loadContinuationAnchor()

    if (!anchorIso) {
      throw new Error('--continue requires an existing manifest.jsonl with exported conversations')
    }

    const existingIds = await loadExistingIds()
    const beforeCreatedAtUnix = isoToUnix(anchorIso)
    const notBeforeInclusiveIso = parseNotBefore(args) ?? DEFAULT_NOT_BEFORE

    console.log(
      `Searching for ${limit} closed conversations older than ${anchorIso} (continuation anchor)...`,
    )

    const hits = await searchOlderConversationHits(token, {
      beforeCreatedAtUnix,
      limit,
      excludeIds: existingIds,
    })

    const ids = pickMostRecentByCreatedAt(hits, limit, 0, existingIds)
    const selectedIdSet = new Set(ids)
    const selectedHits = hits.filter((hit) => selectedIdSet.has(String(hit.id)))

    const senseCheck = senseCheckSearchHits(selectedHits, {
      beforeExclusiveIso: anchorIso,
      notBeforeInclusiveIso,
      expectedCount: limit,
    })

    console.log(formatSenseCheckReport(senseCheck))
    await writeFile(DEFAULT_IDS_PATH, `${JSON.stringify(ids, null, 2)}\n`)

    if (!senseCheck.ok) {
      throw new Error('Date sense check failed — aborting before export pipeline')
    }

    if (args.includes('--validate-only')) {
      console.log('Validation passed. IDs saved (--validate-only, no export).')
      process.exit(0)
    }

    console.log(`Found ${ids.length} conversation IDs`)
    return ids
  }

  if (args.includes('--search')) {
    const offset = parseOffset(args)
    const limit = parseLimit(args)
    const rankEnd = offset + limit
    const rankLabel =
      offset === 0 ? `1–${limit}` : `${offset + 1}–${rankEnd}`
    console.log(
      `Searching Intercom for closed conversations ranked ${rankLabel} by created_at (all channels)...`,
    )
    const ids = await searchRecentConversationIds(token, {
      limit,
      offset,
    })
    await writeFile(DEFAULT_IDS_PATH, `${JSON.stringify(ids, null, 2)}\n`)
    console.log(`Found ${ids.length} conversation IDs`)
    return ids
  }

  const idsArg = args.find((arg) => !arg.startsWith('--'))
  const idsPath = idsArg ?? DEFAULT_IDS_PATH
  return JSON.parse(await readFile(idsPath, 'utf8')) as string[]
}

async function appendManifest(normalized: {
  id: string
  medium: ManifestEntry['medium']
  resolution: ManifestEntry['resolution']
  createdAt: string
  lastMessageAt: string
}): Promise<void> {
  const manifestEntry: ManifestEntry = {
    id: normalized.id,
    medium: normalized.medium,
    resolution: normalized.resolution,
    createdAt: normalized.createdAt,
    lastMessageAt: normalized.lastMessageAt,
    exportedAt: new Date().toISOString(),
  }
  await appendFile(MANIFEST_PATH, `${JSON.stringify(manifestEntry)}\n`)
}

async function fetchAndNormalize(
  token: string,
  id: string,
): Promise<StoredConversation> {
  const raw = await fetchConversation(token, id)
  return normalizeConversation(raw)
}

async function exportConversation(
  token: string,
  geminiKey: string,
  id: string,
  usageTotals?: { summarize: GeminiUsageTotals; classify: GeminiUsageTotals },
): Promise<StoredConversation> {
  const normalized = await fetchAndNormalize(token, id)
  const ruleResult = classifyByRules(normalized)

  if (!shouldSkipSummarization(normalized)) {
    const { summary, usage } = await summarizeConversation(normalized, geminiKey)
    normalized.issueSummary = summary
    if (usageTotals) {
      addUsageTotals(usageTotals.summarize, usage)
    }
  }

  const classificationResult = ruleResult
    ? { classification: ruleResult, usage: null }
    : await classifyConversationTopics(normalized, geminiKey)

  if (usageTotals) {
    addUsageTotals(usageTotals.classify, classificationResult.usage)
  }

  return applyClassification(normalized, classificationResult.classification)
}

async function exportBatch(
  token: string,
  geminiKey: string,
  pendingIds: string[],
  concurrency: number,
): Promise<{ written: number; failed: number }> {
  const byId = new Map<string, StoredConversation>()
  let failed = 0

  console.log(`Fetching ${pendingIds.length} conversations from Intercom...`)
  await runWithConcurrency(pendingIds, concurrency, async (id) => {
    try {
      byId.set(id, await fetchAndNormalize(token, id))
    } catch (error) {
      failed += 1
      console.error(`Error fetching ${id}:`, error)
    }
  })

  const conversations = pendingIds
    .map((id) => byId.get(id))
    .filter((conversation): conversation is StoredConversation => conversation != null)

  if (conversations.length === 0) {
    return { written: 0, failed }
  }

  const batchSuffix = new Date().toISOString().replace(/[:.]/g, '-')
  console.log(
    `Submitting Gemini batch jobs for ${conversations.length} conversations (50% cheaper, async)...`,
  )

  const summaries = await batchSummarizeConversations(
    conversations,
    geminiKey,
    `intercom-summarize-${batchSuffix}`,
  )

  for (const conversation of conversations) {
    const summary = summaries.get(conversation.id)
    if (summary) {
      conversation.issueSummary = summary
    }
  }

  const classifications = await batchClassifyConversations(
    conversations,
    geminiKey,
    `intercom-classify-${batchSuffix}`,
  )

  let written = 0
  for (const conversation of conversations) {
    try {
      const classification = resolveRuleOrBatchClassification(
        conversation,
        classifications,
      )
      const classified = applyClassification(conversation, classification)
      await writeStoredConversation(classified)
      await appendManifest(classified)
      written += 1

      if (written % 10 === 0) {
        console.log(`Wrote ${written} conversations...`)
      }
    } catch (error) {
      failed += 1
      console.error(`Error writing ${conversation.id}:`, error)
    }
  }

  return { written, failed }
}

async function main(): Promise<void> {
  await loadEnvFile()

  const args = process.argv.slice(2)
  const concurrency = parseConcurrency(args)
  const useBatch = args.includes('--batch')

  const token = process.env.INTERCOM_ACCESS_TOKEN?.trim()
  if (!token) {
    console.error(
      'INTERCOM_ACCESS_TOKEN is required. Add it to .env (see .env.example).',
    )
    process.exit(1)
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiKey) {
    console.error('GEMINI_API_KEY is required. Add it to .env (see .env.example).')
    process.exit(1)
  }

  const ids = await resolveIds(token, args)

  await mkdir(CONVERSATIONS_DIR, { recursive: true })
  const existingIds = await loadExistingIds()

  const pendingIds = ids.filter((id) => !existingIds.has(id))
  const skipped = ids.length - pendingIds.length

  console.log(
    `Processing ${pendingIds.length} conversations (${skipped} already exported), concurrency ${concurrency}${useBatch ? ', Gemini batch API' : ''}...`,
  )

  if (useBatch) {
    const { written, failed } = await exportBatch(
      token,
      geminiKey,
      pendingIds,
      concurrency,
    )
    console.log(`Done. Wrote ${written}, skipped ${skipped}, failed ${failed}`)
    return
  }

  let written = 0
  let failed = 0
  const summarizeUsage = createUsageTotals()
  const classifyUsage = createUsageTotals()

  await runWithConcurrency(pendingIds, concurrency, async (id) => {
    try {
      const classified = await exportConversation(token, geminiKey, id, {
        summarize: summarizeUsage,
        classify: classifyUsage,
      })
      await writeStoredConversation(classified)
      await appendManifest(classified)
      existingIds.add(classified.id)
      written += 1

      if (written % 10 === 0) {
        console.log(`Exported ${written} conversations...`)
      }
    } catch (error) {
      failed += 1
      console.error(`Error processing ${id}:`, error)
    }
  })

  logUsageTotals('inline summarize', summarizeUsage)
  logUsageTotals('inline classify', classifyUsage)
  console.log(`Done. Wrote ${written}, skipped ${skipped}, failed ${failed}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
