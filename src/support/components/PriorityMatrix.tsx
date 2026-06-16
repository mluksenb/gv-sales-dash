import { useMemo, useState } from 'react'
import type { TopicStat } from '../lib/metrics'
import { pct } from '../lib/format'

interface Props {
  stats: TopicStat[]
  selectedTopic: string | null
  onSelect: (topic: string) => void
  /** Resolution rate considered "good enough" (horizontal divider). */
  targetRate?: number
}

const W = 760
const H = 420
const PAD = { left: 52, right: 28, top: 24, bottom: 46 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

function rateColor(rate: number): string {
  if (rate < 0.35) return '#ef4444'
  if (rate < 0.55) return '#f59e0b'
  return '#16a34a'
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function PriorityMatrix({ stats, selectedTopic, onSelect, targetRate = 0.5 }: Props) {
  const [hover, setHover] = useState<string | null>(null)

  const { points, maxVol, volThreshold } = useMemo(() => {
    const visible = stats.filter((s) => s.total > 0)
    const maxVolume = Math.max(...visible.map((s) => s.total), 1)
    const volMedian = Math.max(median(visible.map((s) => s.total)), 1)
    const maxR = Math.max(...visible.map((s) => s.total), 1)

    const pts = visible.map((s) => ({
      stat: s,
      cx: PAD.left + (s.total / maxVolume) * PLOT_W,
      cy: PAD.top + (1 - s.resolvedRate) * PLOT_H,
      r: 7 + (Math.sqrt(s.total) / Math.sqrt(maxR)) * 20,
    }))
    // Draw biggest first so small bubbles stay clickable on top.
    pts.sort((a, b) => b.r - a.r)
    return { points: pts, maxVol: maxVolume, volThreshold: volMedian }
  }, [stats])

  const xTarget = PAD.left + (volThreshold / maxVol) * PLOT_W
  const yTarget = PAD.top + (1 - targetRate) * PLOT_H

  const activeStat =
    (hover && stats.find((s) => s.topic === hover)) ||
    (selectedTopic && stats.find((s) => s.topic === selectedTopic)) ||
    null

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Matrice volume / résolution">
        {/* Priority quadrant: high volume + low resolution */}
        <rect
          x={xTarget}
          y={yTarget}
          width={W - PAD.right - xTarget}
          height={PLOT_H + PAD.top - yTarget}
          fill="#fef2f2"
        />
        <text
          x={W - PAD.right - 8}
          y={H - PAD.bottom - 8}
          textAnchor="end"
          className="fill-red-400"
          fontSize="11"
          fontWeight={600}
        >
          Priorité d'amélioration
        </text>

        {/* gridlines for y (0/25/50/75/100) */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = PAD.top + (1 - g) * PLOT_H
          return (
            <g key={g}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#eef2f6" />
              <text x={PAD.left - 10} y={y + 3} textAnchor="end" fontSize="10" className="fill-slate-400">
                {pct(g)}
              </text>
            </g>
          )
        })}

        {/* threshold dividers */}
        <line x1={xTarget} y1={PAD.top} x2={xTarget} y2={PAD.top + PLOT_H} stroke="#cbd5e1" strokeDasharray="4 4" />
        <line x1={PAD.left} y1={yTarget} x2={W - PAD.right} y2={yTarget} stroke="#cbd5e1" strokeDasharray="4 4" />

        {/* axis labels */}
        <text x={PAD.left + PLOT_W / 2} y={H - 8} textAnchor="middle" fontSize="11" className="fill-slate-500" fontWeight={600}>
          Volume de conversations →
        </text>
        <text
          transform={`translate(14 ${PAD.top + PLOT_H / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="11"
          className="fill-slate-500"
          fontWeight={600}
        >
          Taux de résolution Fin →
        </text>

        {/* bubbles */}
        {points.map(({ stat, cx, cy, r }) => {
          const isActive = stat.topic === hover || stat.topic === selectedTopic
          const dim = (hover || selectedTopic) && !isActive
          return (
            <g
              key={stat.topic}
              onMouseEnter={() => setHover(stat.topic)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(stat.topic)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={rateColor(stat.resolvedRate)}
                fillOpacity={dim ? 0.18 : 0.65}
                stroke={isActive ? '#0f172a' : 'white'}
                strokeWidth={isActive ? 2 : 1}
              />
            </g>
          )
        })}
      </svg>

      {activeStat ? (
        <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs">
          <span className="truncate font-semibold text-slate-700">{activeStat.topic}</span>
          <span className="ml-3 shrink-0 text-slate-500">
            {activeStat.total} conv · <span style={{ color: rateColor(activeStat.resolvedRate) }} className="font-semibold">{pct(activeStat.resolvedRate)}</span> résolus · {pct(activeStat.escalatedRate)} escaladés
          </span>
        </div>
      ) : (
        <p className="mt-1 px-1 text-xs text-slate-400">
          Chaque bulle = une sous-catégorie (taille = volume de conversations). Survolez pour
          les détails, cliquez pour explorer les conversations.
        </p>
      )}
    </div>
  )
}
