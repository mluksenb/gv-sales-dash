#!/usr/bin/env node
/**
 * Backfills topicCategory / secondaryTopicCategories from topic labels.
 * No Gemini — deterministic mapping from taxonomy-labels.ts.
 *
 * Usage:
 *   npm run intercom:backfill-topic-categories
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { applyTopicCategories, needsTopicCategory } from './topic-categories.ts'
import { CONVERSATIONS_DIR, writeStoredConversation } from './storage.ts'
import type { StoredConversation } from './types.ts'

async function main(): Promise<void> {
  const files = (await readdir(CONVERSATIONS_DIR)).filter((name) => name.endsWith('.json'))

  let updated = 0
  let skipped = 0

  for (const file of files) {
    const conversation = JSON.parse(
      await readFile(path.join(CONVERSATIONS_DIR, file), 'utf8'),
    ) as StoredConversation

    if (!needsTopicCategory(conversation)) {
      skipped += 1
      continue
    }

    await writeStoredConversation(applyTopicCategories(conversation))
    updated += 1
  }

  console.log(`Done. Updated ${updated} conversations, skipped ${skipped} (already correct or no topic).`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
