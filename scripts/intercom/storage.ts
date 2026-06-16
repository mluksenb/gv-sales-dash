import { readFile, writeFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ManifestEntry, StoredConversation } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

export const CONVERSATIONS_DIR = path.join(ROOT, 'data/intercom/conversations')
export const MANIFEST_PATH = path.join(ROOT, 'data/intercom/manifest.jsonl')

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export function conversationPath(id: string): string {
  return path.join(CONVERSATIONS_DIR, `${id}.json`)
}

export async function loadExistingIds(): Promise<Set<string>> {
  if (!(await fileExists(MANIFEST_PATH))) return new Set()

  const content = await readFile(MANIFEST_PATH, 'utf8')
  const ids = new Set<string>()

  for (const line of content.split('\n')) {
    if (!line.trim()) continue
    ids.add((JSON.parse(line) as ManifestEntry).id)
  }

  return ids
}

export async function loadManifestEntries(): Promise<ManifestEntry[]> {
  if (!(await fileExists(MANIFEST_PATH))) return []

  const entries: ManifestEntry[] = []
  for (const line of (await readFile(MANIFEST_PATH, 'utf8')).split('\n')) {
    if (!line.trim()) continue
    entries.push(JSON.parse(line) as ManifestEntry)
  }

  return entries
}

/**
 * Oldest createdAt among recent manifest entries — the edge to extend backward from.
 * Ignores ancient outliers more than `lookbackDays` before the newest export.
 */
export async function loadContinuationAnchor(
  lookbackDays = 180,
): Promise<string | null> {
  const entries = await loadManifestEntries()
  if (entries.length === 0) return null

  const maxCreatedAt = entries.reduce(
    (max, entry) => (entry.createdAt > max ? entry.createdAt : max),
    entries[0].createdAt,
  )
  const floorMs = new Date(maxCreatedAt).getTime() - lookbackDays * 24 * 60 * 60 * 1000

  const recent = entries.filter(
    (entry) => new Date(entry.createdAt).getTime() >= floorMs,
  )
  if (recent.length === 0) return null

  return recent.reduce(
    (min, entry) => (entry.createdAt < min ? entry.createdAt : min),
    recent[0].createdAt,
  )
}

/** Oldest `createdAt` in the manifest — anchor for fetching the next older batch. */
export async function loadOldestManifestCreatedAt(): Promise<string | null> {
  const entries = await loadManifestEntries()
  if (entries.length === 0) return null

  return entries.reduce(
    (min, entry) => (entry.createdAt < min ? entry.createdAt : min),
    entries[0].createdAt,
  )
}

export interface PruneBeforeDateResult {
  removedIds: string[]
  kept: number
}

/** Remove manifest entries and conversation files strictly before `beforeExclusiveIso`. */
export async function pruneConversationsBefore(
  beforeExclusiveIso: string,
): Promise<PruneBeforeDateResult> {
  const entries = await loadManifestEntries()
  const kept: ManifestEntry[] = []
  const removedIds: string[] = []

  for (const entry of entries) {
    if (entry.createdAt < beforeExclusiveIso) {
      removedIds.push(entry.id)
    } else {
      kept.push(entry)
    }
  }

  const manifestBody = kept.map((entry) => JSON.stringify(entry)).join('\n')
  await writeFile(
    MANIFEST_PATH,
    manifestBody.length > 0 ? `${manifestBody}\n` : '',
  )

  const { unlink } = await import('node:fs/promises')
  for (const id of removedIds) {
    const filePath = conversationPath(id)
    if (await fileExists(filePath)) {
      await unlink(filePath)
    }
  }

  return { removedIds, kept: kept.length }
}

export async function readStoredConversation(id: string): Promise<StoredConversation | null> {
  const filePath = conversationPath(id)
  if (!(await fileExists(filePath))) return null
  return JSON.parse(await readFile(filePath, 'utf8')) as StoredConversation
}

export async function writeStoredConversation(conversation: StoredConversation): Promise<void> {
  await writeFile(
    conversationPath(conversation.id),
    `${JSON.stringify(conversation, null, 2)}\n`,
  )
}
