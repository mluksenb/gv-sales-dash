import { useMemo, useState } from 'react'
import {
  Activity,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  PartyPopper,
  PhoneCall,
  Sparkles,
} from 'lucide-react'
import { format, parseISO, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { timelineEvents } from '../data/mockData'
import { ALL_INTERCOM_TOPICS, INTERCOM_TOPIC_TO_CATEGORY } from '../lib/intercomTaxonomy'
import type { TimelineEvent, TimelineEventCategory, TimelineIntercomDetail } from '../types'
import { categoryColor } from '../support/lib/categories'
import { IntercomConversationFilter } from './IntercomConversationFilter'

const ENABLED_CATEGORIES: TimelineEventCategory[] = [
  'Notes',
  'Intercom',
  'Appels',
  'Rendez-vous',
  'Conformité',
  'Blocages',
  'Souscriptions',
  'Relances',
  'Tickets',
]

const DISABLED_CATEGORIES: TimelineEventCategory[] = ['Emails', 'Transactionnel', 'Marketing']

const TIME_RANGES = [
  { id: '7', label: '7 jours', days: 7 },
  { id: '30', label: '30 jours', days: 30 },
  { id: '90', label: '90 jours', days: 90 },
  { id: 'all', label: 'Tout', days: null },
] as const

type TimeRangeId = (typeof TIME_RANGES)[number]['id']

const DEFAULT_ENABLED = new Set<TimelineEventCategory>(ENABLED_CATEGORIES)
const DEFAULT_INTERCOM_TOPICS = new Set(ALL_INTERCOM_TOPICS)

function formatEventDate(iso: string): string {
  return format(parseISO(iso), "d MMM · HH:mm", { locale: fr })
}

function formatMonthKey(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM')
}

function formatMonthLabel(iso: string): string {
  return format(parseISO(iso), 'MMM yyyy', { locale: fr }).toUpperCase()
}

function EventIcon({ icon }: { icon: TimelineEvent['icon'] }) {
  if (icon === 'relance') {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <PhoneCall size={15} className="text-emerald-600" strokeWidth={2} />
      </div>
    )
  }
  if (icon === 'intercom') {
    return (
      <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
        <MessageCircle size={15} className="text-sky-600" strokeWidth={2} />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
      <PartyPopper size={15} className="text-teal-600" strokeWidth={2} />
    </div>
  )
}

function SubcategoryTag({ label, accentColor }: { label: string; accentColor: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
    >
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
      {label}
    </span>
  )
}

function IntercomEventRow({ event, intercom }: { event: TimelineEvent; intercom: TimelineIntercomDetail }) {
  const [summaryOpen, setSummaryOpen] = useState(true)
  const metaParts = [formatEventDate(event.occurredAt)]
  if (event.author) metaParts.push(event.author)

  return (
    <div className="relative flex gap-3 pb-8 last:pb-0">
      <div className="relative z-10 shrink-0">
        <EventIcon icon="intercom" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-[13px] font-semibold text-gray-900 leading-tight">{intercom.subject}</h4>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-gray-600 border border-gray-200 bg-white">
            Intercom
          </span>
        </div>

        <div className="mt-1 text-[12px] text-gray-400">{metaParts.join(' · ')}</div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {intercom.topics.map((topic) => (
            <SubcategoryTag
              key={topic}
              label={topic}
              accentColor={categoryColor(INTERCOM_TOPIC_TO_CATEGORY[topic] ?? 'Divers')}
            />
          ))}
        </div>

        <div className="mt-2.5 overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white">
          <button
            type="button"
            onClick={() => setSummaryOpen((value) => !value)}
            className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-left transition-colors hover:bg-violet-50/60 ${
              summaryOpen ? 'border-b border-violet-100/70' : ''
            }`}
            aria-expanded={summaryOpen}
          >
            <Sparkles size={11} className="shrink-0 text-violet-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
              Résumé généré par IA
            </span>
            <ChevronDown
              size={13}
              className={`shrink-0 text-violet-400 transition-transform ${summaryOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {summaryOpen && (
            <p className="px-3 py-2.5 text-[12px] leading-relaxed text-gray-600">{intercom.issueSummary}</p>
          )}
        </div>

        {intercom.intercomUrl && (
          <div className="mt-2.5">
            <a
              href={intercom.intercomUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-700 hover:text-gray-900"
            >
              Ouvrir
              <ExternalLink size={11} strokeWidth={2} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineEventRow({ event }: { event: TimelineEvent }) {
  if (event.intercom) {
    return <IntercomEventRow event={event} intercom={event.intercom} />
  }

  const metaParts = [formatEventDate(event.occurredAt)]
  if (event.author) metaParts.push(event.author)

  return (
    <div className="relative flex gap-3 pb-8 last:pb-0">
      <div className="relative z-10 shrink-0">
        <EventIcon icon={event.icon} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4 className="text-[13px] font-semibold text-gray-900 leading-tight">{event.title}</h4>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-gray-600 border border-gray-200 bg-white">
            {event.category === 'Relances' ? 'Relance' : event.category === 'Souscriptions' ? 'Souscription' : event.category}
          </span>
        </div>
        <div className="text-[12px] text-gray-400 mb-1.5">{metaParts.join(' · ')}</div>
        {event.description && (
          <p className="text-[13px] text-gray-500 leading-snug">{event.description}</p>
        )}
        {event.href && (
          <a
            href={event.href}
            className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-gray-700 hover:text-gray-900"
          >
            Ouvrir
            <ExternalLink size={11} strokeWidth={2} />
          </a>
        )}
      </div>
    </div>
  )
}

export function ActivityTimelineTab() {
  const [enabledCategories, setEnabledCategories] = useState(DEFAULT_ENABLED)
  const [selectedIntercomTopics, setSelectedIntercomTopics] = useState(DEFAULT_INTERCOM_TOPICS)
  const [timeRange, setTimeRange] = useState<TimeRangeId>('all')
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(() => new Set())

  const filteredEvents = useMemo(() => {
    const now = parseISO('2026-05-23T16:13:00')
    const range = TIME_RANGES.find((r) => r.id === timeRange)
    const cutoff = range?.days != null ? subDays(now, range.days) : null

    return timelineEvents
      .filter((event) => enabledCategories.has(event.category))
      .filter((event) => {
        if (event.category === 'Intercom' && event.intercom) {
          return event.intercom.topics.some((topic) => selectedIntercomTopics.has(topic))
        }
        return true
      })
      .filter((event) => {
        if (!cutoff) return true
        return parseISO(event.occurredAt) >= cutoff
      })
      .sort((a, b) => parseISO(b.occurredAt).getTime() - parseISO(a.occurredAt).getTime())
  }, [enabledCategories, selectedIntercomTopics, timeRange])

  const groupedByMonth = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>()
    for (const event of filteredEvents) {
      const key = formatMonthKey(event.occurredAt)
      const existing = groups.get(key) ?? []
      existing.push(event)
      groups.set(key, existing)
    }
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
  }, [filteredEvents])

  const toggleCategory = (category: TimelineEventCategory) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const resetFilters = () => {
    setEnabledCategories(new Set(DEFAULT_ENABLED))
    setSelectedIntercomTopics(new Set(DEFAULT_INTERCOM_TOPICS))
    setTimeRange('all')
  }

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(monthKey)) next.delete(monthKey)
      else next.add(monthKey)
      return next
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
          <Activity size={16} className="text-gray-600" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Timeline d&apos;activité</h3>
        <span className="text-[13px] text-gray-400">
          {filteredEvents.length} événement{filteredEvents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {ENABLED_CATEGORIES.map((category) => {
          const isOn = enabledCategories.has(category)
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                isOn
                  ? 'bg-[#0E1111] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          )
        })}
        {DISABLED_CATEGORIES.map((category) => (
          <span
            key={category}
            title="Bientôt disponible"
            className="px-3 py-1.5 rounded-full text-[12px] font-medium text-gray-400 bg-white border border-gray-200 line-through cursor-not-allowed"
          >
            {category}
          </span>
        ))}
      </div>

      {/* Time filters + Intercom filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetFilters}
            className="text-[12px] font-medium text-gray-500 hover:text-gray-700"
          >
            Tout réinitialiser
          </button>
          <div className="flex items-center gap-1.5">
            {TIME_RANGES.map((range) => {
              const isActive = timeRange === range.id
              return (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-gray-900 border border-gray-900'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              )
            })}
          </div>
        </div>

        <IntercomConversationFilter
          selectedTopics={selectedIntercomTopics}
          onChange={setSelectedIntercomTopics}
        />
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {groupedByMonth.map(([monthKey, events]) => {
          const isCollapsed = collapsedMonths.has(monthKey)
          const monthLabel = formatMonthLabel(events[0].occurredAt)

          return (
            <div key={monthKey}>
              <button
                type="button"
                onClick={() => toggleMonth(monthKey)}
                className="flex items-center gap-2 w-full mb-4 group"
              >
                <ChevronDown
                  size={14}
                  className={`text-gray-400 shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                />
                <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase whitespace-nowrap">
                  {monthLabel}
                </span>
                <span className="text-[11px] font-semibold text-gray-400">{events.length}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </button>

              {!isCollapsed && (
                <div className="relative pl-1">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />
                  {events.map((event) => (
                    <TimelineEventRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {groupedByMonth.length === 0 && (
          <p className="text-[13px] text-gray-400 py-8 text-center">Aucun événement pour ces filtres.</p>
        )}
      </div>
    </div>
  )
}
