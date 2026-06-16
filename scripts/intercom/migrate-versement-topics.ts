#!/usr/bin/env node
/**
 * Migrates deprecated topic "Versement non visible / retard" into
 * "Versements et prélèvements" and normalizes redundant secondaryTopics.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { applyTopicCategories } from './topic-categories.ts'
import { TOPIC_LABELS } from './taxonomy-labels.ts'
import { CONVERSATIONS_DIR, writeStoredConversation } from './storage.ts'
import type { StoredConversation } from './types.ts'

const DEPRECATED = 'Versement non visible / retard'
const TARGET = 'Versements et prélèvements'

/** Promote Versements to primary when it was secondary and versement is the clear initial need. */
const PROMOTE_VERSEMENTS_PRIMARY = new Set([
  '215474636233059', // wrong initial deposit amount
])

/** Keep current primary; only drop redundant Versements secondary. */
const DROP_VERSEMENTS_SECONDARY_ONLY = new Set([
  '215469940979748', // livret opening; versements are part of opening flow
])

function normalizeSecondaries(
  topic: string,
  secondaries: string[] | undefined,
): string[] | undefined {
  const filtered = (secondaries ?? []).filter(
    (label) => label !== topic && TOPIC_LABELS.includes(label as (typeof TOPIC_LABELS)[number]),
  )
  return filtered.length > 0 ? filtered : undefined
}

function migrateConversation(conversation: StoredConversation): StoredConversation | null {
  let topic = conversation.topic ?? ''
  let secondaries = conversation.secondaryTopics ?? []
  let changed = false

  if (topic === DEPRECATED) {
    topic = TARGET
    changed = true
  }

  if (PROMOTE_VERSEMENTS_PRIMARY.has(conversation.id)) {
    if (secondaries.includes(TARGET)) {
      topic = TARGET
      secondaries = secondaries.filter((label) => label !== TARGET)
      changed = true
    }
  } else if (DROP_VERSEMENTS_SECONDARY_ONLY.has(conversation.id)) {
    if (secondaries.includes(TARGET)) {
      secondaries = secondaries.filter((label) => label !== TARGET)
      changed = true
    }
  } else if (secondaries.includes(TARGET) && topic !== TARGET) {
    // Versements listed as secondary but primary is not the merged Transactions label.
    topic = TARGET
    secondaries = secondaries.filter((label) => label !== TARGET)
    changed = true
  }

  const normalizedSecondaries = normalizeSecondaries(topic, secondaries)
  const beforeSecondaries = (conversation.secondaryTopics ?? []).join('|')
  const afterSecondaries = (normalizedSecondaries ?? []).join('|')

  if (beforeSecondaries !== afterSecondaries) {
    changed = true
  }

  if (!changed) {
    return null
  }

  return applyTopicCategories({
    ...conversation,
    topic,
    secondaryTopics: normalizedSecondaries,
  })
}

async function main(): Promise<void> {
  const files = (await readdir(CONVERSATIONS_DIR)).filter((name) => name.endsWith('.json'))
  let updated = 0

  for (const file of files) {
    const conversation = JSON.parse(
      await readFile(path.join(CONVERSATIONS_DIR, file), 'utf8'),
    ) as StoredConversation

    const migrated = migrateConversation(conversation)
    if (!migrated) continue

    await writeStoredConversation(migrated)
    updated += 1
    console.log(`${conversation.id}: ${conversation.topic} → ${migrated.topic}`)
  }

  console.log(`Done. Updated ${updated} conversations.`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
