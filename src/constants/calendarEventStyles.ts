import type { AppointmentCategory } from '../types'

export const CLIENT_MEETING_CATEGORY: AppointmentCategory = 'Rendez-vous clients'
export const LEAD_FOLLOW_UP_CATEGORY: AppointmentCategory = 'Suivi leads'

export const EVENT_FILTERS: AppointmentCategory[] = [
  'Rendez-vous clients',
  'Care',
  'OOO',
  'Interne',
  'Suivi leads',
]

export const EVENT_CATEGORY_STYLES: Record<
  AppointmentCategory,
  {
    card: string
    cardToday: string
    cardTitle: string
    cardSubtitle: string
    filterActive: string
    filterInactive: string
  }
> = {
  'Rendez-vous clients': {
    card: 'bg-emerald-50 border-emerald-400/50',
    cardToday: 'bg-emerald-50 border-emerald-500/60',
    cardTitle: 'text-emerald-900',
    cardSubtitle: 'text-emerald-700',
    filterActive: 'bg-emerald-500 text-white border-emerald-500',
    filterInactive: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50',
  },
  Care: {
    card: 'bg-sky-50 border-sky-400/50',
    cardToday: 'bg-sky-50 border-sky-500/60',
    cardTitle: 'text-sky-900',
    cardSubtitle: 'text-sky-700',
    filterActive: 'bg-sky-500 text-white border-sky-500',
    filterInactive: 'bg-white text-sky-700 border-sky-300 hover:bg-sky-50',
  },
  OOO: {
    card: 'bg-rose-50 border-rose-400/50',
    cardToday: 'bg-rose-50 border-rose-500/60',
    cardTitle: 'text-rose-900',
    cardSubtitle: 'text-rose-700',
    filterActive: 'bg-rose-500 text-white border-rose-500',
    filterInactive: 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50',
  },
  Interne: {
    card: 'bg-amber-50 border-amber-400/50',
    cardToday: 'bg-amber-50 border-amber-500/60',
    cardTitle: 'text-amber-900',
    cardSubtitle: 'text-amber-700',
    filterActive: 'bg-amber-500 text-white border-amber-500',
    filterInactive: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50',
  },
  'Suivi leads': {
    card: 'bg-violet-50 border-violet-400/50',
    cardToday: 'bg-violet-50 border-violet-500/60',
    cardTitle: 'text-violet-900',
    cardSubtitle: 'text-violet-700',
    filterActive: 'bg-violet-500 text-white border-violet-500',
    filterInactive: 'bg-white text-violet-700 border-violet-300 hover:bg-violet-50',
  },
}

export function resolveAppointmentCategory(category?: AppointmentCategory): AppointmentCategory {
  return category ?? CLIENT_MEETING_CATEGORY
}
