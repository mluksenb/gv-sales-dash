import { useState } from 'react'
import { ChevronRight, BookOpen } from 'lucide-react'
import type { ContactReason } from '../lib/metrics'
import { categoryColor } from '../lib/categories'
import { formatNumber, pct } from '../lib/format'
import { TaxonomyModal } from './TaxonomyModal'

interface Props {
  reasons: ContactReason[]
  /** Denominator for category share percentages (unique convs or topic mentions). */
  total: number
  onSelectCategory: (category: string) => void
  onSelectTopic: (topic: string) => void
}

export function ContactReasons({ reasons, total, onSelectCategory, onSelectTopic }: Props) {
  const [expanded, setExpanded] = useState<string | null>(reasons[0]?.category ?? null)
  const [definitionsOpen, setDefinitionsOpen] = useState(false)
  const maxCategory = Math.max(...reasons.map((r) => r.total), 1)

  return (
    <>
      <div className="space-y-1.5">
      {reasons.map((reason) => {
        const color = categoryColor(reason.category)
        const isOpen = expanded === reason.category
        const maxTopic = Math.max(...reason.topics.map((t) => t.total), 1)
        return (
          <div key={reason.category} className="rounded-xl">
            <button
              onClick={() => setExpanded(isOpen ? null : reason.category)}
              className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50"
            >
              <ChevronRight
                className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              />
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="w-52 shrink-0 truncate text-sm font-semibold text-slate-700">
                {reason.category}
              </span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(reason.total / maxCategory) * 100}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-bold text-slate-800">
                {formatNumber(reason.total)}
              </span>
              <span className="w-10 shrink-0 text-right text-xs text-slate-400">
                {pct(reason.total / (total || 1))}
              </span>
            </button>

            {isOpen && (
              <div className="mb-1 ml-9 mr-2 space-y-0.5 border-l border-slate-100 pl-3">
                {reason.topics.map((t) => (
                  <button
                    key={t.topic}
                    onClick={() => onSelectTopic(t.topic)}
                    className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
                  >
                    <span className="w-48 shrink-0 truncate text-xs text-slate-600 group-hover:text-slate-900">
                      {t.topic}
                    </span>
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full opacity-60"
                        style={{ width: `${(t.total / maxTopic) * 100}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-xs font-semibold text-slate-600">
                      {t.total}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => onSelectCategory(reason.category)}
                  className="mt-1 px-2 text-[11px] font-semibold text-forest hover:underline"
                >
                  Voir toutes les conversations de cette catégorie →
                </button>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => setDefinitionsOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Consulter les définitions par catégorie
      </button>
    </div>

      <TaxonomyModal open={definitionsOpen} onClose={() => setDefinitionsOpen(false)} />
    </>
  )
}
