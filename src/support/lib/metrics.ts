import type { Conversation, Medium, Resolution } from '../types'
import { isFinResolved } from './resolution'

export type ChannelFilter = 'all' | 'chat' | 'email'
export type DatePreset = 'all' | '7d' | '14d' | '30d' | '90d'

export interface Filters {
  channel: ChannelFilter
  datePreset: DatePreset
  /** When true, exclude non-support mail (prospection, spam, recruitment...). */
  supportOnly: boolean
  search: string
}

export const DEFAULT_FILTERS: Filters = {
  channel: 'all',
  datePreset: 'all',
  supportOnly: true,
  search: '',
}

export const DATE_PRESET_DAYS: Record<Exclude<DatePreset, 'all'>, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '90d': 90,
}

export interface ResolutionCounts {
  fin_confirmed: number
  fin_assumed: number
  fin_escalated: number
  human_only: number
  total: number
}

export interface TopicStat {
  topic: string
  category: string
  total: number
  counts: ResolutionCounts
  /** (confirmed + assumed) / total */
  resolvedRate: number
  escalatedRate: number
}

export interface CategoryStat {
  category: string
  total: number
  counts: ResolutionCounts
  resolvedRate: number
  topics: TopicStat[]
}

export interface ContactReason {
  category: string
  total: number
  topics: { topic: string; total: number }[]
}

export interface Kpis {
  total: number
  chatTotal: number
  emailTotal: number
  /** Fin autonomous resolution rate across Fin-eligible conversations in scope. */
  finResolvedRate: number
  finResolvedCount: number
  /** Denominator for Fin resolution (chats when Fin applies; 0 on email-only). */
  finScopeTotal: number
  finScopeLabel: 'chats' | 'emails' | 'conversations'
  escalatedCount: number
  escalatedRate: number
  confirmedCount: number
  assumedCount: number
}

function emptyCounts(): ResolutionCounts {
  return {
    fin_confirmed: 0,
    fin_assumed: 0,
    fin_escalated: 0,
    human_only: 0,
    total: 0,
  }
}

function tally(counts: ResolutionCounts, resolution: Resolution): void {
  counts[resolution] += 1
  counts.total += 1
}

function resolvedRate(counts: ResolutionCounts): number {
  if (counts.total === 0) return 0
  return (counts.fin_confirmed + counts.fin_assumed) / counts.total
}

function escalatedRate(counts: ResolutionCounts): number {
  if (counts.total === 0) return 0
  return counts.fin_escalated / counts.total
}

export function cutoffForPreset(preset: DatePreset, dateMax: string): number | null {
  if (preset === 'all') return null
  const days = DATE_PRESET_DAYS[preset]
  return new Date(dateMax).getTime() - days * 86_400_000
}

export function filterConversations(
  conversations: Conversation[],
  filters: Filters,
  dateMax: string,
): Conversation[] {
  const cutoff = cutoffForPreset(filters.datePreset, dateMax)
  const search = filters.search.trim().toLowerCase()

  return conversations.filter((c) => {
    if (filters.channel !== 'all' && c.medium !== filters.channel) return false
    if (filters.supportOnly && !c.isSupportTicket) return false
    if (cutoff !== null && new Date(c.createdAt).getTime() < cutoff) return false
    if (search) {
      const haystack = `${c.title ?? ''} ${c.summary ?? ''} ${c.topic} ${c.topicCategory}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

export function byMedium(conversations: Conversation[], medium: Medium): Conversation[] {
  return conversations.filter((c) => c.medium === medium)
}

export function computeKpis(filtered: Conversation[], channel: ChannelFilter = 'all'): Kpis {
  const chat = filtered.filter((c) => c.medium === 'chat')
  const email = filtered.filter((c) => c.medium === 'email')
  const chatCounts = emptyCounts()
  for (const c of chat) tally(chatCounts, c.resolution)

  // Email is always human-handled — Fin never intervenes.
  if (channel === 'email') {
    const emailTotal = email.length
    return {
      total: filtered.length,
      chatTotal: 0,
      emailTotal,
      finResolvedRate: 0,
      finResolvedCount: 0,
      finScopeTotal: 0,
      finScopeLabel: 'emails',
      escalatedCount: emailTotal,
      escalatedRate: emailTotal > 0 ? 1 : 0,
      confirmedCount: 0,
      assumedCount: 0,
    }
  }

  const finResolvedCount = chatCounts.fin_confirmed + chatCounts.fin_assumed

  // Chat-only: Fin metrics scoped to the chat channel.
  if (channel === 'chat') {
    return {
      total: filtered.length,
      chatTotal: chat.length,
      emailTotal: 0,
      finResolvedRate: resolvedRate(chatCounts),
      finResolvedCount,
      finScopeTotal: chat.length,
      finScopeLabel: 'chats',
      escalatedCount: chatCounts.fin_escalated,
      escalatedRate: escalatedRate(chatCounts),
      confirmedCount: chatCounts.fin_confirmed,
      assumedCount: chatCounts.fin_assumed,
    }
  }

  // All channels: overall rates (email counts as non–Fin-resolved).
  const total = filtered.length
  const withoutFinResolution = total - finResolvedCount

  return {
    total,
    chatTotal: chat.length,
    emailTotal: email.length,
    finResolvedRate: total > 0 ? finResolvedCount / total : 0,
    finResolvedCount,
    finScopeTotal: total,
    finScopeLabel: 'conversations',
    escalatedCount: withoutFinResolution,
    escalatedRate: total > 0 ? withoutFinResolution / total : 0,
    confirmedCount: chatCounts.fin_confirmed,
    assumedCount: chatCounts.fin_assumed,
  }
}

/** Volume of contact reasons across all channels in the filtered set. */
export function computeContactReasons(filtered: Conversation[]): ContactReason[] {
  const byCategory = new Map<string, Map<string, number>>()

  for (const c of filtered) {
    if (!byCategory.has(c.topicCategory)) byCategory.set(c.topicCategory, new Map())
    const topics = byCategory.get(c.topicCategory)!
    topics.set(c.topic, (topics.get(c.topic) ?? 0) + 1)
  }

  const reasons: ContactReason[] = []
  for (const [category, topics] of byCategory) {
    const topicList = [...topics.entries()]
      .map(([topic, total]) => ({ topic, total }))
      .sort((a, b) => b.total - a.total)
    const total = topicList.reduce((sum, t) => sum + t.total, 0)
    reasons.push({ category, total, topics: topicList })
  }

  return reasons.sort((a, b) => b.total - a.total)
}

/** Fin resolution performance per topic, scoped to chat conversations. */
export function computeFinTopicStats(chatConversations: Conversation[]): TopicStat[] {
  const byTopic = new Map<string, { category: string; counts: ResolutionCounts }>()

  for (const c of chatConversations) {
    if (!byTopic.has(c.topic)) {
      byTopic.set(c.topic, { category: c.topicCategory, counts: emptyCounts() })
    }
    tally(byTopic.get(c.topic)!.counts, c.resolution)
  }

  const stats: TopicStat[] = []
  for (const [topic, { category, counts }] of byTopic) {
    stats.push({
      topic,
      category,
      total: counts.total,
      counts,
      resolvedRate: resolvedRate(counts),
      escalatedRate: escalatedRate(counts),
    })
  }
  return stats.sort((a, b) => b.total - a.total)
}

export function computeFinCategoryStats(
  topicStats: TopicStat[],
  categoryOrder: string[],
): CategoryStat[] {
  const byCategory = new Map<string, CategoryStat>()

  for (const stat of topicStats) {
    if (!byCategory.has(stat.category)) {
      byCategory.set(stat.category, {
        category: stat.category,
        total: 0,
        counts: emptyCounts(),
        resolvedRate: 0,
        topics: [],
      })
    }
    const cat = byCategory.get(stat.category)!
    cat.topics.push(stat)
    cat.total += stat.total
    cat.counts.fin_confirmed += stat.counts.fin_confirmed
    cat.counts.fin_assumed += stat.counts.fin_assumed
    cat.counts.fin_escalated += stat.counts.fin_escalated
    cat.counts.human_only += stat.counts.human_only
    cat.counts.total += stat.counts.total
  }

  const cats = [...byCategory.values()]
  for (const cat of cats) {
    cat.resolvedRate = resolvedRate(cat.counts)
    cat.topics.sort((a, b) => b.total - a.total)
  }

  cats.sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category)
    const bi = categoryOrder.indexOf(b.category)
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    return b.total - a.total
  })
  return cats
}

export interface TrendBucket {
  start: number
  label: string
  fin_confirmed: number
  fin_assumed: number
  fin_escalated: number
  human_only: number
  total: number
}

/** Weekly volume buckets split by resolution outcome (chat) / channel. */
export function computeWeeklyTrend(
  filtered: Conversation[],
  dateMin: string,
  dateMax: string,
): TrendBucket[] {
  const weekMs = 7 * 86_400_000
  const start = new Date(dateMin).getTime()
  const end = new Date(dateMax).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return []

  const buckets: TrendBucket[] = []
  for (let t = start; t <= end; t += weekMs) {
    buckets.push({
      start: t,
      label: '',
      fin_confirmed: 0,
      fin_assumed: 0,
      fin_escalated: 0,
      human_only: 0,
      total: 0,
    })
  }
  if (buckets.length === 0) return []

  for (const c of filtered) {
    const t = new Date(c.createdAt).getTime()
    let index = Math.floor((t - start) / weekMs)
    if (index < 0) index = 0
    if (index >= buckets.length) index = buckets.length - 1
    const bucket = buckets[index]
    bucket[c.resolution] += 1
    bucket.total += 1
  }
  return buckets
}

export interface ConversationFilter {
  topic?: string
  category?: string
  resolution?: Resolution | 'resolved' | 'all'
}

export function selectConversations(
  chatConversations: Conversation[],
  filter: ConversationFilter,
): Conversation[] {
  // Topic / category selection from chat (Fin scope) by default.
  let pool = chatConversations
  if (filter.category && !filter.topic) {
    pool = pool.filter((c) => c.topicCategory === filter.category)
  }
  if (filter.topic) {
    pool = pool.filter((c) => c.topic === filter.topic)
  }

  if (filter.resolution && filter.resolution !== 'all') {
    if (filter.resolution === 'resolved') {
      pool = pool.filter((c) => isFinResolved(c.resolution))
    } else {
      pool = pool.filter((c) => c.resolution === filter.resolution)
    }
  }

  return [...pool].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
