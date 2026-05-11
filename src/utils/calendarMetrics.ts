import type { Appointment } from '../types'
import {
  CLIENT_MEETING_CATEGORY,
  LEAD_FOLLOW_UP_CATEGORY,
  resolveAppointmentCategory,
} from '../constants/calendarEventStyles'

export const DAILY_MEETING_LIMIT_MINUTES = 4 * 60
export const WEEKLY_MEETING_LIMIT_MINUTES = DAILY_MEETING_LIMIT_MINUTES * 5
export const DAILY_APPOINTMENT_TARGET = 6
export const WEEKLY_APPOINTMENT_TARGET = DAILY_APPOINTMENT_TARGET * 5
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30
export const NO_SHOW_DURATION_MINUTES = 10
export const EXPECTED_CALLS_PER_HOUR = 20
export const DAILY_TASK_RANGE: [number, number] = [4, 12]
export const DAILY_COLLECTE_TARGET = 15_000
export const WEEKLY_COLLECTE_TARGET = DAILY_COLLECTE_TARGET * 5
export const FULL_COMPLETION_WEEKDAY = 3

export function getPseudoRandomFromDate(date: Date): number {
  const seed = date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate()
  const value = Math.sin(seed) * 10_000
  return value - Math.floor(value)
}

export function getSimulatedCallCompletionRatio(date: Date): number {
  if (date.getDay() === FULL_COMPLETION_WEEKDAY) return 1
  return 0.35 + getPseudoRandomFromDate(date) * 0.55
}

export function getSimulatedTasks(date: Date): { done: number; total: number; doneUnderSla: number } {
  const r1 = getPseudoRandomFromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 100))
  const total = DAILY_TASK_RANGE[0] + Math.round(r1 * (DAILY_TASK_RANGE[1] - DAILY_TASK_RANGE[0]))
  const r2 = getPseudoRandomFromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 200))
  const completionRatio = date.getDay() === FULL_COMPLETION_WEEKDAY ? 1 : 0.3 + r2 * 0.6
  const done = Math.round(total * completionRatio)
  const r3 = getPseudoRandomFromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 250))
  const underSlaRatio = done === 0 ? 0 : date.getDay() === FULL_COMPLETION_WEEKDAY ? 1 : 0.4 + r3 * 0.55
  const doneUnderSla = Math.min(done, Math.round(done * underSlaRatio))
  return { done, total, doneUnderSla }
}

export function getSimulatedCollecte(date: Date): number {
  const r = getPseudoRandomFromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 300))
  return Math.round((2000 + r * 16000) / 100) * 100
}

export function getAppointmentCategory(appointment: Appointment): string {
  return resolveAppointmentCategory(appointment.category)
}

export function parseDurationMinutes(timeHint?: string): number {
  if (!timeHint) return DEFAULT_APPOINTMENT_DURATION_MINUTES

  const normalized = timeHint.toLowerCase().trim()
  const hoursMatch = normalized.match(/(\d+)\s*h/)
  const compactHourMinutesMatch = normalized.match(/h\s*(\d{1,2})(?:\s*(?:m|min))?/)
  const minutesMatch = normalized.match(/(\d+)\s*(?:m|min)\b/)

  const hours = hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0
  const minutes = compactHourMinutesMatch
    ? Number.parseInt(compactHourMinutesMatch[1], 10)
    : minutesMatch
      ? Number.parseInt(minutesMatch[1], 10)
      : 0

  const parsedDuration = hours * 60 + minutes

  return parsedDuration > 0 ? parsedDuration : DEFAULT_APPOINTMENT_DURATION_MINUTES
}

export function getEffectiveDurationMinutes(appointment: Appointment): number {
  if (appointment.noShow) return NO_SHOW_DURATION_MINUTES
  return parseDurationMinutes(appointment.timeHint)
}

export function progressColor(percent: number, invert: boolean): string {
  const t = Math.min(Math.max(percent / 100, 0), 1)
  const ratio = invert ? t : 1 - t

  const stops = [
    [234, 67, 53],
    [242, 140, 40],
    [251, 188, 4],
    [120, 190, 50],
    [52, 168, 55],
  ]

  const pos = ratio * (stops.length - 1)
  const i = Math.min(Math.floor(pos), stops.length - 2)
  const f = pos - i
  const r = Math.round(stops[i][0] + (stops[i + 1][0] - stops[i][0]) * f)
  const g = Math.round(stops[i][1] + (stops[i + 1][1] - stops[i][1]) * f)
  const b = Math.round(stops[i][2] + (stops[i + 1][2] - stops[i][2]) * f)
  return `rgb(${r}, ${g}, ${b})`
}

export function appointmentProgressPercent(count: number, target: number = DAILY_APPOINTMENT_TARGET): number {
  if (target <= 0) return 0
  return Math.min((count / target) * 100, 100)
}

export function appointmentProgressColor(count: number): string {
  if (count <= 2) return 'rgb(234, 67, 53)'
  if (count <= 4) return 'rgb(251, 188, 4)'
  return 'rgb(52, 168, 55)'
}

export function formatMeetingMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

export function formatEuros(amount: number): string {
  return `${amount.toLocaleString('fr-FR')}€`
}

export function formatK(amount: number): string {
  const k = amount / 1000
  return Number.isInteger(k) ? `${k}` : `${k.toFixed(1).replace('.', ',')}`
}

export function formatKEuros(amount: number): string {
  return `${formatK(amount)}K€`
}

export function filterByCategory(appointments: Appointment[], category: string): Appointment[] {
  return appointments.filter((a) => getAppointmentCategory(a) === category)
}

export function getParisTimeMinutes(): number {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')!.value)
  const minute = Number(parts.find((p) => p.type === 'minute')!.value)
  return hour * 60 + minute
}

export function getParisToday(): Date {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')!.value)
  const month = Number(parts.find((p) => p.type === 'month')!.value) - 1
  const day = Number(parts.find((p) => p.type === 'day')!.value)
  return new Date(year, month, day)
}

export function getActiveAppointmentIndex(appointments: Appointment[]): number {
  if (appointments.length === 0) return -1

  const currentMinutes = getParisTimeMinutes()

  const [firstH, firstM] = appointments[0].time.split(':').map(Number)
  if (currentMinutes < firstH * 60 + firstM) return -1

  const lastApt = appointments[appointments.length - 1]
  const [lastH, lastM] = lastApt.time.split(':').map(Number)
  if (currentMinutes >= lastH * 60 + lastM + parseDurationMinutes(lastApt.timeHint)) return -1

  let activeIndex = 0
  for (let i = 0; i < appointments.length; i++) {
    const [h, m] = appointments[i].time.split(':').map(Number)
    if (currentMinutes >= h * 60 + m) {
      activeIndex = i
    } else {
      break
    }
  }

  return activeIndex
}

export interface TeamMemberMetrics {
  meetingsDone: number
  meetingsTarget: number
  meetingPercent: number
  noShowPercent: number
  callsDone: number
  callsExpected: number
  callsPercent: number
  tasksDone: number
  tasksTotal: number
  tasksPercent: number
  slaPercent: number
  collecte: number
  collecteTarget: number
  collectePercent: number
}

export function computeWeeklyMetrics(
  weekSchedule: { date: Date; appointments: Appointment[] }[],
  collecteTarget = WEEKLY_COLLECTE_TARGET,
  memberSeed = 0,
  callsPerHour = EXPECTED_CALLS_PER_HOUR,
): TeamMemberMetrics {
  let totalClientMeetingCount = 0
  let totalMeetingCount = 0
  let totalNoShowCount = 0
  let totalCallsDone = 0
  let totalCallsExpected = 0
  let totalTasksDone = 0
  let totalTasksTotal = 0
  let totalTasksDoneUnderSla = 0
  let totalCollecte = 0

  for (const day of weekSchedule) {
    const clientMeetings = filterByCategory(day.appointments, CLIENT_MEETING_CATEGORY)
    const confirmedClientMeetings = clientMeetings.filter((a) => !a.noShow)
    const leadFollowUps = filterByCategory(day.appointments, LEAD_FOLLOW_UP_CATEGORY)

    totalClientMeetingCount += clientMeetings.length
    totalMeetingCount += confirmedClientMeetings.length
    totalNoShowCount += clientMeetings.filter((a) => a.noShow).length

    const leadMinutes = leadFollowUps.reduce((sum, a) => sum + getEffectiveDurationMinutes(a), 0)

    const expectedCalls = Math.round((leadMinutes / 60) * callsPerHour)
    const seedDate = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate() + memberSeed)
    const ratio = getSimulatedCallCompletionRatio(seedDate)
    totalCallsDone += Math.round(expectedCalls * ratio)
    totalCallsExpected += expectedCalls

    const tasks = getSimulatedTasks(seedDate)
    totalTasksDone += tasks.done
    totalTasksTotal += tasks.total
    totalTasksDoneUnderSla += tasks.doneUnderSla

    totalCollecte += getSimulatedCollecte(seedDate)
  }

  const meetingPercent = appointmentProgressPercent(totalMeetingCount, WEEKLY_APPOINTMENT_TARGET)
  const noShowPercent =
    totalClientMeetingCount > 0 ? Math.round((totalNoShowCount / totalClientMeetingCount) * 100) : 0
  const callsPercent = totalCallsExpected > 0 ? Math.min((totalCallsDone / totalCallsExpected) * 100, 100) : 0
  const tasksPercent = totalTasksTotal > 0 ? Math.min((totalTasksDone / totalTasksTotal) * 100, 100) : 0
  const slaPercent = totalTasksDone > 0 ? Math.min((totalTasksDoneUnderSla / totalTasksDone) * 100, 100) : 0
  const collectePercent = Math.min((totalCollecte / collecteTarget) * 100, 100)

  return {
    meetingsDone: totalMeetingCount,
    meetingsTarget: WEEKLY_APPOINTMENT_TARGET,
    meetingPercent,
    noShowPercent,
    callsDone: totalCallsDone,
    callsExpected: totalCallsExpected,
    callsPercent,
    tasksDone: totalTasksDone,
    tasksTotal: totalTasksTotal,
    tasksPercent,
    slaPercent,
    collecte: totalCollecte,
    collecteTarget,
    collectePercent,
  }
}

export { CLIENT_MEETING_CATEGORY, LEAD_FOLLOW_UP_CATEGORY }
