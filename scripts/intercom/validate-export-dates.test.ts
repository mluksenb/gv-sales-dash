import { describe, expect, it } from 'vitest'
import {
  formatSenseCheckReport,
  senseCheckSearchHits,
} from './validate-export-dates.ts'

const ANCHOR = '2026-05-07T00:00:00.000Z'
const FLOOR = '2026-01-01T00:00:00.000Z'

describe('senseCheckSearchHits', () => {
  it('passes for a continuous batch just below the anchor', () => {
    const result = senseCheckSearchHits(
      [
        { id: 'a', created_at: 1778045874 }, // 2026-05-06
        { id: 'b', created_at: 1777959474 }, // 2026-05-05
      ],
      {
        beforeExclusiveIso: ANCHOR,
        notBeforeInclusiveIso: FLOOR,
        expectedCount: 2,
      },
    )

    expect(result.ok).toBe(true)
    expect(result.count).toBe(2)
  })

  it('fails when hits include pre-2026 historical conversations', () => {
    const result = senseCheckSearchHits(
      [
        { id: 'old', created_at: 1734773767 }, // 2024-12-21
        { id: 'new', created_at: 1778045874 },
      ],
      {
        beforeExclusiveIso: ANCHOR,
        notBeforeInclusiveIso: FLOOR,
        expectedCount: 2,
      },
    )

    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('before allowed floor'))).toBe(true)
  })

  it('fails when a hit is on or after the anchor', () => {
    const result = senseCheckSearchHits(
      [{ id: 'future', created_at: 1778284800 }],
      {
        beforeExclusiveIso: ANCHOR,
        expectedCount: 1,
      },
    )

    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('on/after anchor'))).toBe(true)
  })

  it('formats a readable report', () => {
    const report = formatSenseCheckReport({
      ok: false,
      errors: ['Expected 2 conversations, got 1'],
      oldest: '2026-04-01T00:00:00.000Z',
      newest: '2026-05-01T00:00:00.000Z',
      count: 1,
    })

    expect(report).toContain('FAILED')
    expect(report).toContain('Expected 2 conversations')
  })
})
