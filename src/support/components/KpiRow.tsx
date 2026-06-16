import { MessageSquare, Mail, TrendingUp, CornerUpRight, BadgeCheck } from 'lucide-react'
import type { ChannelFilter, Kpis } from '../lib/metrics'
import { pct, formatNumber } from '../lib/format'

function Gauge({ value, color }: { value: number; color: string }) {
  const r = 26
  const c = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(1, value)) * c
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#eef2f6" strokeWidth="8" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
      />
    </svg>
  )
}

function KpiCard({
  label,
  children,
  accent,
}: {
  label: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? 'border-forest/15 bg-gradient-to-br from-forest-50 to-white'
          : 'border-slate-200/70 bg-white'
      } shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      {children}
    </div>
  )
}

export function KpiRow({ kpis, channel }: { kpis: Kpis; channel: ChannelFilter }) {
  const resolvedColor = kpis.finResolvedRate >= 0.55 ? '#16a34a' : kpis.finResolvedRate >= 0.35 ? '#f59e0b' : '#ef4444'
  const confirmedShare = kpis.finResolvedCount > 0 ? kpis.confirmedCount / kpis.finResolvedCount : 0
  const channelTotal = kpis.total || 1
  const chatShare = kpis.chatTotal / channelTotal
  const emailShare = kpis.emailTotal / channelTotal
  const showChannelBreakdown = channel === 'all'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Volume de conversations">
        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {formatNumber(kpis.total)}
        </div>
        {showChannelBreakdown && (
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              {formatNumber(kpis.chatTotal)} chat ({pct(chatShare)})
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {formatNumber(kpis.emailTotal)} email ({pct(emailShare)})
            </span>
          </div>
        )}
      </KpiCard>

      <KpiCard label="Escaladées vers un humain">
        <div className="mt-2 flex items-center gap-2">
          <div className="text-3xl font-bold tracking-tight text-amber-500">
            {pct(kpis.escalatedRate)}
          </div>
          <CornerUpRight className="h-5 w-5 text-amber-400" />
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {formatNumber(kpis.escalatedCount)} conversations transférées
        </div>
      </KpiCard>

      <KpiCard label="Résolution autonome de Fin" accent>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold tracking-tight" style={{ color: resolvedColor }}>
              {pct(kpis.finResolvedRate)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {formatNumber(kpis.finResolvedCount)} / {formatNumber(kpis.finScopeTotal)}{' '}
              {kpis.finScopeLabel}
            </div>
          </div>
          <div className="relative">
            <Gauge value={kpis.finResolvedRate} color={resolvedColor} />
            <TrendingUp
              className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
              style={{ color: resolvedColor }}
            />
          </div>
        </div>
      </KpiCard>

      <KpiCard label="Résolutions confirmées par le client">
        <div className="mt-2 flex items-center gap-2">
          <div className="text-3xl font-bold tracking-tight text-green-600">
            {pct(confirmedShare)}
          </div>
          <BadgeCheck className="h-5 w-5 text-green-500" />
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {formatNumber(kpis.confirmedCount)} des {formatNumber(kpis.finResolvedCount)} résolutions
        </div>
      </KpiCard>
    </div>
  )
}
