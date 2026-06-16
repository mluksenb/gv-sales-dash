import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { TopicStat } from '../lib/metrics'
import { categoryColor } from '../lib/categories'
import { formatNumber, pct } from '../lib/format'
import { StackedResolutionBar } from './StackedResolutionBar'

type SortKey = 'priority' | 'volume' | 'resolved' | 'escalated'

interface Props {
  stats: TopicStat[]
  selectedTopic: string | null
  onSelect: (topic: string) => void
}

function priorityScore(s: TopicStat): number {
  return s.total * (1 - s.resolvedRate)
}

function rateColor(rate: number): string {
  if (rate < 0.35) return '#ef4444'
  if (rate < 0.55) return '#f59e0b'
  return '#16a34a'
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'priority', label: "Priorité d'impact" },
  { key: 'volume', label: 'Volume' },
  { key: 'resolved', label: 'Taux de résolution' },
  { key: 'escalated', label: "Taux d'escalade" },
]

const ROW_GRID = 'grid-cols-[minmax(0,1fr)_3rem_180px_5.5rem]'

export function FinPerformanceTable({ stats, selectedTopic, onSelect }: Props) {
  const [sort, setSort] = useState<SortKey>('priority')

  const sorted = useMemo(() => {
    const copy = [...stats]
    switch (sort) {
      case 'volume':
        return copy.sort((a, b) => b.total - a.total)
      case 'resolved':
        return copy.sort((a, b) => a.resolvedRate - b.resolvedRate)
      case 'escalated':
        return copy.sort((a, b) => b.escalatedRate - a.escalatedRate)
      default:
        return copy.sort((a, b) => priorityScore(b) - priorityScore(a))
    }
  }, [stats, sort])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-slate-400">Trier&nbsp;:</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              sort === s.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {s.label}
            {sort === s.key &&
              (s.key === 'resolved' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
          </button>
        ))}
      </div>

      {/* header */}
      <div
        className={`grid ${ROW_GRID} items-center gap-3 border-b border-slate-100 px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400`}
      >
        <span>Sous-catégorie</span>
        <span className="text-right tabular-nums">Vol.</span>
        <span>Répartition des issues</span>
        <span className="text-right tabular-nums">Résolu · Escal.</span>
      </div>

      <div className="max-h-[460px] divide-y divide-slate-50 overflow-y-auto scroll-soft">
        {sorted.map((s) => {
          const isSelected = s.topic === selectedTopic
          return (
            <button
              key={s.topic}
              onClick={() => onSelect(s.topic)}
              className={`grid w-full ${ROW_GRID} items-center gap-3 px-2 py-2.5 text-left transition-colors ${
                isSelected ? 'bg-forest-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: categoryColor(s.category) }}
                  title={s.category}
                />
                <span className="truncate text-sm font-medium text-slate-700">{s.topic}</span>
              </div>

              <span className="text-right text-sm font-bold tabular-nums text-slate-800">
                {formatNumber(s.total)}
              </span>

              <div className="w-full">
                <StackedResolutionBar counts={s.counts} height={10} />
              </div>

              <div className="flex items-center justify-end gap-2 text-right tabular-nums">
                <span className="text-sm font-bold" style={{ color: rateColor(s.resolvedRate) }}>
                  {pct(s.resolvedRate)}
                </span>
                <span className="text-xs text-slate-300">·</span>
                <span className="w-9 text-sm font-medium text-amber-500">{pct(s.escalatedRate)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
