#!/usr/bin/env node
/**
 * One-off corrections from classification audit + empty-transcript confidence cap.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { applyEmptyTranscriptConfidenceCap } from './topic-classify.ts'
import { classifyByRules } from './topic-rules.ts'
import { CONVERSATIONS_DIR, writeStoredConversation } from './storage.ts'
import type { StoredConversation, TopicClassification } from './types.ts'

const MANUAL_FIXES: Record<string, TopicClassification> = {
  '215474558099040': {
    topic: 'Prospection / partenariat non sollicité',
    secondaryTopics: [],
    topicConfidence: 'high',
    isSupportTicket: false,
    classifiedBy: 'rule',
  },
  '215474557944426': {
    topic: 'Prospection / partenariat non sollicité',
    secondaryTopics: [],
    topicConfidence: 'high',
    isSupportTicket: false,
    classifiedBy: 'rule',
  },
  '215474534982189': {
    topic: 'Questions produit & Fonds',
    secondaryTopics: [],
    topicConfidence: 'high',
    isSupportTicket: true,
    classifiedBy: 'gemini',
  },
  '215474532003084': {
    topic: 'Prospection / partenariat non sollicité',
    secondaryTopics: [],
    topicConfidence: 'high',
    isSupportTicket: false,
    classifiedBy: 'rule',
  },
  '215474477700188': {
    topic: 'Prospection / partenariat non sollicité',
    secondaryTopics: [],
    topicConfidence: 'high',
    isSupportTicket: false,
    classifiedBy: 'gemini',
  },
}

function applyFix(
  conversation: StoredConversation,
  classification: TopicClassification,
): StoredConversation {
  return {
    ...conversation,
    topic: classification.topic,
    secondaryTopics:
      classification.secondaryTopics.length > 0
        ? classification.secondaryTopics
        : undefined,
    topicConfidence: classification.topicConfidence,
    isSupportTicket: classification.isSupportTicket,
  }
}

async function main(): Promise<void> {
  let manualFixed = 0
  let ruleReclassified = 0
  let emptyTranscriptCapped = 0

  for (const [id, classification] of Object.entries(MANUAL_FIXES)) {
    const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`)
    const conversation = JSON.parse(
      await readFile(filePath, 'utf8'),
    ) as StoredConversation
    await writeStoredConversation(applyFix(conversation, classification))
    manualFixed += 1
  }

  const files = (await readdir(CONVERSATIONS_DIR)).filter((name) => name.endsWith('.json'))

  for (const file of files) {
    const conversation = JSON.parse(
      await readFile(path.join(CONVERSATIONS_DIR, file), 'utf8'),
    ) as StoredConversation

    const ruleResult = classifyByRules(conversation)
    if (
      ruleResult &&
      (conversation.topic !== ruleResult.topic ||
        conversation.isSupportTicket !== ruleResult.isSupportTicket)
    ) {
      const capped = applyEmptyTranscriptConfidenceCap(conversation, ruleResult)
      await writeStoredConversation(applyFix(conversation, capped))
      ruleReclassified += 1
      continue
    }

    if (!conversation.transcript?.trim() && conversation.topicConfidence === 'high') {
      const capped = applyEmptyTranscriptConfidenceCap(conversation, {
        topic: conversation.topic ?? 'Autre / non classifié',
        secondaryTopics: conversation.secondaryTopics ?? [],
        topicConfidence: conversation.topicConfidence,
        isSupportTicket: conversation.isSupportTicket ?? true,
      })
      if (capped.topicConfidence !== conversation.topicConfidence) {
        await writeStoredConversation({
          ...conversation,
          topicConfidence: capped.topicConfidence,
        })
        emptyTranscriptCapped += 1
      }
    }
  }

  console.log(
    `Done. Manual fixes ${manualFixed}, rule reclassified ${ruleReclassified}, empty-transcript capped ${emptyTranscriptCapped}`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
