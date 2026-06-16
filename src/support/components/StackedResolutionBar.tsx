import type { ResolutionCounts } from '../lib/metrics'
import { RESOLUTION_META, RESOLUTION_ORDER } from '../lib/resolution'

interface Props {
  counts: ResolutionCounts
  height?: number
  rounded?: boolean
}

/** A single horizontal bar showing the resolution-outcome mix. */
export function StackedResolutionBar({ counts, height = 8, rounded = true }: Props) {
  const total = counts.total || 1

  return (
    <div
      className={`flex w-full overflow-hidden bg-slate-100 ${rounded ? 'rounded-full' : 'rounded-md'}`}
      style={{ height }}
    >
      {RESOLUTION_ORDER.map((key) => {
        const value = counts[key]
        if (value === 0) return null
        const width = (value / total) * 100
        const meta = RESOLUTION_META[key]
        return (
          <div
            key={key}
            style={{ width: `${width}%`, backgroundColor: meta.color }}
            title={`${meta.label}: ${value} (${Math.round(width)}%)`}
          />
        )
      })}
    </div>
  )
}

export function ResolutionLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {RESOLUTION_ORDER.map((key) => {
        const meta = RESOLUTION_META[key]
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: meta.color }}
            />
            <span className="text-xs text-slate-500">
              {compact ? meta.label : meta.description}
            </span>
          </div>
        )
      })}
    </div>
  )
}
