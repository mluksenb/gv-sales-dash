import { describe, expect, it } from 'vitest'
import {
  DEPRECATED_TOPIC_ALIASES,
  TOPIC_LABELS,
  topicCategoryFor,
  TOPIC_TO_CATEGORY,
} from './taxonomy-labels.ts'
import { applyTopicCategories, needsTopicCategory } from './topic-categories.ts'
import type { StoredConversation } from './types.ts'

describe('topicCategoryFor', () => {
  it('maps every taxonomy subcategory to a parent category', () => {
    for (const label of TOPIC_LABELS) {
      expect(TOPIC_TO_CATEGORY[label]).toBeDefined()
      expect(topicCategoryFor(label)).toBe(TOPIC_TO_CATEGORY[label])
    }
  })

  it('maps deprecated versement alias to Transactions', () => {
    const deprecated = 'Versement non visible / retard'
    expect(DEPRECATED_TOPIC_ALIASES[deprecated]).toBe('Versements et prélèvements')
    expect(topicCategoryFor(deprecated)).toBe('Transactions')
  })

  it('maps Sécurité to Gestion de compte', () => {
    expect(topicCategoryFor('Sécurité')).toBe('Gestion de compte')
  })
})

describe('applyTopicCategories', () => {
  const base: StoredConversation = {
    id: '1',
    medium: 'email',
    initiatedBy: 'customer',
    resolution: 'resolved',
    transcript: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  it('sets topicCategory for versement topics', () => {
    const updated = applyTopicCategories({
      ...base,
      topic: 'Versements et prélèvements',
    })
    expect(updated.topicCategory).toBe('Transactions')
    expect(updated.secondaryTopicCategories).toBeUndefined()
  })

  it('sets secondaryTopicCategories in parallel with secondaryTopics', () => {
    const updated = applyTopicCategories({
      ...base,
      topic: 'Versements et prélèvements',
      secondaryTopics: ['RIB / compte bancaire'],
    })
    expect(updated.topicCategory).toBe('Transactions')
    expect(updated.secondaryTopicCategories).toEqual(['Gestion de contrat actif'])
  })

  it('needsTopicCategory when category missing or stale', () => {
    const missing = { ...base, topic: 'Versements et prélèvements' }
    expect(needsTopicCategory(missing)).toBe(true)

    const correct = applyTopicCategories(missing)
    expect(needsTopicCategory(correct)).toBe(false)

    const stale = { ...correct, topicCategory: 'Divers' }
    expect(needsTopicCategory(stale)).toBe(true)
  })
})
