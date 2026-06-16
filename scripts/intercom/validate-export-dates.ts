export interface SearchHitWithDate {
  id: string
  created_at: number
}

export interface DateSenseCheckOptions {
  /** Every hit must have created_at strictly before this instant. */
  beforeExclusiveIso: string
  /** Reject hits older than this (catches wrong historical batches). */
  notBeforeInclusiveIso?: string
  expectedCount: number
}

export interface DateSenseCheckResult {
  ok: boolean
  errors: string[]
  oldest: string | null
  newest: string | null
  count: number
}

export function unixToIso(unix: number): string {
  return new Date(unix * 1000).toISOString()
}

export function isoToUnix(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000)
}

export function senseCheckSearchHits(
  hits: SearchHitWithDate[],
  options: DateSenseCheckOptions,
): DateSenseCheckResult {
  const errors: string[] = []
  const beforeUnix = isoToUnix(options.beforeExclusiveIso)
  const floorUnix = options.notBeforeInclusiveIso
    ? isoToUnix(options.notBeforeInclusiveIso)
    : null

  if (hits.length !== options.expectedCount) {
    errors.push(
      `Expected ${options.expectedCount} conversations, got ${hits.length}`,
    )
  }

  let oldestUnix = Infinity
  let newestUnix = -Infinity

  for (const hit of hits) {
    if (hit.created_at >= beforeUnix) {
      errors.push(
        `Conversation ${hit.id} is on/after anchor (${unixToIso(hit.created_at)} >= ${options.beforeExclusiveIso})`,
      )
    }

    if (floorUnix != null && hit.created_at < floorUnix) {
      errors.push(
        `Conversation ${hit.id} is before allowed floor (${unixToIso(hit.created_at)} < ${options.notBeforeInclusiveIso})`,
      )
    }

    oldestUnix = Math.min(oldestUnix, hit.created_at)
    newestUnix = Math.max(newestUnix, hit.created_at)
  }

  if (hits.length > 0 && newestUnix < beforeUnix - 90 * 24 * 60 * 60) {
    errors.push(
      `Newest conversation (${unixToIso(newestUnix)}) is more than 90 days before anchor ${options.beforeExclusiveIso} — likely wrong batch`,
    )
  }

  return {
    ok: errors.length === 0,
    errors,
    oldest: hits.length > 0 ? unixToIso(oldestUnix) : null,
    newest: hits.length > 0 ? unixToIso(newestUnix) : null,
    count: hits.length,
  }
}

export function formatSenseCheckReport(result: DateSenseCheckResult): string {
  const lines = [
    `Date sense check: ${result.ok ? 'PASSED' : 'FAILED'}`,
    `  Count: ${result.count}`,
    `  Newest: ${result.newest ?? 'n/a'}`,
    `  Oldest: ${result.oldest ?? 'n/a'}`,
  ]

  for (const error of result.errors) {
    lines.push(`  ✗ ${error}`)
  }

  return lines.join('\n')
}
