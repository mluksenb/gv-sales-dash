import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { Conversation, Resolution } from '../types'
import {
  selectConversations,
  type ConversationFilter,
  type ResolutionCounts,
} from '../lib/metrics'
import { categoryColor } from '../lib/categories'
import { formatNumber, pct } from '../lib/format'
import { StackedResolutionBar } from './StackedResolutionBar'
import { ConversationRow } from './ConversationRow'

export interface Selection {
  type: 'topic' | 'category'
  value: string
  category: string
}

interface Props {
  selection: Selection | null
  conversations: Conversation[]
  workspaceId: string
  onClose: () => void
}

type ResFilter = 'all' | 'resolved' | 'fin_escalated' | 'human_only'

const RES_FILTERS: { key: ResFilter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'resolved', label: 'Résolues par Fin' },
  { key: 'fin_escalated', label: 'Escaladées' },
  { key: 'human_only', label: 'Humain' },
]

function countResolutions(list: Conversation[]): ResolutionCounts {
  const counts: ResolutionCounts = {
    fin_confirmed: 0,
    fin_assumed: 0,
    fin_escalated: 0,
    human_only: 0,
    total: 0,
  }
  for (const c of list) {
    counts[c.resolution] += 1
    counts.total += 1
  }
  return counts
}

export function ConversationPanel({ selection, conversations, workspaceId, onClose }: Props) {
  const [resFilter, setResFilter] = useState<ResFilter>('all')

  useEffect(() => {
    setResFilter('all')
  }, [selection?.value])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (selection) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selection, onClose])

  const baseList = useMemo(() => {
    if (!selection) return []
    const filter: ConversationFilter =
      selection.type === 'topic' ? { topic: selection.value } : { category: selection.value }
    return selectConversations(conversations, filter)
  }, [selection, conversations])

  const counts = useMemo(() => countResolutions(baseList), [baseList])
  // Fin only operates on chat — scope the headline resolution metric to chat
  // so it matches the "Performance de Fin par sujet" table.
  const chatCounts = useMemo(
    () => countResolutions(baseList.filter((c) => c.medium === 'chat')),
    [baseList],
  )

  const list = useMemo(() => {
    if (resFilter === 'all') return baseList
    if (resFilter === 'resolved')
      return baseList.filter((c) => c.resolution === 'fin_confirmed' || c.resolution === 'fin_assumed')
    return baseList.filter((c) => c.resolution === (resFilter as Resolution))
  }, [baseList, resFilter])

  const open = selection !== null
  const resolvedRate = chatCounts.total
    ? (chatCounts.fin_confirmed + chatCounts.fin_assumed) / chatCounts.total
    : 0

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selection && (
          <>
            <header className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: categoryColor(selection.category) }}
                    />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {selection.type === 'category' ? 'Catégorie' : selection.category}
                    </span>
                  </div>
                  <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">
                    {selection.value}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{formatNumber(counts.total)}</div>
                  <div className="text-[11px] text-slate-400">conversations</div>
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Résolution autonome de Fin {chatCounts.total > 0 && `(${chatCounts.total} chats)`}</span>
                    <span className="font-bold text-slate-700">{pct(resolvedRate)}</span>
                  </div>
                  <StackedResolutionBar counts={chatCounts.total > 0 ? chatCounts : counts} height={10} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {RES_FILTERS.map((f) => {
                  const n =
                    f.key === 'all'
                      ? counts.total
                      : f.key === 'resolved'
                        ? counts.fin_confirmed + counts.fin_assumed
                        : counts[f.key]
                  return (
                    <button
                      key={f.key}
                      onClick={() => setResFilter(f.key)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        resFilter === f.key
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {f.label} <span className="opacity-60">{n}</span>
                    </button>
                  )
                })}
              </div>
            </header>

            <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50/60 p-4 scroll-soft">
              {list.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Aucune conversation pour ce filtre.
                </div>
              ) : (
                list.map((c) => (
                  <ConversationRow key={c.id} conversation={c} workspaceId={workspaceId} />
                ))
              )}
            </div>
          </>
        )}
      </aside>
    </>
  )
}
