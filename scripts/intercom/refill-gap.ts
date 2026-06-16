#!/usr/bin/env node
/**
 * Prune out-of-range exports, search the gap below a cutoff, sense-check dates,
 * then export (fetch + summarize + classify) only if validation passes.
 *
 * Usage:
 *   npm run intercom:refill-gap -- --before 2026-05-07T00:00:00.000Z --limit 803
 *   npm run intercom:refill-gap -- --before 2026-05-07T00:00:00.000Z --limit 803 --validate-only
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './load-env.ts'
import { pickMostRecentByCreatedAt, searchOlderConversationHits } from './search-ids.ts'
import {
  loadContinuationAnchor,
  loadExistingIds,
  pruneConversationsBefore,
} from './storage.ts'
import {
  formatSenseCheckReport,
  isoToUnix,
  senseCheckSearchHits,
} from './validate-export-dates.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DEFAULT_IDS_PATH = path.join(ROOT, 'data/intercom/export-ids.json')
const DEFAULT_NOT_BEFORE = '2026-01-01T00:00:00.000Z'

function parseArg(args: string[], flag: string): string {
  const index = args.indexOf(flag)
  if (index === -1) {
    throw new Error(`${flag} is required`)
  }
  const value = args[index + 1]?.trim()
  if (!value) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

function parseLimit(args: string[]): number {
  const index = args.indexOf('--limit')
  if (index === -1) {
    throw new Error('--limit is required')
  }
  const value = Number.parseInt(args[index + 1] ?? '', 10)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('--limit must be a positive integer')
  }
  return value
}

async function main(): Promise<void> {
  await loadEnvFile()

  const args = process.argv.slice(2)
  const beforeExclusiveIso = parseArg(args, '--before')
  const limit = parseLimit(args)
  const notBeforeInclusiveIso =
    args.includes('--not-before')
      ? parseArg(args, '--not-before')
      : DEFAULT_NOT_BEFORE
  const validateOnly = args.includes('--validate-only')
  const skipPrune = args.includes('--skip-prune')

  const token = process.env.INTERCOM_ACCESS_TOKEN?.trim()
  if (!token) {
    console.error('INTERCOM_ACCESS_TOKEN is required.')
    process.exit(1)
  }

  if (!skipPrune) {
    const pruned = await pruneConversationsBefore(beforeExclusiveIso)
    console.log(
      `Pruned ${pruned.removedIds.length} conversations before ${beforeExclusiveIso}. Kept ${pruned.kept}.`,
    )
  }

  const anchorIso = await loadContinuationAnchor()
  if (!anchorIso) {
    throw new Error('No continuation anchor found in manifest after prune')
  }

  const existingIds = await loadExistingIds()
  const beforeCreatedAtUnix = isoToUnix(anchorIso)

  console.log(
    `Searching for ${limit} closed conversations older than ${anchorIso}...`,
  )

  const hits = await searchOlderConversationHits(token, {
    beforeCreatedAtUnix,
    limit,
    excludeIds: existingIds,
  })

  const selectedIds = pickMostRecentByCreatedAt(hits, limit, 0, existingIds)
  const selectedIdSet = new Set(selectedIds)
  const selectedHits = hits.filter((hit) => selectedIdSet.has(String(hit.id)))

  const senseCheck = senseCheckSearchHits(selectedHits, {
    beforeExclusiveIso: anchorIso,
    notBeforeInclusiveIso,
    expectedCount: limit,
  })

  console.log(formatSenseCheckReport(senseCheck))

  await writeFile(DEFAULT_IDS_PATH, `${JSON.stringify(selectedIds, null, 2)}\n`)

  if (!senseCheck.ok) {
    console.error('Date sense check failed — aborting before export pipeline.')
    process.exit(1)
  }

  if (validateOnly) {
    console.log('Validation passed. IDs saved to export-ids.json (--validate-only, no export).')
    return
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiKey) {
    console.error('GEMINI_API_KEY is required for export.')
    process.exit(1)
  }

  const { spawn } = await import('node:child_process')
  const exportArgs = [
    'tsx',
    'scripts/intercom/fetch-export.ts',
    DEFAULT_IDS_PATH,
    '--concurrency',
    '10',
    '--batch',
  ]

  await new Promise<void>((resolve, reject) => {
    const child = spawn('npx', exportArgs, {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`fetch-export exited with code ${code}`))
    })
  })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
