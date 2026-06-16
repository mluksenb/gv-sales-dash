import { useState } from 'react'
import type { TrendBucket } from '../lib/metrics'
import { RESOLUTION_META, RESOLUTION_ORDER } from '../lib/resolution'
import { formatDayMonth } from '../lib/format'

interface Props {
  buckets: TrendBucket[]
}

/** Stacked weekly columns coloured by resolution outcome. */
export function TrendChart({ buckets }: Props) {
  const [hover, setHover] = useState<number | null>(null)

  if (buckets.length === 0) {
    return <div className="text-sm text-slate-400">Pas de données sur la période.</div>
  }

  const max = Math.max(...buckets.map((b) => b.total), 1)
  const niceMax = Math.ceil(max / 10) * 10 || max
  const gap = buckets.length > 30 ? 1 : 3

  const active = hover !== null ? buckets[hover] : null

  return (
    <div className="relative">
      <div className="flex">
        {/* y-axis labels */}
        <div className="flex w-8 flex-col justify-between pr-2 text-right text-[10px] text-slate-400" style={{ height: 180 }}>
          <span>{niceMax}</span>
          <span>{Math.round(niceMax / 2)}</span>
          <span>0</span>
        </div>

        <div className="relative flex-1">
          {/* gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between" style={{ height: 180 }}>
            <div className="border-t border-slate-100" />
            <div className="border-t border-slate-100" />
            <div className="border-t border-slate-100" />
          </div>

          <div className="relative flex items-end" style={{ height: 180, gap }}>
            {buckets.map((bucket, i) => {
              const colHeight = (bucket.total / niceMax) * 180
              const isHover = hover === i
              return (
                <div
                  key={bucket.start}
                  className="flex flex-1 flex-col justify-end"
                  style={{ height: 180 }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-[3px] transition-opacity"
                    style={{
                      height: Math.max(colHeight, bucket.total > 0 ? 2 : 0),
                      opacity: hover === null || isHover ? 1 : 0.45,
                    }}
                  >
                    {RESOLUTION_ORDER.map((key) => {
                      const value = bucket[key]
                      if (value === 0) return null
                      return (
                        <div
                          key={key}
                          style={{
                            height: `${(value / bucket.total) * 100}%`,
                            backgroundColor: RESOLUTION_META[key].color,
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* x-axis: first / mid / last week labels */}
      <div className="ml-8 mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{formatDayMonth(new Date(buckets[0].start))}</span>
        {buckets.length > 2 && (
          <span>{formatDayMonth(new Date(buckets[Math.floor(buckets.length / 2)].start))}</span>
        )}
        <span>{formatDayMonth(new Date(buckets[buckets.length - 1].start))}</span>
      </div>

      {active && (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs">
          <div className="mb-1 font-semibold text-slate-700">
            Semaine du {formatDayMonth(new Date(active.start))} · {active.total} conversations
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {RESOLUTION_ORDER.map((key) =>
              active[key] > 0 ? (
                <span key={key} className="flex items-center gap-1.5 text-slate-500">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: RESOLUTION_META[key].color }}
                  />
                  {RESOLUTION_META[key].label}: {active[key]}
                </span>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  )
}
