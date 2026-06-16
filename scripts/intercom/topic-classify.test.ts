import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  applyEmptyTranscriptConfidenceCap,
  buildClassifyPrompt,
  dedupeSecondaryTopics,
  normalizeClassification,
  truncateTranscript,
  validateClassification,
} from './topic-classify.ts'
import type { StoredConversation } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

const base: StoredConversation = {
  id: '1',
  medium: 'email',
  initiatedBy: 'customer',
  state: 'closed',
  createdAt: '2026-01-01T00:00:00.000Z',
  firstReplyAt: null,
  lastMessageAt: '2026-01-01T00:00:00.000Z',
  resolution: 'human_only',
  transcript: 'Customer: Je veux transférer mon PER.',
  issueSummary: 'Le client souhaite transférer son PER vers Goodvest.',
  subject: 'Transfert PER',
}

describe('truncateTranscript', () => {
  it('leaves short transcripts unchanged', () => {
    expect(truncateTranscript('short')).toBe('short')
  })

  it('truncates long transcripts', () => {
    const long = 'x'.repeat(5000)
    const result = truncateTranscript(long, 100)
    expect(result.length).toBeLessThan(200)
    expect(result).toContain('tronqué')
  })
})

describe('buildClassifyPrompt', () => {
  it('includes taxonomy, summary, subject, and transcript', () => {
    const prompt = buildClassifyPrompt(base, '## Taxonomie test')

    expect(prompt).toContain('## Taxonomie test')
    expect(prompt).toContain('Email subject: Transfert PER')
    expect(prompt).toContain('Customer need summary:')
    expect(prompt).toContain('transférer mon PER')
  })
})

describe('normalizeClassification', () => {
  it('dedupes primary from secondaries and caps at two', () => {
    const result = normalizeClassification({
      topic: 'Sécurité',
      secondaryTopics: ['Sécurité', 'Retrait & rachat', 'Versements et prélèvements', 'invalid'],
      topicConfidence: 'high',
      isSupportTicket: true,
    })

    expect(result.topic).toBe('Sécurité')
    expect(result.secondaryTopics).toEqual(['Retrait & rachat', 'Versements et prélèvements'])
    expect(result.classifiedBy).toBe('gemini')
  })

  it('defaults invalid confidence to medium', () => {
    const result = normalizeClassification({
      topic: 'Sécurité',
      secondaryTopics: [],
      topicConfidence: 'maybe',
      isSupportTicket: true,
    })

    expect(result.topicConfidence).toBe('medium')
  })
})

describe('dedupeSecondaryTopics', () => {
  it('filters unknown labels', () => {
    expect(dedupeSecondaryTopics('Sécurité', ['Sécurité', 'Not A Real Topic', 'Retrait & rachat'])).toEqual([
      'Retrait & rachat',
    ])
  })
})

describe('validateClassification', () => {
  it('falls back to Autre for unknown primary topic', () => {
    const result = validateClassification({
      topic: 'Invented category',
      secondaryTopics: [],
      topicConfidence: 'high',
      isSupportTicket: true,
      classifiedBy: 'gemini',
    })

    expect(result.topic).toBe('Autre / non classifié')
    expect(result.topicConfidence).toBe('low')
  })

  it('remaps deprecated versement delay label', () => {
    const result = validateClassification({
      topic: 'Versement non visible / retard',
      secondaryTopics: ['Versements et prélèvements'],
      topicConfidence: 'high',
      isSupportTicket: true,
      classifiedBy: 'gemini',
    })

    expect(result.topic).toBe('Versements et prélèvements')
    expect(result.secondaryTopics).toEqual([])
  })
})

describe('applyEmptyTranscriptConfidenceCap', () => {
  it('downgrades confidence when transcript is empty', () => {
    const result = applyEmptyTranscriptConfidenceCap(
      { ...base, transcript: '' },
      {
        topic: 'Bénéficiaires',
        secondaryTopics: [],
        topicConfidence: 'high',
        isSupportTicket: true,
        classifiedBy: 'gemini',
      },
    )

    expect(result.topicConfidence).toBe('low')
  })

  it('leaves confidence unchanged when transcript exists', () => {
    const result = applyEmptyTranscriptConfidenceCap(
      base,
      {
        topic: 'Retrait & rachat',
        secondaryTopics: [],
        topicConfidence: 'high',
        isSupportTicket: true,
        classifiedBy: 'gemini',
      },
    )

    expect(result.topicConfidence).toBe('high')
  })
})

describe('taxonomy-prompt.md', () => {
  it('exists and lists all subcategories', async () => {
    const content = await readFile(
      path.join(ROOT, 'data/intercom/taxonomy-prompt.md'),
      'utf8',
    )

    expect(content).toContain('Sécurité')
    expect(content).toContain('Prospection / partenariat non sollicité')
    expect(content).toContain('Désambiguïsation')
  })
})
