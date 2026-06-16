import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  classifyByRules,
  extractCustomerText,
  isMarketingNewsletter,
  isProspectionSpam,
  isRecruitmentInquiry,
  shouldSkipSummarization,
} from './topic-rules.ts'
import { TOPIC_PROSPECTION } from './taxonomy-labels.ts'
import { TOPIC_SECURITY } from './topics.ts'
import type { StoredConversation } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONVERSATIONS_DIR = path.join(path.resolve(__dirname, '../..'), 'data/intercom/conversations')

async function loadConversation(id: string): Promise<StoredConversation> {
  const raw = await readFile(path.join(CONVERSATIONS_DIR, `${id}.json`), 'utf8')
  return JSON.parse(raw) as StoredConversation
}

describe('classifyByRules', () => {
  it('tags security incident conversations', async () => {
    const conversation = await loadConversation('215474581277010')
    const result = classifyByRules(conversation)

    expect(result?.topic).toBe(TOPIC_SECURITY)
    expect(result?.topicConfidence).toBe('high')
    expect(result?.isSupportTicket).toBe(true)
    expect(result?.classifiedBy).toBe('rule')
  })

  it('tags forwarded Meta phishing as prospection', async () => {
    const conversation = await loadConversation('215474651012678')
    const result = classifyByRules(conversation)

    expect(result?.topic).toBe(TOPIC_PROSPECTION)
    expect(result?.isSupportTicket).toBe(false)
  })

  it('tags inbound marketing newsletters as prospection', async () => {
    const conversation = await loadConversation('215474662183849')
    const result = classifyByRules(conversation)

    expect(isMarketingNewsletter(conversation)).toBe(true)
    expect(result?.topic).toBe(TOPIC_PROSPECTION)
    expect(result?.isSupportTicket).toBe(false)
    expect(result?.classifiedBy).toBe('rule')
  })
})

describe('isProspectionSpam', () => {
  it('returns false for genuine support threads', async () => {
    const conversation = await loadConversation('215474649729651')
    expect(isProspectionSpam(conversation)).toBe(false)
  })
})

describe('isRecruitmentInquiry', () => {
  it('does not match OPCVM in agent replies', async () => {
    const conversation = await loadConversation('215474526572668')

    expect(isRecruitmentInquiry(conversation)).toBe(false)
    expect(classifyByRules(conversation)).toBeNull()
  })

  it('does not match ETF/OPCVM product questions', async () => {
    const conversation = await loadConversation('215474534982189')

    expect(extractCustomerText(conversation)).toContain('ETF')
    expect(isRecruitmentInquiry(conversation)).toBe(false)
    expect(classifyByRules(conversation)).toBeNull()
  })
})

describe('isMarketingNewsletter', () => {
  it('tags B2B training newsletters as prospection', async () => {
    const conversation = await loadConversation('215474558099040')
    const result = classifyByRules(conversation)

    expect(isMarketingNewsletter(conversation)).toBe(true)
    expect(result?.topic).toBe(TOPIC_PROSPECTION)
    expect(result?.isSupportTicket).toBe(false)
  })
})

describe('shouldSkipSummarization', () => {
  it('skips marketing newsletters and prospection', async () => {
    const newsletter = await loadConversation('215474662183849')
    const support = await loadConversation('215474649729651')

    expect(shouldSkipSummarization(newsletter)).toBe(true)
    expect(shouldSkipSummarization(support)).toBe(false)
  })

  it('still summarizes security incident threads', async () => {
    const conversation = await loadConversation('215474581277010')
    expect(shouldSkipSummarization(conversation)).toBe(false)
  })

  it('does not skip genuine unsubscribe requests', () => {
    const conversation: StoredConversation = {
      id: 'test-unsubscribe',
      medium: 'email',
      initiatedBy: 'customer',
      state: 'closed',
      createdAt: '2026-01-01T00:00:00.000Z',
      firstReplyAt: null,
      lastMessageAt: '2026-01-01T00:00:00.000Z',
      resolution: 'human_only',
      transcript:
        'Customer: Bonjour, je souhaite me désabonner de vos emails marketing et ne plus recevoir de newsletters. Merci.',
      subject: 'Désabonnement',
    }

    expect(isMarketingNewsletter(conversation)).toBe(false)
    expect(shouldSkipSummarization(conversation)).toBe(false)
  })
})
