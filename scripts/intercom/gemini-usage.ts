export interface GeminiUsageMetadata {
  promptTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
  cachedContentTokenCount?: number
  thoughtsTokenCount?: number
}

export interface GeminiUsageTotals extends GeminiUsageMetadata {
  responseCount: number
  missingUsageCount: number
}

function readTokenCount(raw: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }
  return 0
}

export function extractUsageMetadata(response: unknown): GeminiUsageMetadata | null {
  if (!response || typeof response !== 'object') {
    return null
  }

  const container = response as Record<string, unknown>
  const raw = container.usageMetadata ?? container.usage_metadata
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const usage = raw as Record<string, unknown>
  const promptTokenCount = readTokenCount(
    usage,
    'promptTokenCount',
    'prompt_token_count',
  )
  const candidatesTokenCount = readTokenCount(
    usage,
    'candidatesTokenCount',
    'candidates_token_count',
  )
  let totalTokenCount = readTokenCount(usage, 'totalTokenCount', 'total_token_count')
  if (totalTokenCount === 0 && (promptTokenCount > 0 || candidatesTokenCount > 0)) {
    totalTokenCount = promptTokenCount + candidatesTokenCount
  }

  const cachedContentTokenCount = readTokenCount(
    usage,
    'cachedContentTokenCount',
    'cached_content_token_count',
  )
  const thoughtsTokenCount = readTokenCount(
    usage,
    'thoughtsTokenCount',
    'thoughts_token_count',
  )

  if (
    promptTokenCount === 0 &&
    candidatesTokenCount === 0 &&
    totalTokenCount === 0 &&
    cachedContentTokenCount === 0 &&
    thoughtsTokenCount === 0
  ) {
    return null
  }

  return {
    promptTokenCount,
    candidatesTokenCount,
    totalTokenCount,
    ...(cachedContentTokenCount > 0 ? { cachedContentTokenCount } : {}),
    ...(thoughtsTokenCount > 0 ? { thoughtsTokenCount } : {}),
  }
}

export function createUsageTotals(): GeminiUsageTotals {
  return {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
    totalTokenCount: 0,
    responseCount: 0,
    missingUsageCount: 0,
  }
}

export function addUsageTotals(
  totals: GeminiUsageTotals,
  usage: GeminiUsageMetadata | null | undefined,
): void {
  if (!usage) {
    totals.missingUsageCount += 1
    return
  }

  totals.responseCount += 1
  totals.promptTokenCount += usage.promptTokenCount
  totals.candidatesTokenCount += usage.candidatesTokenCount
  totals.totalTokenCount += usage.totalTokenCount

  if (usage.cachedContentTokenCount) {
    totals.cachedContentTokenCount =
      (totals.cachedContentTokenCount ?? 0) + usage.cachedContentTokenCount
  }
  if (usage.thoughtsTokenCount) {
    totals.thoughtsTokenCount =
      (totals.thoughtsTokenCount ?? 0) + usage.thoughtsTokenCount
  }
}

function formatTokenCount(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatUsageTotalsLine(
  label: string,
  totals: GeminiUsageTotals,
): string {
  const parts = [
    `prompt=${formatTokenCount(totals.promptTokenCount)}`,
    `output=${formatTokenCount(totals.candidatesTokenCount)}`,
    `total=${formatTokenCount(totals.totalTokenCount)}`,
  ]

  if (totals.cachedContentTokenCount) {
    parts.push(`cached=${formatTokenCount(totals.cachedContentTokenCount)}`)
  }
  if (totals.thoughtsTokenCount) {
    parts.push(`thoughts=${formatTokenCount(totals.thoughtsTokenCount)}`)
  }

  const responseNote =
    totals.missingUsageCount > 0
      ? `${totals.responseCount} with usage, ${totals.missingUsageCount} missing`
      : `${totals.responseCount} responses`

  return `Gemini token usage (${label}): ${responseNote}, ${parts.join(', ')}`
}

export function logUsageTotals(label: string, totals: GeminiUsageTotals): void {
  if (totals.responseCount === 0 && totals.missingUsageCount === 0) {
    return
  }

  console.log(formatUsageTotalsLine(label, totals))
}
