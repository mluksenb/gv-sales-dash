import type { ProspectType, TierLevel, TaskType } from '../types'

export function ProspectBadge({ type }: { type: ProspectType }) {
  if (type === 'Lead') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-400">
        Lead
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-400">
      Client
    </span>
  )
}

export function TierBadge({ tier }: { tier: TierLevel }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-300">
      {tier}
    </span>
  )
}

const taskTypeConfig: Record<TaskType, { bg: string; text: string; border: string }> = {
  'Demande de rappel': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Rétention livret': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  Drop: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
}

export function TaskTypeBadge({ type }: { type: TaskType }) {
  const config = taskTypeConfig[type]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${config.bg} ${config.text} border ${config.border}`}>
      {type}
    </span>
  )
}

export function TelBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-500 border border-orange-200">
      Tél
    </span>
  )
}
