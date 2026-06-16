#!/usr/bin/env node
import { mkdir, writeFile, readFile, appendFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeConversation } from './normalize.ts'
import type { ManifestEntry, RawIntercomConversation } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const CONVERSATIONS_DIR = path.join(ROOT, 'data/intercom/conversations')
const MANIFEST_PATH = path.join(ROOT, 'data/intercom/manifest.jsonl')

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function loadExistingIds(): Promise<Set<string>> {
  if (!(await fileExists(MANIFEST_PATH))) return new Set()

  const content = await readFile(MANIFEST_PATH, 'utf8')
  const ids = new Set<string>()

  for (const line of content.split('\n')) {
    if (!line.trim()) continue
    const entry = JSON.parse(line) as ManifestEntry
    ids.add(entry.id)
  }

  return ids
}

async function main(): Promise<void> {
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error('Usage: npx tsx scripts/intercom/write-batch.ts <raw-conversations.json>')
    process.exit(1)
  }

  const rawContent = await readFile(inputPath, 'utf8')
  const payload = JSON.parse(rawContent) as
    | RawIntercomConversation[]
    | { conversations: RawIntercomConversation[] }

  const conversations = Array.isArray(payload)
    ? payload
    : payload.conversations

  await mkdir(CONVERSATIONS_DIR, { recursive: true })

  const existingIds = await loadExistingIds()
  let written = 0
  let skipped = 0

  for (const raw of conversations) {
    const normalized = normalizeConversation(raw)
    if (existingIds.has(normalized.id)) {
      skipped += 1
      continue
    }

    const outPath = path.join(CONVERSATIONS_DIR, `${normalized.id}.json`)
    await writeFile(outPath, `${JSON.stringify(normalized, null, 2)}\n`)

    const manifestEntry: ManifestEntry = {
      id: normalized.id,
      medium: normalized.medium,
      resolution: normalized.resolution,
      createdAt: normalized.createdAt,
      lastMessageAt: normalized.lastMessageAt,
      exportedAt: new Date().toISOString(),
    }

    await appendFile(MANIFEST_PATH, `${JSON.stringify(manifestEntry)}\n`)
    existingIds.add(normalized.id)
    written += 1
  }

  console.log(`Wrote ${written} conversations, skipped ${skipped} duplicates`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
