import { useState, useEffect } from 'react'
import { LayoutDashboard, Clock } from 'lucide-react'
import { isSameDay } from 'date-fns'
import { advisorName, weekSchedule } from '../data/mockData'
import {
  CLIENT_MEETING_CATEGORY,
  resolveAppointmentCategory,
} from '../constants/calendarEventStyles'
import { getEffectiveDurationMinutes, getParisTimeMinutes, getParisToday } from '../utils/calendarMetrics'
import type { Appointment, AppointmentCategory } from '../types'

const INDICATOR_STYLES: Record<
  AppointmentCategory,
  {
    bg: string
    border: string
    dot: string
    ping: string
    text: string
    countdown: string
  }
> = {
  'Rendez-vous clients': {
    bg: 'bg-emerald-50/90',
    border: 'border-emerald-200/60',
    dot: 'bg-emerald-500',
    ping: 'bg-emerald-400',
    text: 'text-emerald-900',
    countdown: 'text-emerald-600',
  },
  Care: {
    bg: 'bg-sky-50/90',
    border: 'border-sky-200/60',
    dot: 'bg-sky-500',
    ping: 'bg-sky-400',
    text: 'text-sky-900',
    countdown: 'text-sky-600',
  },
  OOO: {
    bg: 'bg-rose-50/90',
    border: 'border-rose-200/60',
    dot: 'bg-rose-500',
    ping: 'bg-rose-400',
    text: 'text-rose-900',
    countdown: 'text-rose-600',
  },
  Interne: {
    bg: 'bg-amber-50/90',
    border: 'border-amber-200/60',
    dot: 'bg-amber-500',
    ping: 'bg-amber-400',
    text: 'text-amber-900',
    countdown: 'text-amber-600',
  },
  'Suivi leads': {
    bg: 'bg-violet-50/90',
    border: 'border-violet-200/60',
    dot: 'bg-violet-500',
    ping: 'bg-violet-400',
    text: 'text-violet-900',
    countdown: 'text-violet-600',
  },
}

type EventState =
  | { kind: 'in_progress'; appointment: Appointment; remainingMin: number }
  | { kind: 'upcoming'; appointment: Appointment; startsInMin: number }
  | null

function formatMinutesLabel(totalMinutes: number): string {
  if (totalMinutes <= 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} h ${minutes} min`
}

function getEventState(): EventState {
  const parisToday = getParisToday()
  const todaySchedule = weekSchedule.find((day) => isSameDay(day.date, parisToday))
  if (!todaySchedule) return null

  const currentMinutes = getParisTimeMinutes()
  let inProgressState: EventState = null

  for (const apt of todaySchedule.appointments) {
    const [h, m] = apt.time.split(':').map(Number)
    const startMin = h * 60 + m
    const duration = getEffectiveDurationMinutes(apt)
    const endMin = startMin + duration

    if (startMin > currentMinutes && startMin - currentMinutes <= 15) {
      return { kind: 'upcoming', appointment: apt, startsInMin: startMin - currentMinutes }
    }

    if (startMin <= currentMinutes && currentMinutes < endMin) {
      inProgressState = {
        kind: 'in_progress',
        appointment: apt,
        remainingMin: endMin - currentMinutes,
      }
    }
  }

  return inProgressState
}

export function StickyHeader() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const state = getEventState()
  const apt = state?.appointment ?? null
  const category = apt ? resolveAppointmentCategory(apt.category) : null
  const palette = category ? INDICATOR_STYLES[category] : null
  const eventTitle = apt
    ? category === CLIENT_MEETING_CATEGORY
      ? apt.name
      : category
    : null

  return (
    <div className="sticky top-0 z-50 bg-[#faf8f5]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Page title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
            <LayoutDashboard size={20} className="text-gray-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            Dashboard de {advisorName}
          </h1>
        </div>

        {/* Event indicator */}
        {state && palette ? (
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500 ${palette.bg} ${palette.border}`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${palette.ping}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${palette.dot}`}
              />
            </span>

            <span className={`text-xs font-bold ${palette.text}`}>
              {state.kind === 'in_progress' ? 'En Cours' : apt!.time}
            </span>
            <span className={`text-xs ${palette.text} opacity-30`}>·</span>
            <span
              className={`text-xs font-semibold ${palette.text} max-w-[180px] truncate`}
            >
              {eventTitle}
            </span>
            <span className={`text-xs ${palette.text} opacity-30`}>—</span>
            <span className={`text-xs font-medium ${palette.countdown}`}>
              {state.kind === 'in_progress'
                ? `encore ${formatMinutesLabel(state.remainingMin)}`
                : `dans ${formatMinutesLabel(state.startsInMin)}`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50/90 border border-gray-200/60">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500">
              Journée terminée
            </span>
          </div>
        )}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />
    </div>
  )
}
