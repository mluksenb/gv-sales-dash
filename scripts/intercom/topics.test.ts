import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { isSecurityIncidentResponse } from './topics.ts'
import type { StoredConversation } from './types.ts'

const base: StoredConversation = {
  id: '1',
  medium: 'email',
  initiatedBy: 'customer',
  state: 'closed',
  createdAt: '2026-01-01T00:00:00.000Z',
  firstReplyAt: null,
  lastMessageAt: '2026-01-01T00:00:00.000Z',
  resolution: 'human_only',
  transcript: 'Customer: Hello',
}

function loadFixture(id: string): StoredConversation {
  return JSON.parse(
    readFileSync(`data/intercom/conversations/${id}.json`, 'utf8'),
  ) as StoredConversation
}

describe('isSecurityIncidentResponse', () => {
  it('matches replies to the incident notification subject', () => {
    expect(
      isSecurityIncidentResponse({
        ...base,
        subject: 'Re: Information importante : incident de sécurité sur vos données personnelles',
      }),
    ).toBe(true)
  })

  it('matches customer messages referencing the incident communication', () => {
    expect(
      isSecurityIncidentResponse({
        ...base,
        subject: 'Changement email et mot de passe',
        transcript:
          "Customer: Suite à votre communication sur l'incident de sécurité, je souhaiterais mettre à jour mon email.",
      }),
    ).toBe(true)
  })

  it('matches prospect worried about breach email without account', () => {
    const fixture = loadFixture('215474581277010')
    expect(isSecurityIncidentResponse(fixture)).toBe(true)
  })

  it('matches password change triggered by breach announcement', () => {
    const fixture = loadFixture('215474584162290')
    expect(isSecurityIncidentResponse(fixture)).toBe(true)
  })

  it('matches email change triggered by breach announcement', () => {
    const fixture = loadFixture('215474587569428')
    expect(isSecurityIncidentResponse(fixture)).toBe(true)
  })

  it('matches customer inquiry via bonjourlafuite listing', () => {
    const fixture = loadFixture('215474616226469')
    expect(isSecurityIncidentResponse(fixture)).toBe(true)
  })

  it('matches combined password and email change after breach', () => {
    const fixture = loadFixture('215474597239153')
    expect(isSecurityIncidentResponse(fixture)).toBe(true)
  })

  it('matches exposure questions after breach even with other topics', () => {
    const fixture = loadFixture('215474596289603')
    expect(isSecurityIncidentResponse(fixture)).toBe(true)
  })

  it('matches agent reply referencing the breach during email change', () => {
    const fixture = loadFixture('215474584232819')
    expect(isSecurityIncidentResponse(fixture)).toBe(true)
  })

  it('does not match unrelated support topics', () => {
    expect(
      isSecurityIncidentResponse({
        ...base,
        subject: 'rachat livret goodvest',
        issueSummary:
          'La cliente souhaite connaître la procédure pour récupérer les fonds de son livret Goodvest.',
      }),
    ).toBe(false)
  })

  it('does not match unrelated marketing spam mentioning workplace safety', () => {
    const fixture = loadFixture('215474651907734')
    expect(isSecurityIncidentResponse(fixture)).toBe(false)
  })

  it('does not match unrelated vendor auto-replies with a Sécurité product category', () => {
    const fixture = loadFixture('215474580291664')
    expect(isSecurityIncidentResponse(fixture)).toBe(false)
  })
})
