import { describe, expect, it } from 'vitest'
import {
  addUsageTotals,
  createUsageTotals,
  extractUsageMetadata,
  formatUsageTotalsLine,
} from './gemini-usage.ts'

describe('extractUsageMetadata', () => {
  it('reads camelCase usageMetadata from a generateContent response', () => {
    const usage = extractUsageMetadata({
      candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      usageMetadata: {
        promptTokenCount: 1200,
        candidatesTokenCount: 42,
        totalTokenCount: 1242,
      },
    })

    expect(usage).toEqual({
      promptTokenCount: 1200,
      candidatesTokenCount: 42,
      totalTokenCount: 1242,
    })
  })

  it('reads snake_case usage_metadata fields', () => {
    const usage = extractUsageMetadata({
      usage_metadata: {
        prompt_token_count: 50,
        candidates_token_count: 10,
        total_token_count: 60,
      },
    })

    expect(usage).toEqual({
      promptTokenCount: 50,
      candidatesTokenCount: 10,
      totalTokenCount: 60,
    })
  })

  it('returns null when usage metadata is absent', () => {
    expect(extractUsageMetadata({ candidates: [] })).toBeNull()
  })
})

describe('usage totals', () => {
  it('aggregates token counts across responses', () => {
    const totals = createUsageTotals()

    addUsageTotals(totals, {
      promptTokenCount: 100,
      candidatesTokenCount: 20,
      totalTokenCount: 120,
    })
    addUsageTotals(totals, {
      promptTokenCount: 300,
      candidatesTokenCount: 40,
      totalTokenCount: 340,
    })
    addUsageTotals(totals, null)

    expect(totals).toEqual({
      promptTokenCount: 400,
      candidatesTokenCount: 60,
      totalTokenCount: 460,
      responseCount: 2,
      missingUsageCount: 1,
    })
  })

  it('formats a readable log line', () => {
    const totals = createUsageTotals()
    addUsageTotals(totals, {
      promptTokenCount: 1234,
      candidatesTokenCount: 56,
      totalTokenCount: 1290,
    })

    expect(formatUsageTotalsLine('intercom-summarize-test', totals)).toBe(
      'Gemini token usage (intercom-summarize-test): 1 responses, prompt=1,234, output=56, total=1,290',
    )
  })
})
