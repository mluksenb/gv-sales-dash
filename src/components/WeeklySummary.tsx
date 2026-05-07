import { BarChart3 } from 'lucide-react'
import type { DaySchedule } from '../types'
import { EVENT_FILTERS, resolveAppointmentCategory } from '../constants/calendarEventStyles'
import {
  WEEKLY_MEETING_LIMIT_MINUTES,
  WEEKLY_COLLECTE_TARGET,
  EXPECTED_CALLS_PER_HOUR,
  CLIENT_MEETING_CATEGORY,
  LEAD_FOLLOW_UP_CATEGORY,
  filterByCategory,
  getEffectiveDurationMinutes,
  formatMeetingMinutes,
  formatK,
  formatKEuros,
  progressColor,
  getSimulatedCallCompletionRatio,
  getSimulatedTasks,
  getSimulatedCollecte,
} from '../utils/calendarMetrics'

interface WeeklySummaryProps {
  weekSchedule: DaySchedule[]
}

const METRIC_LABEL_WIDTH_CLASS = 'w-[72px]'
const METRIC_VALUE_WIDTH_CLASS = 'w-[66px]'
const WEEKLY_CATEGORY_ORDER = ['Rendez-vous clients', 'Suivi leads', 'Care', 'Interne', 'OOO'] as const

export function WeeklySummary({ weekSchedule }: WeeklySummaryProps) {
  const categoryMinutes = new Map(EVENT_FILTERS.map((category) => [category, 0]))
  let totalMeetingCount = 0
  let totalNoShowCount = 0
  let totalMeetingMinutes = 0
  let totalLeadMinutes = 0
  let totalCallsDone = 0
  let totalCallsExpected = 0
  let totalTasksDone = 0
  let totalTasksTotal = 0
  let totalTasksDoneUnderSla = 0
  let totalCollecte = 0

  for (const day of weekSchedule) {
    for (const appointment of day.appointments) {
      const category = resolveAppointmentCategory(appointment.category)
      const duration = getEffectiveDurationMinutes(appointment)
      categoryMinutes.set(category, (categoryMinutes.get(category) ?? 0) + duration)
    }

    const clientMeetings = filterByCategory(day.appointments, CLIENT_MEETING_CATEGORY)
    const leadFollowUps = filterByCategory(day.appointments, LEAD_FOLLOW_UP_CATEGORY)

    totalMeetingCount += clientMeetings.length
    totalNoShowCount += clientMeetings.filter((a) => a.noShow).length
    totalMeetingMinutes += clientMeetings.reduce((sum, a) => sum + getEffectiveDurationMinutes(a), 0)

    const leadMinutes = leadFollowUps.reduce((sum, a) => sum + getEffectiveDurationMinutes(a), 0)
    totalLeadMinutes += leadMinutes

    const expectedCalls = Math.round((leadMinutes / 60) * EXPECTED_CALLS_PER_HOUR)
    const ratio = getSimulatedCallCompletionRatio(day.date)
    totalCallsDone += Math.round(expectedCalls * ratio)
    totalCallsExpected += expectedCalls

    const tasks = getSimulatedTasks(day.date)
    totalTasksDone += tasks.done
    totalTasksTotal += tasks.total
    totalTasksDoneUnderSla += tasks.doneUnderSla

    totalCollecte += getSimulatedCollecte(day.date)
  }

  const meetingPercent = Math.min((totalMeetingMinutes / WEEKLY_MEETING_LIMIT_MINUTES) * 100, 100)
  const noShowPercent = totalMeetingCount > 0 ? Math.round((totalNoShowCount / totalMeetingCount) * 100) : 0
  const callsPercent = totalCallsExpected > 0 ? Math.min((totalCallsDone / totalCallsExpected) * 100, 100) : 0
  const tasksPercent = totalTasksTotal > 0 ? Math.min((totalTasksDone / totalTasksTotal) * 100, 100) : 0
  const tasksUnderSlaPercent = totalTasksDone > 0 ? Math.min((totalTasksDoneUnderSla / totalTasksDone) * 100, 100) : 0
  const collectePercent = Math.min((totalCollecte / WEEKLY_COLLECTE_TARGET) * 100, 100)
  const totalWeeklyMinutes = Array.from(categoryMinutes.values()).reduce((sum, minutes) => sum + minutes, 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full md:w-[calc((100%-3rem)/5*2+0.75rem)]">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <BarChart3 size={16} className="text-gray-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Récap semaine</h3>
      </div>

      <div className="mx-4 border-t border-gray-200" />

      <div className="px-4 pb-4 pt-3 grid grid-cols-2 gap-4">
        <div className="space-y-2 border-r border-gray-100 pr-4">
          {WEEKLY_CATEGORY_ORDER.map((category) => (
            <div key={category} className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium whitespace-nowrap text-gray-500">{category}</span>
              <span className="text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700">
                {formatMeetingMinutes(categoryMinutes.get(category) ?? 0)} ·{' '}
                {Math.round(
                  totalWeeklyMinutes > 0
                    ? ((categoryMinutes.get(category) ?? 0) / totalWeeklyMinutes) * 100
                    : 0,
                )}
                %
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}>
              RDV clients
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${meetingPercent}%`, backgroundColor: progressColor(meetingPercent, false) }}
                />
              </div>
            </div>
            <span className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}>
              {totalMeetingCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}>
              No-shows
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${noShowPercent}%`, backgroundColor: progressColor(noShowPercent, false) }}
                />
              </div>
            </div>
            <span className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}>
              {Math.round(noShowPercent)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}>
              Appels
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${callsPercent}%`, backgroundColor: progressColor(callsPercent, true) }}
                />
              </div>
            </div>
            <span className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}>
              {totalCallsDone} / {totalCallsExpected}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}>
              Tâches
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${tasksPercent}%`, backgroundColor: progressColor(tasksPercent, true) }}
                />
              </div>
            </div>
            <span className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}>
              {totalTasksDone} / {totalTasksTotal}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}>
              SLA tâches
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${tasksUnderSlaPercent}%`,
                    backgroundColor: progressColor(tasksUnderSlaPercent, true),
                  }}
                />
              </div>
            </div>
            <span className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}>
              {Math.round(tasksUnderSlaPercent)}%
            </span>
          </div>

          <div className="-mx-1.5 rounded-md border border-[#9fb6a8]/70 bg-[#edf1ef] px-1.5 py-1">
            <div className="flex items-center gap-2">
              <span className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-[#395647]`}>
                Collecte
              </span>
              <div className="flex-1">
                <div className="h-1.5 rounded-full overflow-hidden bg-[#dce5e0]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${collectePercent}%`, backgroundColor: progressColor(collectePercent, true) }}
                  />
                </div>
              </div>
              <span className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-[#2c4338]`}>
                {formatK(totalCollecte)} / {formatKEuros(WEEKLY_COLLECTE_TARGET)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
