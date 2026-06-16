#!/usr/bin/env node
/**
 * Tags security-incident response conversations with topic: "Sécurité".
 *
 * Usage:
 *   npm run intercom:tag-security-incident
 */
import { readdir, readFile } from 'node:fs/promises'
import { loadEnvFile } from './load-env.ts'
import { applyTopicCategories, needsTopicCategory } from './topic-categories.ts'
import { isSecurityIncidentResponse, TOPIC_SECURITY } from './topics.ts'
import { CONVERSATIONS_DIR, writeStoredConversation } from './storage.ts'
import type { StoredConversation } from './types.ts'

async function main(): Promise<void> {
  await loadEnvFile()

  const files = (await readdir(CONVERSATIONS_DIR)).filter((name) => name.endsWith('.json'))

  let tagged = 0
  let retagged = 0
  let alreadyTagged = 0
  let skipped = 0

  for (const file of files) {
    const conversation = JSON.parse(
      await readFile(`${CONVERSATIONS_DIR}/${file}`, 'utf8'),
    ) as StoredConversation

    if (!isSecurityIncidentResponse(conversation)) {
      skipped += 1
      continue
    }

    if (conversation.topic === TOPIC_SECURITY) {
      if (needsTopicCategory(conversation)) {
        await writeStoredConversation(applyTopicCategories(conversation))
        retagged += 1
      } else {
        alreadyTagged += 1
      }
      continue
    }

    const previousTopic = conversation.topic
    const updated = applyTopicCategories({
      ...conversation,
      topic: TOPIC_SECURITY,
      topicConfidence: 'high',
      isSupportTicket: true,
    })
    await writeStoredConversation(updated)

    if (previousTopic) {
      retagged += 1
    } else {
      tagged += 1
    }
  }

  console.log(
    `Done. Newly tagged ${tagged}, retagged from another topic ${retagged}, already "${TOPIC_SECURITY}" ${alreadyTagged}, skipped ${skipped}`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
