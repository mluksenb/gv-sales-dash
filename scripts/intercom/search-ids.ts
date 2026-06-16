const INTERCOM_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'Intercom-Version': '2.11',
} as const

export const DEFAULT_RECENT_LIMIT = 200

interface SearchConversationHit {
  id: string
  created_at: number
}

interface SearchResponse {
  conversations: SearchConversationHit[]
  pages?: { next?: { starting_after?: string } }
}

interface CreatedAtRange {
  createdAfter?: number
  createdBefore?: number
}

function authHeaders(token: string): Record<string, string> {
  return {
    ...INTERCOM_HEADERS,
    Authorization: `Bearer ${token}`,
  }
}

export function buildSearchQuery(range: CreatedAtRange): Record<string, unknown> {
  const filters: Array<Record<string, unknown>> = [
    { field: 'state', operator: '=', value: 'closed' },
  ]

  if (range.createdAfter != null) {
    filters.push({ field: 'created_at', operator: '>', value: range.createdAfter })
  }

  if (range.createdBefore != null) {
    filters.push({ field: 'created_at', operator: '<', value: range.createdBefore })
  }

  return {
    operator: 'AND',
    value: filters,
  }
}

export interface SearchRecentOptions {
  limit?: number
  offset?: number
  excludeIds?: Set<string>
}

export function pickMostRecentByCreatedAt(
  hits: SearchConversationHit[],
  limit: number,
  offset = 0,
  excludeIds?: Set<string>,
): string[] {
  const filtered = excludeIds
    ? hits.filter((hit) => !excludeIds.has(String(hit.id)))
    : hits

  return [...filtered]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(offset, offset + limit)
    .map((hit) => String(hit.id))
}

async function searchPage(
  token: string,
  range: CreatedAtRange,
  perPage: number,
  startingAfter?: string,
): Promise<SearchResponse> {
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch('https://api.intercom.io/conversations/search', {
        method: 'POST',
        headers: authHeaders(token),
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          query: buildSearchQuery(range),
          pagination: {
            per_page: perPage,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
          },
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}\n${body}`,
        )
      }

      return (await response.json()) as SearchResponse
    } catch (error) {
      if (attempt === maxAttempts) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }

  throw new Error('Search page failed after retries')
}

async function searchAllInRange(
  token: string,
  range: CreatedAtRange,
): Promise<SearchConversationHit[]> {
  const hits: SearchConversationHit[] = []
  let startingAfter: string | undefined

  do {
    const data = await searchPage(token, range, 150, startingAfter)
    hits.push(...(data.conversations ?? []))
    startingAfter = data.pages?.next?.starting_after
  } while (startingAfter)

  return hits
}

/**
 * Returns up to `limit` closed conversation IDs across all channels,
 * ranked by created_at (newest first). Use `offset` to page (e.g. offset 200
 * for conversations ranked 201–400). Intercom search has no server-side sort,
 * so we paginate within expanding date windows and sort client-side.
 */
export async function searchRecentConversationIds(
  token: string,
  options: SearchRecentOptions | number = DEFAULT_RECENT_LIMIT,
): Promise<string[]> {
  const limit =
    typeof options === 'number' ? options : (options.limit ?? DEFAULT_RECENT_LIMIT)
  const offset = typeof options === 'number' ? 0 : (options.offset ?? 0)
  const excludeIds = typeof options === 'number' ? undefined : options.excludeIds
  const needed = offset + limit

  const windowDays = [14, 30, 60, 90, 120, 180, 365, 730, 1095]
  const nowSeconds = Math.floor(Date.now() / 1000)

  for (const days of windowDays) {
    const createdAfter = nowSeconds - days * 24 * 60 * 60
    const hits = await searchAllInRange(token, { createdAfter })

    if (hits.length >= needed) {
      return pickMostRecentByCreatedAt(hits, limit, offset, excludeIds)
    }
  }

  throw new Error(
    `Only found fewer than ${needed} closed conversations in the searched date windows`,
  )
}

export interface SearchOlderOptions {
  /** Unix seconds — only conversations strictly older than this anchor. */
  beforeCreatedAtUnix: number
  limit: number
  excludeIds?: Set<string>
}

async function collectOlderHits(
  token: string,
  options: SearchOlderOptions,
): Promise<SearchConversationHit[]> {
  const { beforeCreatedAtUnix, limit, excludeIds } = options
  const windowDays = [30, 60, 90, 120, 180, 365, 730, 1095, 1460, 1825]

  for (const days of windowDays) {
    const createdAfter = beforeCreatedAtUnix - days * 24 * 60 * 60
    const hits = await searchAllInRange(token, {
      createdAfter,
      createdBefore: beforeCreatedAtUnix,
    })

    const available = excludeIds
      ? hits.filter((hit) => !excludeIds.has(String(hit.id)))
      : hits

    if (available.length >= limit) {
      return available
    }
  }

  throw new Error(
    `Only found fewer than ${limit} closed conversations older than the manifest anchor`,
  )
}

/**
 * Returns search hits for the next older batch (includes `created_at` for sense checks).
 */
export async function searchOlderConversationHits(
  token: string,
  options: SearchOlderOptions,
): Promise<SearchConversationHit[]> {
  return collectOlderHits(token, options)
}

/**
 * Returns the next `limit` closed conversations older than a manifest anchor.
 * Searches backward in bounded windows below `beforeCreatedAtUnix` instead of
 * re-scanning from today and slicing a large global offset.
 */
export async function searchOlderConversationIds(
  token: string,
  options: SearchOlderOptions,
): Promise<string[]> {
  const { limit, excludeIds } = options
  const hits = await collectOlderHits(token, options)
  return pickMostRecentByCreatedAt(hits, limit, 0, excludeIds)
}
