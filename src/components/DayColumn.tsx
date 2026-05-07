import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Appointment, DaySchedule } from '../types'
import { AppointmentCard } from './AppointmentCard'
import {
  DAILY_MEETING_LIMIT_MINUTES,
  DAILY_COLLECTE_TARGET,
  EXPECTED_CALLS_PER_HOUR,
  CLIENT_MEETING_CATEGORY,
  LEAD_FOLLOW_UP_CATEGORY,
  filterByCategory,
  parseDurationMinutes,
  formatMeetingMinutes,
  formatK,
  formatKEuros,
  progressColor,
  getSimulatedCallCompletionRatio,
  getSimulatedTasks,
  getSimulatedCollecte,
} from '../utils/calendarMetrics'

interface DayColumnProps {
  day: DaySchedule
  allAppointments: Appointment[]
  isToday: boolean
  collapsed?: boolean
}

const METRIC_LABEL_WIDTH_CLASS = 'w-[72px]'
const METRIC_VALUE_WIDTH_CLASS = 'w-[74px]'

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
  const leadFollowUpAppointments = filterByCategory(allAppointments, LEAD_FOLLOW_UP_CATEGORY)
  const meetingMinutes = clientMeetingAppointments.reduce(
    (total, appointment) => total + parseDurationMinutes(appointment.timeHint),
    0,
  )
  const leadFollowUpMinutes = leadFollowUpAppointments.reduce(
    (total, appointment) => total + parseDurationMinutes(appointment.timeHint),
    0,
  )
  const meetingProgressPercent = Math.min((meetingMinutes / DAILY_MEETING_LIMIT_MINUTES) * 100, 100)
  const meetingSummary = `${clientMeetingAppointments.length} • ${formatMeetingMinutes(meetingMinutes)}`
  const leadFollowUpSummary = formatMeetingMinutes(leadFollowUpMinutes)
  const expectedCalls = Math.round((leadFollowUpMinutes / 60) * EXPECTED_CALLS_PER_HOUR)
  const simulatedCallCompletionRatio = getSimulatedCallCompletionRatio(day.date)
  const simulatedCalls = Math.round(expectedCalls * simulatedCallCompletionRatio)
  const callsProgressPercent = expectedCalls > 0 ? (simulatedCalls / expectedCalls) * 100 : 0
  const tasks = getSimulatedTasks(day.date)
  const tasksProgressPercent = tasks.total > 0 ? Math.min((tasks.done / tasks.total) * 100, 100) : 0
  const collecteAmount = getSimulatedCollecte(day.date)
  const collecteProgressPercent = Math.min((collecteAmount / DAILY_COLLECTE_TARGET) * 100, 100)

  return (
    <div
      className={`flex flex-col rounded-xl min-w-0 flex-1 ${
        isToday ? 'border-2 border-[#1a3a3a] bg-[#1a3a3a]/[0.03] shadow-sm' : ''
      }`}
    >
      <div className={collapsed ? 'rounded-xl' : 'rounded-t-xl'}>
        <div className="text-center py-3">
          <div className={`text-[11px] font-semibold tracking-wide ${isToday ? 'text-[#1a3a3a]' : 'text-gray-400'}`}>
            {dayName}
          </div>
          <div className={`text-2xl font-bold mt-0.5 ${isToday ? 'text-[#1a3a3a]' : 'text-gray-900'}`}>
            {dateNum}
          </div>
          <div className={`text-xs ${isToday ? 'text-[#1a3a3a]/60' : 'text-gray-400'}`}>{month}</div>
        </div>

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
                  style={{ width: `${meetingProgressPercent}%`, backgroundColor: progressColor(meetingProgressPercent, false) }}
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
              Collecte
            </span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${collecteProgressPercent}%`, backgroundColor: progressColor(collecteProgressPercent, true) }}
                />
              </div>
            </div>
            <span
              className={`${METRIC_VALUE_WIDTH_CLASS} text-[11px] font-semibold leading-none text-right whitespace-nowrap text-gray-700`}
            >
              {formatK(collecteAmount)} / {formatKEuros(DAILY_COLLECTE_TARGET)}
            </span>
          </div>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className={`mx-2 border-t ${isToday ? 'border-[#1a3a3a]/20' : 'border-gray-200'}`} />
          <div className="flex-1 p-2 space-y-1.5">
            {day.appointments.map((apt) => (
              <div
                key={apt.id}
                className={
                  isToday
                    ? ''
                    : 'opacity-45 hover:opacity-100 transition-opacity duration-200'
                }
              >
                <AppointmentCard appointment={apt} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
