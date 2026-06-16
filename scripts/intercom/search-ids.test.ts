import { describe, expect, it } from 'vitest'
import { buildSearchQuery, pickMostRecentByCreatedAt } from './search-ids.ts'

describe('pickMostRecentByCreatedAt', () => {
  it('returns the newest conversations first across all channels', () => {
    const ids = pickMostRecentByCreatedAt(
      [
        { id: 'chat-old', created_at: 100 },
        { id: 'email-new', created_at: 300 },
        { id: 'chat-new', created_at: 250 },
        { id: 'sms-mid', created_at: 200 },
      ],
      3,
    )

    expect(ids).toEqual(['email-new', 'chat-new', 'sms-mid'])
  })

  it('supports offset for the next page by created_at', () => {
    const hits = [
      { id: 'a', created_at: 400 },
      { id: 'b', created_at: 300 },
      { id: 'c', created_at: 200 },
      { id: 'd', created_at: 100 },
    ]

    expect(pickMostRecentByCreatedAt(hits, 2, 2)).toEqual(['c', 'd'])
  })

  it('excludes known IDs when continuing from manifest anchor', () => {
    const hits = [
      { id: 'known', created_at: 500 },
      { id: 'new-a', created_at: 400 },
      { id: 'new-b', created_at: 300 },
    ]

    expect(
      pickMostRecentByCreatedAt(hits, 2, 0, new Set(['known'])),
    ).toEqual(['new-a', 'new-b'])
  })
})

describe('buildSearchQuery', () => {
  it('adds created_at upper bound for older-than-anchor searches', () => {
    expect(buildSearchQuery({ createdAfter: 100, createdBefore: 500 })).toEqual({
      operator: 'AND',
      value: [
        { field: 'state', operator: '=', value: 'closed' },
        { field: 'created_at', operator: '>', value: 100 },
        { field: 'created_at', operator: '<', value: 500 },
      ],
    })
  })
})
