import { describe, expect, it } from 'vitest'
import { buildSummarizePrompt } from './summarize.ts'
import type { StoredConversation } from './types.ts'

const base: StoredConversation = {
  id: '1',
  medium: 'chat',
  initiatedBy: 'customer',
  state: 'closed',
  createdAt: '2026-01-01T00:00:00.000Z',
  firstReplyAt: null,
  lastMessageAt: '2026-01-01T00:00:00.000Z',
  resolution: 'fin_escalated',
  transcript: 'Customer: I cannot withdraw funds from my account.',
}

describe('buildSummarizePrompt', () => {
  it('includes channel context and transcript', () => {
    const prompt = buildSummarizePrompt(base)

    expect(prompt).toContain('Channel: chat')
    expect(prompt).toContain('Resolution: fin_escalated')
    expect(prompt).toContain('Customer: I cannot withdraw funds')
    expect(prompt).toContain('sans mentionner le support')
  })

  it('includes email subject and chat topic when present', () => {
    const prompt = buildSummarizePrompt({
      ...base,
      medium: 'email',
      subject: 'Withdrawal blocked',
      aiTitle: 'Withdrawal issue',
    })

    expect(prompt).toContain('Email subject: Withdrawal blocked')
    expect(prompt).toContain('Chat topic tag: Withdrawal issue')
  })
})
