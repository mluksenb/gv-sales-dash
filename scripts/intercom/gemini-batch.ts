/**
 * Gemini Batch API client (REST). 50% cheaper than synchronous generateContent.
 * https://ai.google.dev/gemini-api/docs/batch-api
 */
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  addUsageTotals,
  createUsageTotals,
  extractUsageMetadata,
  logUsageTotals,
  type GeminiUsageMetadata,
  type GeminiUsageTotals,
} from './gemini-usage.ts'
import { delay } from './summarize.ts'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const UPLOAD_BASE = 'https://generativelanguage.googleapis.com/upload/v1beta'
const INLINE_SIZE_LIMIT_BYTES = 15 * 1024 * 1024
const INLINE_COUNT_LIMIT = 500

export type BatchJobState =
  | 'JOB_STATE_PENDING'
  | 'JOB_STATE_RUNNING'
  | 'JOB_STATE_SUCCEEDED'
  | 'JOB_STATE_FAILED'
  | 'JOB_STATE_CANCELLED'
  | 'JOB_STATE_EXPIRED'
  | 'BATCH_STATE_PENDING'
  | 'BATCH_STATE_RUNNING'
  | 'BATCH_STATE_SUCCEEDED'
  | 'BATCH_STATE_FAILED'
  | 'BATCH_STATE_CANCELLED'
  | 'BATCH_STATE_EXPIRED'
  | string

export interface BatchRequestItem {
  key: string
  request: Record<string, unknown>
}

export interface BatchJobStatus {
  name: string
  state: BatchJobState
  displayName?: string
  error?: unknown
  dest?: {
    fileName?: string
    inlinedResponses?: BatchInlineResponse[]
  }
}

export interface BatchInlineResponse {
  metadata?: { key?: string }
  response?: {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
    usageMetadata?: GeminiUsageMetadata
  }
  error?: unknown
}

export interface BatchResultLine {
  key: string
  text?: string
  error?: string
  usage?: GeminiUsageMetadata | null
}

export interface BatchJobResults {
  results: Map<string, BatchResultLine>
  usage: GeminiUsageTotals
}

function authHeaders(apiKey: string): Record<string, string> {
  return { 'x-goog-api-key': apiKey }
}

export function extractGenerateContentText(response: unknown): string | null {
  const data = response as BatchInlineResponse['response']
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  return text || null
}

async function uploadJsonlContent(
  jsonl: string,
  displayName: string,
  apiKey: string,
): Promise<string> {
  const bytes = Buffer.from(jsonl, 'utf8')
  const numBytes = bytes.length

  const startResponse = await fetch(`${UPLOAD_BASE}/files`, {
    method: 'POST',
    headers: {
      ...authHeaders(apiKey),
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(numBytes),
      'X-Goog-Upload-Header-Content-Type': 'jsonl',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  })

  if (!startResponse.ok) {
    throw new Error(
      `Gemini file upload start failed: ${startResponse.status} ${await startResponse.text()}`,
    )
  }

  const uploadUrl = startResponse.headers.get('x-goog-upload-url')
  if (!uploadUrl) {
    throw new Error('Gemini file upload missing x-goog-upload-url header')
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(numBytes),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: bytes,
  })

  if (!uploadResponse.ok) {
    throw new Error(
      `Gemini file upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`,
    )
  }

  const fileInfo = (await uploadResponse.json()) as { file?: { name?: string } }
  const fileName = fileInfo.file?.name
  if (!fileName) {
    throw new Error('Gemini file upload returned no file name')
  }

  return fileName
}

function buildJsonl(items: BatchRequestItem[]): string {
  return items.map((item) => JSON.stringify(item)).join('\n')
}

export async function createBatchJob(
  model: string,
  items: BatchRequestItem[],
  displayName: string,
  apiKey: string,
): Promise<{ name: string }> {
  if (items.length === 0) {
    throw new Error('Cannot create batch job with zero requests')
  }

  const jsonl = buildJsonl(items)
  const useFile =
    items.length > INLINE_COUNT_LIMIT || Buffer.byteLength(jsonl, 'utf8') > INLINE_SIZE_LIMIT_BYTES

  let inputConfig: Record<string, unknown>

  if (useFile) {
    const fileName = await uploadJsonlContent(jsonl, displayName, apiKey)
    inputConfig = { file_name: fileName }
  } else {
    inputConfig = {
      requests: {
        requests: items.map((item) => ({
          request: item.request,
          metadata: { key: item.key },
        })),
      },
    }
  }

  const maxAttempts = 6
  let lastError = ''

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(
      `${API_BASE}/models/${model}:batchGenerateContent`,
      {
        method: 'POST',
        headers: {
          ...authHeaders(apiKey),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch: {
            display_name: displayName,
            input_config: inputConfig,
          },
        }),
      },
    )

    if (response.ok) {
      const data = (await response.json()) as { name?: string; batch?: { name?: string } }
      const name = data.name ?? data.batch?.name
      if (!name) {
        throw new Error('Gemini batch create returned no job name')
      }
      return { name }
    }

    lastError = await response.text()
    const retryable = response.status === 429 || response.status === 503
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`Gemini batch create failed: ${response.status} ${lastError}`)
    }

    const retryAfterHeader = response.headers.get('retry-after')
    const retryAfterSec = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN
    const waitMs = Number.isFinite(retryAfterSec)
      ? retryAfterSec * 1000
      : Math.min(120_000, 15_000 * 2 ** (attempt - 1))

    console.warn(
      `Gemini batch create rate-limited (${response.status}), retry ${attempt}/${maxAttempts - 1} in ${Math.round(waitMs / 1000)}s...`,
    )
    await delay(waitMs)
  }

  throw new Error(`Gemini batch create failed after retries: ${lastError}`)
}

function readBatchJobState(data: Record<string, unknown>): BatchJobState {
  const metadata = data.metadata as { state?: BatchJobState } | undefined
  const batch = data.batch as { metadata?: { state?: BatchJobState } } | undefined
  const topLevel = data.state as BatchJobState | undefined

  return metadata?.state ?? batch?.metadata?.state ?? topLevel ?? 'JOB_STATE_PENDING'
}

export async function getBatchJob(name: string, apiKey: string): Promise<BatchJobStatus> {
  const response = await fetch(`${API_BASE}/${name}`, {
    headers: authHeaders(apiKey),
  })

  if (!response.ok) {
    throw new Error(
      `Gemini batch get failed: ${response.status} ${await response.text()}`,
    )
  }

  const data = (await response.json()) as Record<string, unknown>
  const metadata = data.metadata as {
    state?: BatchJobState
    displayName?: string
    output?: {
      inlinedResponses?: BatchInlineResponse[] | { inlinedResponses?: BatchInlineResponse[] }
      responsesFile?: string
    }
  } | undefined

  const output = metadata?.output
  const rawInline = output?.inlinedResponses
  const inlinedResponses = Array.isArray(rawInline)
    ? rawInline
    : rawInline?.inlinedResponses

  const legacyDest = (data.response ?? data.dest) as BatchJobStatus['dest']
  const legacyInline = legacyDest?.inlinedResponses
  const resolvedInline = inlinedResponses ?? legacyInline

  return {
    name,
    state: readBatchJobState(data),
    displayName: metadata?.displayName,
    error: data.error,
    dest: resolvedInline || output?.responsesFile || legacyDest?.fileName
      ? {
          fileName: output?.responsesFile ?? legacyDest?.fileName,
          inlinedResponses: resolvedInline,
        }
      : legacyDest,
  }
}

const TERMINAL_STATES = new Set([
  'JOB_STATE_SUCCEEDED',
  'JOB_STATE_FAILED',
  'JOB_STATE_CANCELLED',
  'JOB_STATE_EXPIRED',
  'BATCH_STATE_SUCCEEDED',
  'BATCH_STATE_FAILED',
  'BATCH_STATE_CANCELLED',
  'BATCH_STATE_EXPIRED',
])

export function isSuccessfulBatchState(state: BatchJobState): boolean {
  return state === 'JOB_STATE_SUCCEEDED' || state === 'BATCH_STATE_SUCCEEDED'
}

export async function waitForBatchJob(
  name: string,
  apiKey: string,
  options: { pollIntervalMs?: number; onPoll?: (status: BatchJobStatus) => void } = {},
): Promise<BatchJobStatus> {
  const pollIntervalMs = options.pollIntervalMs ?? 15_000

  while (true) {
    const status = await getBatchJob(name, apiKey)
    options.onPoll?.(status)

    if (TERMINAL_STATES.has(status.state)) {
      if (!isSuccessfulBatchState(status.state)) {
        throw new Error(
          `Batch job ${name} ended with state ${status.state}: ${JSON.stringify(status.error)}`,
        )
      }
      return status
    }

    await delay(pollIntervalMs)
  }
}

async function downloadResultFile(fileName: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `${API_BASE}/${fileName}:download?alt=media`,
    { headers: authHeaders(apiKey) },
  )

  if (!response.ok) {
    throw new Error(
      `Gemini batch result download failed: ${response.status} ${await response.text()}`,
    )
  }

  return response.text()
}

function parseResultLine(raw: Record<string, unknown>): BatchResultLine {
  const metadata = raw.metadata as { key?: string } | undefined
  const key = String(raw.key ?? metadata?.key ?? '')
  if (raw.error) {
    return { key, error: JSON.stringify(raw.error), usage: null }
  }

  const response = raw.response ?? raw
  const text = extractGenerateContentText(response)
  const usage = extractUsageMetadata(response)
  if (!text) {
    return { key, error: 'Empty batch response', usage }
  }

  return { key, text, usage }
}

export async function collectBatchResults(
  status: BatchJobStatus,
  apiKey: string,
): Promise<BatchJobResults> {
  const results = new Map<string, BatchResultLine>()
  const usage = createUsageTotals()

  if (status.dest?.inlinedResponses?.length) {
    for (const inline of status.dest.inlinedResponses) {
      const key = inline.metadata?.key ?? ''
      if (inline.error) {
        results.set(key, { key, error: JSON.stringify(inline.error), usage: null })
        addUsageTotals(usage, null)
        continue
      }
      const text = extractGenerateContentText(inline.response)
      const inlineUsage = extractUsageMetadata(inline.response)
      addUsageTotals(usage, inlineUsage)
      results.set(
        key,
        text ? { key, text, usage: inlineUsage } : { key, error: 'Empty inline response', usage: inlineUsage },
      )
    }
    return { results, usage }
  }

  if (status.dest?.fileName) {
    const content = await downloadResultFile(status.dest.fileName, apiKey)
    for (const line of content.split('\n')) {
      if (!line.trim()) continue
      const parsed = parseResultLine(JSON.parse(line) as Record<string, unknown>)
      if (parsed.key) {
        results.set(parsed.key, parsed)
        addUsageTotals(usage, parsed.usage)
      }
    }
    return { results, usage }
  }

  throw new Error(`Batch job ${status.name} has no inline or file results`)
}

export async function runBatchJob(
  model: string,
  items: BatchRequestItem[],
  displayName: string,
  apiKey: string,
  options: { pollIntervalMs?: number; onPoll?: (status: BatchJobStatus) => void } = {},
): Promise<Map<string, BatchResultLine>> {
  const { name } = await createBatchJob(model, items, displayName, apiKey)
  console.log(`Created batch job ${name} (${items.length} requests)`)
  const status = await waitForBatchJob(name, apiKey, options)
  const { results, usage } = await collectBatchResults(status, apiKey)
  logUsageTotals(displayName, usage)
  return results
}

/** Write JSONL to a temp file (useful for inspection/debug). */
export async function writeBatchJsonl(items: BatchRequestItem[]): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'intercom-batch-'))
  const filePath = path.join(dir, 'requests.jsonl')
  await writeFile(filePath, `${buildJsonl(items)}\n`)
  return filePath
}

export async function readBatchJsonl(filePath: string): Promise<BatchRequestItem[]> {
  const content = await readFile(filePath, 'utf8')
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as BatchRequestItem)
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  await rm(path.dirname(filePath), { recursive: true, force: true })
}
