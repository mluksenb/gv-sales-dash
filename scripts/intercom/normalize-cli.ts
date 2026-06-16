#!/usr/bin/env node
import { normalizeConversation } from './normalize.ts'
import type { RawIntercomConversation } from './types.ts'

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function main(): Promise<void> {
  const input = await readStdin()
  if (!input.trim()) {
    console.error('Expected raw Intercom conversation JSON on stdin')
    process.exit(1)
  }

  const raw = JSON.parse(input) as RawIntercomConversation
  const normalized = normalizeConversation(raw)
  process.stdout.write(`${JSON.stringify(normalized, null, 2)}\n`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
