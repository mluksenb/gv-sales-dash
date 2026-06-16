import type { Resolution } from '../types'

export interface ResolutionMeta {
  key: Resolution
  /** Short label for chips / legends. */
  label: string
  /** Longer descriptive label. */
  description: string
  /** Tailwind-friendly hex used in charts. */
  color: string
  /** Background tint for badges. */
  badgeBg: string
  badgeText: string
}

export const RESOLUTION_META: Record<Resolution, ResolutionMeta> = {
  fin_confirmed: {
    key: 'fin_confirmed',
    label: 'Résolu (confirmé)',
    description: 'Fin a résolu et le client a confirmé',
    color: '#15803d',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
  },
  fin_assumed: {
    key: 'fin_assumed',
    label: 'Résolu (présumé)',
    description: "Fin a clos sans escalade ni confirmation explicite",
    color: '#4ade80',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  fin_escalated: {
    key: 'fin_escalated',
    label: 'Escaladé',
    description: 'Fin a transféré la conversation à un humain',
    color: '#f59e0b',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  human_only: {
    key: 'human_only',
    label: 'Humain uniquement',
    description: "Fin n'est pas intervenu (ex. canal email)",
    color: '#94a3b8',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
  },
}

/** Display order: best Fin outcome first, human last. */
export const RESOLUTION_ORDER: Resolution[] = [
  'fin_confirmed',
  'fin_assumed',
  'fin_escalated',
  'human_only',
]

/** Conversations Fin resolved autonomously. */
export function isFinResolved(resolution: Resolution): boolean {
  return resolution === 'fin_confirmed' || resolution === 'fin_assumed'
}

/** Conversations where Fin engaged at all (chat where Fin participated). */
export function isFinEngaged(resolution: Resolution): boolean {
  return resolution !== 'human_only'
}
