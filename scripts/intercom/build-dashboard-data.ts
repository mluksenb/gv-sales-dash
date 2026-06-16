/**
 * Aggregates normalized Intercom conversations into a single compact JSON
 * payload consumed by the Support Insights dashboard.
 *
 * The payload is encrypted with a password before being written, so the file
 * shipped to the browser (public/support-data.enc.json) is useless to anyone
 * who does not know the password — even if the dashboard URL is shared.
 *
 * Output: public/support-data.enc.json (PII-stripped, no transcripts, encrypted).
 * Run:    SUPPORT_DATA_PASSWORD=... npm run intercom:dashboard-data
 *         npm run intercom:dashboard-data -- --plaintext   (local dev, no password)
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'
import {
  TOPIC_CATEGORIES,
  TOPIC_LABELS,
  TOPIC_TO_CATEGORY,
  resolveTopicLabel,
  topicCategoryFor,
} from './taxonomy-labels.ts'
import type { StoredConversation } from './types.ts'
import { encryptJson } from '../../src/support/lib/crypto.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CONVERSATIONS_DIR = join(ROOT, 'data', 'intercom', 'conversations')
const TAXONOMY_FILE = join(ROOT, 'data', 'intercom', 'taxonomy.md')
const OUTPUT_FILE = join(ROOT, 'public', 'support-data.enc.json')
const TAXONOMY_OUTPUT = join(ROOT, 'public', 'support-taxonomy.md')
/** Legacy plaintext output that must never be deployed. */
const LEGACY_PLAINTEXT_FILE = join(ROOT, 'public', 'support-data.json')

/** Reads the dashboard password from the env or, failing that, prompts for it. */
async function resolvePassword(): Promise<string> {
  const fromEnv = process.env.SUPPORT_DATA_PASSWORD?.trim()
  if (fromEnv) return fromEnv

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await new Promise<string>((resolve) =>
      rl.question('Mot de passe pour chiffrer les données support : ', resolve),
    )
    const password = answer.trim()
    if (!password) throw new Error('Mot de passe vide — abandon.')
    return password
  } finally {
    rl.close()
  }
}

/** Intercom workspace id, used to build deep links into the inbox. */
const INTERCOM_WORKSPACE_ID = 'rbag1a9i'

/** Compact per-conversation shape sent to the browser. */
interface DashboardConversation {
  id: string
  medium: StoredConversation['medium']
  resolution: StoredConversation['resolution']
  createdAt: string
  lastMessageAt: string
  title?: string
  summary?: string
  topic: string
  topicCategory: string
  secondaryTopics?: string[]
  topicConfidence?: StoredConversation['topicConfidence']
  isSupportTicket: boolean
  language?: string
}

function topicsByCategory(): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const category of TOPIC_CATEGORIES) map[category] = []
  for (const label of TOPIC_LABELS) {
    const category = TOPIC_TO_CATEGORY[label]
    map[category].push(label)
  }
  return map
}

function buildConversation(raw: StoredConversation): DashboardConversation {
  const topic = raw.topic ? resolveTopicLabel(raw.topic.trim()) : 'Autre / non classifié'
  const topicCategory = raw.topicCategory ?? topicCategoryFor(topic) ?? 'Divers'
  const title = raw.subject ?? raw.aiTitle
  const secondaryTopics = (raw.secondaryTopics ?? [])
    .map((label) => resolveTopicLabel(label.trim()))
    .filter(Boolean)

  return {
    id: raw.id,
    medium: raw.medium,
    resolution: raw.resolution,
    createdAt: raw.createdAt,
    lastMessageAt: raw.lastMessageAt,
    ...(title ? { title } : {}),
    ...(raw.issueSummary ? { summary: raw.issueSummary } : {}),
    topic,
    topicCategory,
    ...(secondaryTopics.length ? { secondaryTopics } : {}),
    ...(raw.topicConfidence ? { topicConfidence: raw.topicConfidence } : {}),
    isSupportTicket: raw.isSupportTicket ?? true,
    ...(raw.language ? { language: raw.language } : {}),
  }
}

async function main(): Promise<void> {
  const plaintextMode = process.argv.includes('--plaintext')

  if (!existsSync(CONVERSATIONS_DIR)) {
    throw new Error(`Conversations directory not found: ${CONVERSATIONS_DIR}`)
  }

  const files = readdirSync(CONVERSATIONS_DIR).filter((f) => f.endsWith('.json'))
  const conversations: DashboardConversation[] = []

  let dateMin: string | null = null
  let dateMax: string | null = null

  for (const file of files) {
    const raw = JSON.parse(
      readFileSync(join(CONVERSATIONS_DIR, file), 'utf8'),
    ) as StoredConversation
    const conversation = buildConversation(raw)
    conversations.push(conversation)

    if (!dateMin || conversation.createdAt < dateMin) dateMin = conversation.createdAt
    if (!dateMax || conversation.createdAt > dateMax) dateMax = conversation.createdAt
  }

  conversations.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      count: conversations.length,
      dateMin,
      dateMax,
      intercomWorkspaceId: INTERCOM_WORKSPACE_ID,
      categories: TOPIC_CATEGORIES,
      topicsByCategory: topicsByCategory(),
      topicOrder: TOPIC_LABELS,
    },
    conversations,
  }

  const outDir = dirname(OUTPUT_FILE)
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  if (!existsSync(TAXONOMY_FILE)) {
    throw new Error(`Taxonomy file not found: ${TAXONOMY_FILE}`)
  }
  writeFileSync(TAXONOMY_OUTPUT, readFileSync(TAXONOMY_FILE, 'utf8'))

  if (plaintextMode) {
    const serialized = JSON.stringify(payload)
    writeFileSync(LEGACY_PLAINTEXT_FILE, serialized)
    const bytes = Buffer.byteLength(serialized)
    console.log(
      `Wrote ${conversations.length} conversations to ${LEGACY_PLAINTEXT_FILE} (${(bytes / 1024 / 1024).toFixed(2)} MB, plaintext — local dev only)`,
    )
    console.log(`Copied taxonomy to ${TAXONOMY_OUTPUT}`)
    console.log(`Date range: ${dateMin} -> ${dateMax}`)
    return
  }

  const password = await resolvePassword()
  const encrypted = await encryptJson(password, payload)
  const serialized = JSON.stringify(encrypted)
  writeFileSync(OUTPUT_FILE, serialized)

  // Never let a plaintext payload linger in public/ where it would be deployed.
  if (existsSync(LEGACY_PLAINTEXT_FILE)) rmSync(LEGACY_PLAINTEXT_FILE)

  const bytes = Buffer.byteLength(serialized)
  console.log(
    `Wrote ${conversations.length} encrypted conversations to ${OUTPUT_FILE} (${(bytes / 1024 / 1024).toFixed(2)} MB)`,
  )
  console.log(`Copied taxonomy to ${TAXONOMY_OUTPUT}`)
  console.log(`Date range: ${dateMin} -> ${dateMax}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
