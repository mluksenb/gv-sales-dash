import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp, Undo2 } from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getWeekScheduleForOffset } from '../data/mockData'
import { DayColumn } from './DayColumn'
import { WeeklySummary } from './WeeklySummary'
import type { AppointmentCategory, DaySchedule } from '../types'
import {
  EVENT_CATEGORY_STYLES,
  EVENT_FILTERS,
  resolveAppointmentCategory,
} from '../constants/calendarEventStyles'
import { getParisToday } from '../utils/calendarMetrics'

export function WeeklyCalendar() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeFilters, setActiveFilters] = useState<AppointmentCategory[]>(EVENT_FILTERS)
  const [expanded, setExpanded] = useState(true)
  const today = getParisToday()
  const weekSchedule = getWeekScheduleForOffset(weekOffset, today)
  const currentWeekStart = weekSchedule[0].date
  const currentWeekEnd = addDays(currentWeekStart, 6)

  const dateRangeLabel = `${format(currentWeekStart, 'd MMM', { locale: fr })} - ${format(currentWeekEnd, 'd MMM yyyy', { locale: fr })}`
  const activeFilterSet = new Set(activeFilters)
  const filteredWeekSchedule: DaySchedule[] = weekSchedule.map((day) => ({
    ...day,
    appointments: day.appointments.filter((appointment) =>
      activeFilterSet.has(resolveAppointmentCategory(appointment.category)),
    ),
  }))

  const toggleFilter = (filter: AppointmentCategory) => {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((value) => value !== filter) : [...current, filter],
    )
  }

  return (
    <div className="space-y-4">
    <WeeklySummary weekSchedule={weekSchedule} />
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Calendar size={16} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Agenda hebdomadaire
            </h2>
            <p className="text-xs text-gray-500">{dateRangeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              expanded
                ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {expanded ? (
              <>
                Masquer les événements
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                Afficher les événements
                <ChevronDown size={14} />
              </>
            )}
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
          <button
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 transition-colors enabled:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 size={14} />
            Cette semaine
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex gap-3 items-stretch">
          {filteredWeekSchedule.map((day, index) => (
            <DayColumn
              key={day.date.toISOString()}
              day={day}
              allAppointments={weekSchedule[index].appointments}
              isToday={isSameDay(day.date, today)}
              collapsed={!expanded}
            />
          ))}
        </div>
      </div>

      {expanded && (
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-center gap-2 flex-wrap">
          {EVENT_FILTERS.map((filter) => {
            const isActive = activeFilterSet.has(filter)
            const palette = EVENT_CATEGORY_STYLES[filter]

            return (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  isActive ? palette.filterActive : palette.filterInactive
                }`}
              >
                {filter}
              </button>
            )
          })}
        </div>
      )}

    </div>
    </div>
  )
}
