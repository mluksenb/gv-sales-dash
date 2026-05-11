import { addDays, addWeeks, startOfWeek } from 'date-fns'
import type { Appointment, DaySchedule, Task } from '../types'
import { getParisToday, getEffectiveDurationMinutes } from '../utils/calendarMetrics'

const WORKDAY_START = 9 * 60
const WORKDAY_END = 18 * 60

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatTimeHint(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`
}

function fillWithSuiviLeads(fixedAppointments: Appointment[], dayPrefix: string): Appointment[] {
  const sorted = [...fixedAppointments].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
  )

  const result: Appointment[] = []
  let cursor = WORKDAY_START
  let suiviCounter = 1

  for (const apt of sorted) {
    const aptStart = timeToMinutes(apt.time)
    const gap = aptStart - cursor
    if (gap > 0) {
      result.push({
        id: `${dayPrefix}-suivi-${suiviCounter++}`,
        time: minutesToTime(cursor),
        name: '',
        category: 'Suivi leads',
        prospectType: 'Lead',
        timeHint: formatTimeHint(gap),
      })
    }
    result.push(apt)
    const aptDuration = getEffectiveDurationMinutes(apt)
    cursor = aptStart + aptDuration
  }

  const remaining = WORKDAY_END - cursor
  if (remaining > 0) {
    result.push({
      id: `${dayPrefix}-suivi-${suiviCounter}`,
      time: minutesToTime(cursor),
      name: '',
      category: 'Suivi leads',
      prospectType: 'Lead',
      timeHint: formatTimeHint(remaining),
    })
  }

  return result
}

const mondayFixed: Appointment[] = [
  { id: 'mon-02', time: '10:30', name: 'Florian Marchais', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2' },
  { id: 'mon-03', time: '11:00', name: 'Isabelle Renard', category: 'Rendez-vous clients', prospectType: 'Client', tier: 'Tier 1' },
  { id: 'mon-05', time: '13:30', name: 'Support: dossier de souscription', category: 'Care', prospectType: 'Client', timeHint: '45 min' },
  { id: 'mon-07', time: '15:00', name: 'Pierre-Antoine Vidal', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2' },
  { id: 'mon-09', time: '17:00', name: 'Baptiste Girard', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2', noShow: true },
]

const tuesdayFixed: Appointment[] = [
  { id: 'tue-01', time: '09:00', name: 'Clément BERTRAND', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
  { id: 'tue-02', time: '09:30', name: 'Patrick GARNIER', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2' },
  { id: 'tue-03', time: '10:00', name: 'Sébastien Fontaine', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
  { id: 'tue-05', time: '11:00', name: 'Camille Lecomte', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
  { id: 'tue-06', time: '11:30', name: 'Aurélie Bonnet', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2', noShow: true },
  { id: 'tue-08', time: '14:00', name: '1:1 Félix <> Etienne', category: 'Interne', prospectType: 'Client', timeHint: '1h' },
  { id: 'tue-09', time: '15:00', name: 'Margaux Chevalier', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
  { id: 'tue-11', time: '17:00', name: 'Romain Delacroix', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2' },
]

const wednesdayFixed: Appointment[] = [
  { id: 'wed-01', time: '09:00', name: 'Nicolas Aubert', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
  { id: 'wed-03', time: '10:30', name: 'Véronique Moulin', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
  { id: 'wed-05', time: '12:00', name: 'Elise Roux', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2', noShow: true },
  { id: 'wed-07', time: '14:15', name: 'Formation Goodoffice', category: 'Interne', prospectType: 'Lead', timeHint: '45 min' },
  { id: 'wed-08', time: '15:00', name: 'Sandrine Dupont', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2' },
  { id: 'wed-10', time: '16:30', name: 'Frédéric Lemaire', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
  { id: 'wed-11', time: '17:00', name: 'Michel Blanchard', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
]

const thursdayFixed: Appointment[] = [
  { id: 'thu-01', time: '09:00', name: 'Dentiste', category: 'OOO', prospectType: 'Lead', timeHint: '1h' },
  { id: 'thu-02', time: '10:00', name: 'Benoît CHARRIER', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2' },
  { id: 'thu-04', time: '11:00', name: 'Céline de La Croix', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 3' },
  { id: 'thu-07', time: '15:30', name: 'Antoine Morin', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2', hasTel: true, noShow: true },
  { id: 'thu-09', time: '17:00', name: 'Pauline Fabre', category: 'Rendez-vous clients', prospectType: 'Lead' },
]

const fridayFixed: Appointment[] = [
  { id: 'fri-01', time: '09:00', name: 'Guillaume Perrin', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 1' },
  { id: 'fri-02', time: '09:30', name: 'Support: mise à jour contrat', category: 'Care', prospectType: 'Client', timeHint: '30 min' },
  { id: 'fri-03', time: '10:00', name: 'Stéphanie Colin', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 2' },
  { id: 'fri-06', time: '14:00', name: 'Coaching appels', category: 'Interne', prospectType: 'Lead', timeHint: '1h' },
  { id: 'fri-07', time: '15:00', name: 'François-Xavier Aumont', category: 'Rendez-vous clients', prospectType: 'Client', tier: 'Tier 1' },
  { id: 'fri-08', time: '15:30', name: 'Valérie Baudouin', category: 'Rendez-vous clients', prospectType: 'Lead', tier: 'Tier 3', noShow: true },
]

const monday = fillWithSuiviLeads(mondayFixed, 'mon')
const tuesday = fillWithSuiviLeads(tuesdayFixed, 'tue')
const wednesday = fillWithSuiviLeads(wednesdayFixed, 'wed')
const thursday = fillWithSuiviLeads(thursdayFixed, 'thu')
const friday = fillWithSuiviLeads(fridayFixed, 'fri')

const WEEKDAY_APPOINTMENTS: Appointment[][] = [monday, tuesday, wednesday, thursday, friday]

export function getWeekScheduleForOffset(weekOffset = 0, referenceDate = getParisToday()): DaySchedule[] {
  const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const displayedWeekStart = addWeeks(currentWeekStart, weekOffset)

  return WEEKDAY_APPOINTMENTS.map((appointments, index) => ({
    date: addDays(displayedWeekStart, index),
    appointments,
  }))
}

export const weekSchedule: DaySchedule[] = getWeekScheduleForOffset()

export const tasks: Task[] = [
  {
    id: 'task-1',
    createdAt: '06/05 20:32',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Lead',
    prospectName: 'Christophe LAMBERT',
    prospectPhone: '+33612345601',
    projectName: 'Assurance-vie enfant',
    projectType: 'life_insurance_kid',
    projectAmount: 800,
    projectStatus: 'proposition',
    status: 'À traiter',
    slaMinutes: 10,
  },
  {
    id: 'task-2',
    createdAt: '06/05 14:16',
    type: 'Rétention livret',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Lead',
    prospectName: 'Virginie Delaunay',
    prospectPhone: '+33712345602',
    projectName: 'Livret Goodvest',
    projectType: 'savings_account',
    projectAmount: 2000,
    projectStatus: 'documents',
    status: 'À traiter',
    slaMinutes: -2944,
  },
  {
    id: 'task-3',
    createdAt: '06/05 13:40',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Lead',
    prospectName: 'Virginie Delaunay',
    prospectPhone: '+33712345602',
    projectName: 'Assurance-vie enfant',
    projectType: 'life_insurance_kid',
    projectAmount: 300,
    projectStatus: 'proposition',
    status: 'À traiter',
    slaMinutes: -4020,
  },
  {
    id: 'task-4',
    createdAt: '05/05 15:15',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 3',
    prospectType: 'Lead',
    prospectName: 'Caroline Tissot',
    prospectPhone: '+33612345603',
    projectName: 'Assurance-vie',
    projectType: 'life_insurance',
    projectAmount: 2000,
    projectStatus: 'simulation',
    status: 'À traiter',
    slaMinutes: -18043,
  },
  {
    id: 'task-5',
    createdAt: '05/05 14:34',
    type: 'Drop',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 3',
    prospectType: 'Client',
    prospectName: 'Mathieu SIMON',
    prospectPhone: '+33712345604',
    projectName: 'Assurance-vie',
    projectType: 'life_insurance',
    projectAmount: 10000,
    projectStatus: 'envoi',
    status: 'À traiter',
    slaMinutes: -11400,
  },
  {
    id: 'task-6',
    createdAt: '05/05 14:25',
    type: 'Drop',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Lead',
    prospectName: 'Raphaël Gaillard',
    prospectPhone: '+33612345605',
    projectName: 'Assurance-vie',
    projectType: 'life_insurance',
    projectAmount: 20000,
    projectStatus: 'souscription',
    status: 'À traiter',
    slaMinutes: -11100,
  },
  {
    id: 'task-7',
    createdAt: '04/05 09:22',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Lead',
    prospectName: 'Thibault Renaud',
    prospectPhone: '+33712345606',
    projectName: 'Assurance-vie',
    projectType: 'life_insurance',
    projectAmount: 5000,
    projectStatus: 'simulation',
    status: 'À traiter',
    slaMinutes: -65200,
  },
  {
    id: 'task-8',
    createdAt: '03/05 16:40',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 1',
    prospectType: 'Lead',
    prospectName: 'Adèle Bourgeois',
    prospectPhone: '+33612345607',
    projectName: 'Assurance-vie enfant',
    projectType: 'life_insurance_kid',
    projectAmount: 5000,
    projectStatus: 'proposition',
    status: 'À traiter',
    slaMinutes: -88320,
  },
  {
    id: 'task-9',
    createdAt: '03/05 11:05',
    type: 'Rétention livret',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Client',
    prospectName: 'Vincent Pichon',
    prospectPhone: '+33712345608',
    projectName: 'Plan Épargne Retraite',
    projectType: 'retirement_plan',
    projectAmount: 300,
    projectStatus: 'proposition',
    status: 'À traiter',
    slaMinutes: -92000,
  },
  {
    id: 'task-10',
    createdAt: '02/05 18:30',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 3',
    prospectType: 'Lead',
    prospectName: 'Lucie Masson',
    prospectPhone: '+33612345609',
    projectName: 'Assurance-vie',
    projectType: 'life_insurance',
    projectAmount: 1000,
    projectStatus: 'simulation',
    status: 'À traiter',
    slaMinutes: -101500,
  },
  {
    id: 'task-11',
    createdAt: '02/05 14:12',
    type: 'Drop',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Lead',
    prospectName: 'Olivier Jacquet',
    prospectPhone: '+33712345610',
    projectName: 'Plan Épargne Retraite',
    projectType: 'retirement_plan',
    projectAmount: 300,
    projectStatus: 'souscription',
    status: 'À traiter',
    slaMinutes: -104000,
  },
  {
    id: 'task-12',
    createdAt: '01/05 23:18',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 1',
    prospectType: 'Lead',
    prospectName: 'Jean-Baptiste Hoffmann',
    prospectPhone: '+33612345611',
    projectName: 'Assurance-vie enfant',
    projectType: 'life_insurance_kid',
    projectAmount: 1000,
    projectStatus: 'souscription',
    status: 'À traiter',
    slaMinutes: -124180,
  },
  {
    id: 'task-13',
    createdAt: '01/05 21:45',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 1',
    prospectType: 'Lead',
    prospectName: 'Arnaud Lefevre',
    prospectPhone: '+33712345612',
    projectName: 'Assurance-vie',
    projectType: 'life_insurance',
    projectAmount: 70000,
    projectStatus: 'simulation',
    status: 'À traiter',
    slaMinutes: -124400,
  },
  {
    id: 'task-14',
    createdAt: '01/05 20:45',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Lead',
    prospectName: 'Nathalie Garnier',
    prospectPhone: '+33612345613',
    projectName: 'Assurance-vie',
    projectType: 'life_insurance',
    projectAmount: 10000,
    projectStatus: 'simulation',
    status: 'À traiter',
    slaMinutes: -124600,
  },
  {
    id: 'task-15',
    createdAt: '01/05 20:13',
    type: 'Demande de rappel',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 1',
    prospectType: 'Lead',
    prospectName: 'Anne-Sophie Boulanger',
    prospectPhone: '+33712345614',
    projectName: 'Plan Épargne Retraite',
    projectType: 'retirement_plan',
    projectAmount: 300,
    projectStatus: 'proposition',
    status: 'À traiter',
    slaMinutes: -124900,
  },
]

export const advisorName = 'Étienne Moreau'
export const totalRdvClients = 21
export const totalTasks = 42

export interface TeamMember {
  id: string
  name: string
}

export const teamMembers: TeamMember[] = [
  { id: 'tm-1', name: 'Étienne Moreau' },
  { id: 'tm-2', name: 'Camille Lefèvre' },
  { id: 'tm-3', name: 'Hugo Bernard' },
  { id: 'tm-4', name: 'Manon Petit' },
  { id: 'tm-5', name: 'Théo Roux' },
  { id: 'tm-6', name: 'Léa Fournier' },
]

export function getTeamMemberWeekSchedule(memberId: string, weekOffset = 0): DaySchedule[] {
  const memberIndex = teamMembers.findIndex((m) => m.id === memberId)
  const seedShift = (memberIndex + 1) * 7

  const baseSchedule = getWeekScheduleForOffset(weekOffset)

  return baseSchedule.map((day, dayIndex) => {
    const shiftedDate = new Date(
      day.date.getFullYear(),
      day.date.getMonth(),
      day.date.getDate() + seedShift + dayIndex,
    )

    const clientAppointments = day.appointments.filter(
      (a) => resolveCategory(a.category) === 'Rendez-vous clients',
    )

    const r = getPseudoRandom(shiftedDate)
    const keepCount = Math.max(2, Math.round(clientAppointments.length * (0.5 + r * 0.6)))
    const kept = clientAppointments.slice(0, keepCount).map((a, i) => ({
      ...a,
      id: `${memberId}-${dayIndex}-${i}`,
      noShow: getPseudoRandom(new Date(shiftedDate.getTime() + i * 999)) < 0.15,
    }))

    return { date: day.date, appointments: fillWithSuiviLeads(kept, `${memberId}-d${dayIndex}`) }
  })
}

function resolveCategory(category?: string): string {
  return category ?? 'Rendez-vous clients'
}

function getPseudoRandom(date: Date): number {
  const seed = date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate()
  const value = Math.sin(seed) * 10_000
  return value - Math.floor(value)
}
