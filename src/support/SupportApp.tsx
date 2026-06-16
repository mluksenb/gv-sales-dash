import { useMemo, useState } from 'react'
import { AlertTriangle, MessageSquare, Sparkles } from 'lucide-react'
import { useDashboardData } from './lib/useData'
import {
  DEFAULT_FILTERS,
  computeContactReasons,
  computeFinTopicStats,
  computeKpis,
  computeWeeklyTrend,
  filterConversations,
  type Filters,
} from './lib/metrics'
import { formatDate } from './lib/format'
import { categoryColor } from './lib/categories'
import { pct } from './lib/format'
import { Card, SectionTitle } from './components/ui'
import { FilterBar } from './components/FilterBar'
import { KpiRow } from './components/KpiRow'
import { TrendChart } from './components/TrendChart'
import { ResolutionLegend } from './components/StackedResolutionBar'
import { ContactReasons } from './components/ContactReasons'
import { PriorityMatrix } from './components/PriorityMatrix'
import { FinPerformanceTable } from './components/FinPerformanceTable'
import { ConversationPanel, type Selection } from './components/ConversationPanel'
import { PasswordGate } from './components/PasswordGate'

export function SupportApp() {
  const state = useDashboardData()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [includeAdditionalTopics, setIncludeAdditionalTopics] = useState(false)

  const data = state.data

  const topicToCategory = useMemo(() => {
    const map = new Map<string, string>()
    if (!data) return map
    for (const [category, topics] of Object.entries(data.meta.topicsByCategory)) {
      for (const topic of topics) map.set(topic, category)
    }
    return map
  }, [data])

  const datasetTotals = useMemo(() => {
    if (!data) return { total: 0, supportTickets: 0 }
    const supportTickets = data.conversations.filter((c) => c.isSupportTicket).length
    return { total: data.conversations.length, supportTickets }
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    return filterConversations(data.conversations, filters, data.meta.dateMax)
  }, [data, filters])

  const chatFiltered = useMemo(() => filtered.filter((c) => c.medium === 'chat'), [filtered])

  const kpis = useMemo(() => computeKpis(filtered, filters.channel), [filtered, filters.channel])
  const contactReasons = useMemo(
    () =>
      computeContactReasons(filtered, {
        includeAdditionalTopics,
        topicToCategory,
      }),
    [filtered, includeAdditionalTopics, topicToCategory],
  )
  const contactReasonTotal = useMemo(
    () =>
      includeAdditionalTopics
        ? contactReasons.reduce((sum, r) => sum + r.total, 0)
        : filtered.length,
    [contactReasons, includeAdditionalTopics, filtered.length],
  )
  const finStats = useMemo(() => computeFinTopicStats(chatFiltered), [chatFiltered])
  const trend = useMemo(() => {
    if (!data) return []
    return computeWeeklyTrend(filtered, data.meta.dateMin, data.meta.dateMax)
  }, [filtered, data])

  const priorities = useMemo(
    () =>
      [...finStats]
        .filter((s) => s.total >= 8)
        .sort((a, b) => b.total * (1 - b.resolvedRate) - a.total * (1 - a.resolvedRate))
        .slice(0, 3),
    [finStats],
  )

  function selectTopic(topic: string) {
    setSelection({ type: 'topic', value: topic, category: topicToCategory.get(topic) ?? 'Divers' })
  }
  function selectCategory(category: string) {
    setSelection({ type: 'category', value: category, category })
  }

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-forest" />
          Chargement des données support…
        </div>
      </div>
    )
  }

  if (state.status === 'locked' || state.status === 'unlocking') {
    return (
      <PasswordGate
        onSubmit={state.unlock}
        unlocking={state.status === 'unlocking'}
        error={state.attemptError}
      />
    )
  }

  if (state.status === 'error' || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <h1 className="mb-1 font-bold text-red-800">Impossible de charger les données</h1>
          <p className="text-sm text-red-600">
            {state.error ?? 'Données indisponibles.'}
          </p>
          <p className="mt-3 text-xs text-red-500">
            Local&nbsp;: <code className="rounded bg-red-100 px-1">npm run intercom:dashboard-data:local</code>
            {' · '}
            Déploiement&nbsp;:{' '}
            <code className="rounded bg-red-100 px-1">SUPPORT_DATA_PASSWORD=… npm run intercom:dashboard-data</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f6f7f5]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Support Insights · Goodvest
                </h1>
                <p className="text-xs text-slate-500">
                  Raisons de contact & performance de l'agent IA (Fin)
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>
                Données du {formatDate(data.meta.dateMin)} au {formatDate(data.meta.dateMax)}
              </div>
              <div>
                {datasetTotals.total.toLocaleString('fr-FR')} conversations analysées (
                {datasetTotals.supportTickets.toLocaleString('fr-FR')} tickets support confirmés)
              </div>
            </div>
          </div>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
      </header>

      <main className="mx-auto max-w-[92rem] space-y-5 px-6 py-6">
        <KpiRow kpis={kpis} channel={filters.channel} />

        {/* High level: what + when */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <SectionTitle
              title="Que nous demandent les clients ?"
              subtitle={
                includeAdditionalTopics
                  ? 'Volume par catégorie et sous-catégorie — une conversation peut compter plusieurs fois si elle comporte plusieurs sujets'
                  : 'Volume par catégorie et sous-catégorie — sujet principal uniquement'
              }
              right={
                <button
                  type="button"
                  onClick={() => setIncludeAdditionalTopics((v) => !v)}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                >
                  {includeAdditionalTopics
                    ? 'Exclure les sujets additionnels'
                    : 'Inclure les sujets additionnels'}
                </button>
              }
            />
            <ContactReasons
              reasons={contactReasons}
              total={contactReasonTotal}
              onSelectCategory={selectCategory}
              onSelectTopic={selectTopic}
            />
          </Card>

          <Card className="p-5">
            <SectionTitle
              title="Volume dans le temps"
              subtitle="Conversations par semaine, réparties par issue"
            />
            <TrendChart buckets={trend} />
            <div className="mt-4 border-t border-slate-100 pt-3">
              <ResolutionLegend />
            </div>
          </Card>
        </div>

        {/* Hero: Fin performance by topic */}
        <Card className="p-5">
          <SectionTitle
            title="Performance de Fin par sujet"
            subtitle="Volume vs taux de résolution autonome (conversations chat, où Fin intervient)"
            right={
              <div className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-500 sm:flex">
                <MessageSquare className="h-3.5 w-3.5" />
                {chatFiltered.length} chats
              </div>
            }
          />

          {chatFiltered.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-12 text-center text-sm text-slate-400">
              Fin n'intervient que sur le chat. Sélectionnez « Chat » ou « Tous les canaux » pour voir sa
              performance.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <PriorityMatrix
                  stats={finStats}
                  selectedTopic={selection?.type === 'topic' ? selection.value : null}
                  onSelect={selectTopic}
                />
              </div>
              <div>
                <FinPerformanceTable
                  stats={finStats}
                  selectedTopic={selection?.type === 'topic' ? selection.value : null}
                  onSelect={selectTopic}
                />
              </div>
            </div>
          )}

          {priorities.length > 0 && (
            <div className="mt-5 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-transparent p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-500">
                <AlertTriangle className="h-3.5 w-3.5" />
                Priorités d'amélioration · fort volume, faible résolution
              </div>
              <div className="flex flex-wrap gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.topic}
                    onClick={() => selectTopic(p.topic)}
                    className="group flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-left transition-colors hover:border-red-200 hover:bg-red-50"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: categoryColor(p.category) }}
                    />
                    <span className="text-sm font-semibold text-slate-700">{p.topic}</span>
                    <span className="text-xs text-slate-400">
                      {p.total} conv · <span className="font-semibold text-red-500">{pct(p.resolvedRate)}</span> résolus
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </main>

      <ConversationPanel
        selection={selection}
        conversations={filtered}
        workspaceId={data.meta.intercomWorkspaceId}
        includeAdditionalTopics={includeAdditionalTopics}
        topicToCategory={topicToCategory}
        onClose={() => setSelection(null)}
      />
    </div>
  )
}
