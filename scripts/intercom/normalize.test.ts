import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { normalizeConversation } from './normalize.ts'
import type { RawIntercomConversation } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function loadFixture(name: string): Promise<RawIntercomConversation> {
  const content = await readFile(path.join(__dirname, 'fixtures', name), 'utf8')
  return JSON.parse(content) as RawIntercomConversation
}

describe('normalizeConversation', () => {
  it('normalizes a Fin-confirmed chat with aiTitle and no internal notes', async () => {
    const raw = await loadFixture('chat-fin-confirmed.json')
    const result = normalizeConversation(raw)

    expect(result.medium).toBe('chat')
    expect(result.resolution).toBe('fin_confirmed')
    expect(result.aiTitle).toBe('Frais de sortie')
    expect(result.language).toBe('French')
    expect(result.transcript).toContain('Customer: Quels sont les frais de sortie')
    expect(result.transcript).toContain('Fin:')
    expect(result.transcript).not.toContain('Internal teammate note')
    expect(result.transcript).not.toContain('Tony Carpentier')
    expect(result.transcript).not.toContain('tony@example.com')
  })

  it('normalizes an email with subject and admin reply', async () => {
    const raw = await loadFixture('email-with-reply.json')
    const result = normalizeConversation(raw)

    expect(result.medium).toBe('email')
    expect(result.subject).toBe('rachat livret goodvest')
    expect(result.resolution).toBe('human_only')
    expect(result.transcript).toContain('Customer:')
    expect(result.transcript).toContain('Christelle:')
    expect(result.transcript).not.toContain('toscane@example.com')
    expect(result.transcript).not.toContain('Toscane Marie')
  })

  it('captures attachment-only email source messages', async () => {
    const raw = await loadFixture('email-attachment-only.json')
    const result = normalizeConversation(raw)

    expect(result.transcript).toBe(
      'Customer: [Attachment: Acte_de_décès.pdf, Mandat.pdf]',
    )
    expect(result.subject).toBe('Documents transmis')
  })
})
