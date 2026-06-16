import { topicCategoryFor } from './taxonomy-labels.ts'
import type { StoredConversation } from './types.ts'

/** Derive parent category fields from topic / secondaryTopics. */
export function applyTopicCategories(
  conversation: StoredConversation,
): StoredConversation {
  const topic = conversation.topic
  if (!topic?.trim()) {
    return conversation
  }

  const topicCategory = topicCategoryFor(topic)
  const secondaryTopicCategories = (conversation.secondaryTopics ?? [])
    .map((label) => topicCategoryFor(label))
    .filter((category): category is NonNullable<typeof category> => category !== undefined)

  return {
    ...conversation,
    topicCategory,
    secondaryTopicCategories:
      secondaryTopicCategories.length > 0 ? secondaryTopicCategories : undefined,
  }
}

export function needsTopicCategory(conversation: StoredConversation): boolean {
  if (!conversation.topic?.trim()) return false

  const expected = topicCategoryFor(conversation.topic)
  if (!expected) return false
  if (conversation.topicCategory !== expected) return true

  const expectedSecondaries = (conversation.secondaryTopics ?? [])
    .map((label) => topicCategoryFor(label))
    .filter((category): category is NonNullable<typeof category> => category !== undefined)

  const actualSecondaries = conversation.secondaryTopicCategories ?? []
  return expectedSecondaries.join('|') !== actualSecondaries.join('|')
}
