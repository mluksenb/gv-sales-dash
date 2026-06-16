import { describe, expect, it } from 'vitest'
import { TOPIC_LABELS } from './taxonomy-labels.ts'

describe('versement topic taxonomy', () => {
  it('does not include deprecated Versement non visible label', () => {
    expect(TOPIC_LABELS).toContain('Versements et prélèvements')
    expect(TOPIC_LABELS).not.toContain('Versement non visible / retard')
  })
})
