#!/usr/bin/env node
/**
 * Prune manifest entries and conversation files before a date cutoff.
 *
 * Usage:
 *   npm run intercom:prune-before -- --before 2026-05-07T00:00:00.000Z
 *   npm run intercom:prune-before -- --before 2026-05-07T00:00:00.000Z --dry-run
 */
import { loadEnvFile } from './load-env.ts'
import { pruneConversationsBefore } from './storage.ts'

function parseBefore(args: string[]): string {
  const index = args.indexOf('--before')
  if (index === -1) {
    throw new Error('--before <iso-date> is required')
  }
  const value = args[index + 1]?.trim()
  if (!value) {
    throw new Error('--before requires an ISO date value')
  }
  return value
}

async function main(): Promise<void> {
  await loadEnvFile()

  const args = process.argv.slice(2)
  const beforeExclusiveIso = parseBefore(args)
  const dryRun = args.includes('--dry-run')

  if (dryRun) {
    const { loadManifestEntries } = await import('./storage.ts')
    const entries = await loadManifestEntries()
    const removed = entries.filter((entry) => entry.createdAt < beforeExclusiveIso)
    console.log(
      `Dry run: would remove ${removed.length} conversations before ${beforeExclusiveIso}`,
    )
    console.log(`Would keep ${entries.length - removed.length}`)
    return
  }

  const result = await pruneConversationsBefore(beforeExclusiveIso)
  console.log(
    `Removed ${result.removedIds.length} conversations before ${beforeExclusiveIso}. Kept ${result.kept}.`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
