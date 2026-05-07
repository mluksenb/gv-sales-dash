import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Appointment, DaySchedule } from '../types'
import { AppointmentCard } from './AppointmentCard'
import {
  DAILY_APPOINTMENT_TARGET,
  DAILY_COLLECTE_TARGET,
  EXPECTED_CALLS_PER_HOUR,
  CLIENT_MEETING_CATEGORY,
  LEAD_FOLLOW_UP_CATEGORY,
  filterByCategory,
  getEffectiveDurationMinutes,
  formatMeetingMinutes,
  formatK,
  formatKEuros,
  appointmentProgressPercent,
  appointmentProgressColor,
  progressColor,
  getSimulatedCallCompletionRatio,
  getSimulatedTasks,
  getSimulatedCollecte,
  getActiveAppointmentIndex,
} from '../utils/calendarMetrics'

interface DayColumnProps {
  day: DaySchedule
  allAppointments: Appointment[]
  isToday: boolean
  collapsed?: boolean
}

const METRIC_LABEL_WIDTH_CLASS = 'w-[72px]'
const METRIC_VALUE_WIDTH_CLASS = 'w-[66px]'

export function DayColumn({
  day,
  allAppointments,
  isToday,
  collapsed = false,
}: DayColumnProps) {
  const dayName = format(day.date, 'EEE', { locale: fr }).toUpperCase().replace('.', '')
  const dateNum = format(day.date, 'd')
  const month = format(day.date, 'MMM', { locale: fr }).replace('.', '')
  const clientMeetingAppointments = filterByCategory(allAppointments, CLIENT_MEETING_CATEGORY)
  const confirmedClientMeetingAppointments = clientMeetingAppointments.filter((appointment) => !appointment.noShow)
  const leadFollowUpAppointments = filterByCategory(allAppointments, LEAD_FOLLOW_UP_CATEGORY)
  const leadFollowUpMinutes = leadFollowUpAppointments.reduce(
    (total, appointment) => total + getEffectiveDurationMinutes(appointment),
    0,
  )
  const meetingCount = confirmedClientMeetingAppointments.length
  const meetingProgressPercent = appointmentProgressPercent(meetingCount)
  const meetingSummary = `${meetingCount} / ${DAILY_APPOINTMENT_TARGET}`
  const leadFollowUpSummary = formatMeetingMinutes(leadFollowUpMinutes)
  const expectedCalls = Math.round((leadFollowUpMinutes / 60) * EXPECTED_CALLS_PER_HOUR)
  const simulatedCallCompletionRatio = getSimulatedCallCompletionRatio(day.date)
  const simulatedCalls = Math.round(expectedCalls * simulatedCallCompletionRatio)
  const callsProgressPercent = expectedCalls > 0 ? (simulatedCalls / expectedCalls) * 100 : 0
  const tasks = getSimulatedTasks(day.date)
  const tasksProgressPercent = tasks.total > 0 ? Math.min((tasks.done / tasks.total) * 100, 100) : 0
  const tasksUnderSlaPercent = tasks.done > 0 ? Math.min((tasks.doneUnderSla / tasks.done) * 100, 100) : 0
  const collecteAmount = getSimulatedCollecte(day.date)
  const collecteProgressPercent = Math.min((collecteAmount / DAILY_COLLECTE_TARGET) * 100, 100)

  const [, setTick] = useState(0)
  useEffect(() => {
    if (!isToday) return
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [isToday])

  const activeAppointmentIndex = isToday ? getActiveAppointmentIndex(day.appointments) : -1

  return (
    <div
      className={`flex flex-col rounded-xl min-w-0 flex-1 ${
        isToday ? 'overflow-clip bg-[#1a3a3a]/[0.03] shadow-sm' : ''
      }`}
    >
      <div className={`sticky top-[65px] z-20 rounded-t-xl ${isToday ? 'bg-[#f8f9f8] border-2 border-b-0 border-[#1a3a3a]' : 'bg-white'}`}>
        <div className="text-center py-3">
          <div className={`text-[11px] font-semibold tracking-wide ${isToday ? 'text-[#1a3a3a]' : 'text-gray-400'}`}>
            {dayName}
          </div>
          <div className={`text-2xl font-bold mt-0.5 ${isToday ? 'text-[#1a3a3a]' : 'text-gray-900'}`}>
            {dateNum}
          </div>
          <div className={`text-xs ${isToday ? 'text-[#1a3a3a]/60' : 'text-gray-400'}`}>{month}</div>
        </div>
      </div>

      <div className={`flex flex-col flex-1 ${isToday ? 'border-2 border-t-0 border-[#1a3a3a] rounded-b-xl' : ''}`}>
        <div className={`mx-2 border-t ${isToday ? 'border-[#1a3a3a]/20' : 'border-gray-200'}`} />

        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <span
              className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}
            >
              RDV clients
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${meetingProgressPercent}%`,
                    backgroundColor: appointmentProgressColor(meetingCount),
                  }}
                />
              </div>
            </div>
            <span
              className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}
            >
              {meetingSummary}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}
            >
              Appels
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${callsProgressPercent}%`, backgroundColor: progressColor(callsProgressPercent, true) }}
                />
              </div>
            </div>
            <span
              className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}
            >
              {simulatedCalls} / {expectedCalls}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}
            >
              Suivi leads
            </span>
            <div className="flex-1" />
            <span
              className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}
            >
              {leadFollowUpSummary}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}
            >
              Tâches
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${tasksProgressPercent}%`, backgroundColor: progressColor(tasksProgressPercent, true) }}
                />
              </div>
            </div>
            <span
              className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}
            >
              {tasks.done} / {tasks.total}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-gray-500`}
            >
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
            <span
              className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}
            >
              {Math.round(tasksUnderSlaPercent)}%
            </span>
          </div>
          <div className="-mx-1.5 mt-1.5 rounded-md border border-[#9fb6a8]/70 bg-[#edf1ef] px-1.5 py-1">
            <div className="flex items-center gap-2">
              <span
                className={`${METRIC_LABEL_WIDTH_CLASS} text-[11px] font-medium whitespace-nowrap text-[#395647]`}
              >
                Signé
              </span>
              <div className="flex-1">
                <div className="h-1.5 rounded-full overflow-hidden bg-[#dce5e0]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${collecteProgressPercent}%`,
                      backgroundColor: progressColor(collecteProgressPercent, true),
                    }}
                  />
                </div>
              </div>
              <span
                className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-[#2c4338]`}
              >
                {formatK(collecteAmount)} / {formatKEuros(DAILY_COLLECTE_TARGET)}
              </span>
            </div>
          </div>
        </div>

        {!collapsed && (
          <div className="flex-1 px-2 pb-2 pt-3 space-y-1.5">
            {day.appointments.map((apt, index) => (
              <div
                key={apt.id}
                className={`relative ${
                  isToday
                    ? ''
                    : 'opacity-45 hover:opacity-100 transition-opacity duration-200'
                }`}
              >
                {index === activeAppointmentIndex && (
                  <div
                    className="absolute -left-[5px] top-1/2 -translate-y-1/2 z-10"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(239, 68, 68, 0.3))' }}
                  >
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <path d="M0 0L8 7L0 14V0Z" fill="#ef4444" />
                    </svg>
                  </div>
                )}
                <AppointmentCard appointment={apt} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
