import type { Appointment } from '../types'
import {
  CLIENT_MEETING_CATEGORY,
  LEAD_FOLLOW_UP_CATEGORY,
  resolveAppointmentCategory,
} from '../constants/calendarEventStyles'

export const DAILY_MEETING_LIMIT_MINUTES = 4 * 60
export const WEEKLY_MEETING_LIMIT_MINUTES = DAILY_MEETING_LIMIT_MINUTES * 5
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30
export const EXPECTED_CALLS_PER_HOUR = 10
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

export function getSimulatedTasks(date: Date): { done: number; total: number } {
  const r1 = getPseudoRandomFromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 100))
  const total = DAILY_TASK_RANGE[0] + Math.round(r1 * (DAILY_TASK_RANGE[1] - DAILY_TASK_RANGE[0]))
  const r2 = getPseudoRandomFromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 200))
  const completionRatio = date.getDay() === FULL_COMPLETION_WEEKDAY ? 1 : 0.3 + r2 * 0.6
  const done = Math.round(total * completionRatio)
  return { done, total }
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
  const minutesMatch = normalized.match(/(\d+)\s*min/)

  const hours = hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0
  const minutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : 0

  const parsedDuration = hours * 60 + minutes

  return parsedDuration > 0 ? parsedDuration : DEFAULT_APPOINTMENT_DURATION_MINUTES
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

export { CLIENT_MEETING_CATEGORY, LEAD_FOLLOW_UP_CATEGORY }
