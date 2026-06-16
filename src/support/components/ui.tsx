import type { ReactNode } from 'react'
import { MessageSquare, Mail } from 'lucide-react'
import type { Medium, Resolution } from '../types'
import { RESOLUTION_META } from '../lib/resolution'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function ResolutionBadge({ resolution }: { resolution: Resolution }) {
  const meta = RESOLUTION_META[resolution]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.badgeBg} ${meta.badgeText}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}

export function ChannelIcon({ medium, className = '' }: { medium: Medium; className?: string }) {
  if (medium === 'chat') return <MessageSquare className={className} />
  if (medium === 'email') return <Mail className={className} />
  return <MessageSquare className={className} />
}

export function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}
