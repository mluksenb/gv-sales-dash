import { addDays, addWeeks, startOfWeek } from 'date-fns'
import type { Appointment, ClientProfile, DaySchedule, Task } from '../types'
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
    relation: {
      kind: 'deal',
      dealId: '7829',
      dealAmount: 14_000,
      dealEtape: 'Gagnée',
      projectCount: 3,
    },
    status: 'À traiter',
    slaMinutes: 10,
    dealId: '7829',
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
    relation: {
      kind: 'project',
      projectName: 'Livret Goodvest',
      projectType: 'savings_account',
      projectAmount: 2000,
      projectStatus: 'documents',
    },
    status: 'À traiter',
    slaMinutes: -2944,
    dealId: '7829',
  },
  {
    id: 'task-3',
    createdAt: '06/05 13:40',
    type: 'Rétention livret',
    conseiller: 'Étienne Moreau',
    tier: 'Tier 2',
    prospectType: 'Lead',
    prospectName: 'Virginie Delaunay',
    prospectPhone: '+33712345602',
    relation: {
      kind: 'project',
      projectName: 'Livret Goodvest',
      projectType: 'savings_account',
      projectAmount: 300,
      projectStatus: 'proposition',
    },
    status: 'Terminé',
    slaMinutes: -4020,
    dealId: '8134',
    completedAt: '08/05 09:15',
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
    relation: {
      kind: 'deal',
      dealId: '8134',
      dealAmount: 7_300,
      dealEtape: 'Qualifié',
      projectCount: 1,
      singleProjectName: 'Assurance-vie',
      projectType: 'life_insurance',
    },
    status: 'À traiter',
    slaMinutes: -18043,
    dealId: '8134',
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
    relation: {
      kind: 'deal',
      dealId: '8302',
      dealAmount: 1_000,
      dealEtape: 'Gagnée',
      projectCount: 1,
      singleProjectName: 'Assurance-vie',
      projectType: 'life_insurance',
    },
    status: 'À traiter',
    slaMinutes: -11400,
    dealId: '8302',
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
    relation: {
      kind: 'deal',
      dealId: '8302',
      dealAmount: 1_000,
      dealEtape: 'Gagnée',
      projectCount: 1,
      singleProjectName: 'Assurance-vie',
      projectType: 'life_insurance',
    },
    status: 'À traiter',
    slaMinutes: -11100,
    dealId: '8302',
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
    relation: {
      kind: 'deal',
      dealId: '8302',
      dealAmount: 1_000,
      dealEtape: 'Gagnée',
      projectCount: 1,
      singleProjectName: 'Assurance-vie',
      projectType: 'life_insurance',
    },
    status: 'Terminé',
    slaMinutes: -65200,
    dealId: '8302',
    completedAt: '06/05 11:40',
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
    relation: {
      kind: 'deal',
      dealId: '8567',
      dealAmount: 5_000,
      dealEtape: 'Perdue',
      projectCount: 1,
      singleProjectName: 'PER Individuel',
    },
    status: 'À traiter',
    slaMinutes: -88320,
    dealId: '8567',
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
    relation: {
      kind: 'project',
      projectName: 'Plan Épargne Retraite',
      projectType: 'retirement_plan',
      projectAmount: 300,
      projectStatus: 'proposition',
    },
    status: 'À traiter',
    slaMinutes: -92000,
    dealId: '8567',
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
    relation: {
      kind: 'deal',
      dealId: '8567',
      dealAmount: 5_000,
      dealEtape: 'Perdue',
      projectCount: 1,
      singleProjectName: 'PER Individuel',
    },
    status: 'Terminé',
    slaMinutes: -101500,
    dealId: '8567',
    completedAt: '05/05 16:22',
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
    relation: {
      kind: 'deal',
      dealId: '8901',
      dealAmount: 20_000,
      dealEtape: 'Contacté / RDV pris',
      projectCount: 2,
      projectType: 'life_insurance',
    },
    status: 'À traiter',
    slaMinutes: -104000,
    dealId: '8901',
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
    relation: {
      kind: 'deal',
      dealId: '8901',
      dealAmount: 20_000,
      dealEtape: 'Contacté / RDV pris',
      projectCount: 2,
      projectType: 'life_insurance',
    },
    status: 'Terminé',
    slaMinutes: -124180,
    dealId: '8901',
    completedAt: '04/05 14:05',
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
    relation: {
      kind: 'deal',
      dealId: '8901',
      dealAmount: 20_000,
      dealEtape: 'Contacté / RDV pris',
      projectCount: 2,
      projectType: 'life_insurance',
    },
    status: 'À traiter',
    slaMinutes: -124400,
    dealId: '8901',
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
    relation: {
      kind: 'deal',
      dealId: '7829',
      dealAmount: 14_000,
      dealEtape: 'Gagnée',
      projectCount: 3,
    },
    status: 'À traiter',
    slaMinutes: -124600,
    dealId: '7829',
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
    relation: {
      kind: 'deal',
      dealId: '8134',
      dealAmount: 7_300,
      dealEtape: 'Qualifié',
      projectCount: 1,
      singleProjectName: 'Assurance-vie',
      projectType: 'life_insurance',
    },
    status: 'Terminé',
    slaMinutes: -124900,
    dealId: '8134',
    completedAt: '03/05 10:48',
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

export const clientProfile: ClientProfile = {
  id: 'client-1',
  civilite: 'Mme.',
  prenom: 'Amelie',
  nom: 'Rivard',
  tier: 'Tier 2',
  prospectType: 'Client',
  email: 'amelie.rivard87@protonmail.com',
  phone: '+33 6 58 24 91 37',
  dateNaissance: '03 avril 1991',
  villeNaissance: 'Chambéry',
  departement: 'Savoie',
  paysNaissance: 'France',
  adresse: '148 avenue des Tilleuls',
  ville: 'Barboraz',
  codePostal: '73000',
  pays: 'France',
  situationPro: 'Salarié(e)',
  profession: 'CHEFFE DE MISSION COMPTABLE',
  csp: 'Professions intermédiaires administratives et commerciales des entreprises',
  salaireAnnuel: '48 000 €',
  entreprise: null,
  conseillerName: 'Hildegarde Champey',
  conseillerSince: '09 déc. 2025',
  encoursTotal: 22_310,
  plusValuesCumulees: 160,
  versementsMensuels: 50,
  contratsOuverts: 3,
  derniereConnexion: '16 mai 2026, 19:36',
  projects: [
    {
      id: 'proj-1',
      productName: 'Assurance-vie',
      provider: 'Spirica',
      status: 'Ouvert',
      assure: 'Amelie',
      contrat: '839271605',
      reference: 'Z22241J8',
      soldeActuel: 1_034.94,
      gain: 34.96,
      vlp: null,
      souscriptionDate: '9 mars 2025',
    },
    {
      id: 'proj-2',
      productName: 'Assurance-vie',
      provider: 'Spirica',
      status: 'Ouvert',
      assure: 'Amelie',
      contrat: '517936284',
      reference: 'Z22241J77',
      soldeActuel: 14_152.64,
      gain: 152.64,
      vlp: null,
      souscriptionDate: '9 déc. 2025',
    },
    {
      id: 'proj-3',
      productName: 'Assurance-vie',
      provider: 'Generali',
      status: 'Ouvert',
      assure: 'Amelie',
      contrat: '294760158',
      reference: 'Z2241J72',
      soldeActuel: 7_023.13,
      gain: -273.87,
      vlp: 50,
      souscriptionDate: '9 déc. 2025',
    },
  ],
  deals: [
    {
      id: 'deal-1',
      dealId: '7829',
      creation: '12 mai 2026, 14:22',
      type: 'New Biz',
      source: 'Organic Search',
      owner: 'Hildegarde Champey',
      priority: 'normal',
      montant: 14_000,
      etape: 'Gagnée',
      projets: [
        { projetId: 'proj-2', projetName: 'Assurance-vie', provider: 'Spirica', status: 'Ouvert', creationDate: '14 mai 2026' },
        { projetId: 'proj-3', projetName: 'Assurance-vie', provider: 'Generali', status: 'Ouvert', creationDate: '14 mai 2026' },
        { projetId: 'proj-1', projetName: 'Assurance-vie (enfant)', provider: 'Spirica', status: 'Ouvert', creationDate: '14 mai 2026' },
      ],
      rendezVous: [
        {
          id: 'rdv-7829-1',
          title: 'Appel de qualification',
          startsAt: '2026-05-12T16:00:00',
          durationMinutes: 30,
          owner: 'Hildegarde Champey',
          status: 'Réalisé',
        },
        {
          id: 'rdv-7829-2',
          title: 'Closing téléphonique',
          startsAt: '2026-05-14T10:00:00',
          durationMinutes: 45,
          owner: 'Hildegarde Champey',
          status: 'Réalisé',
        },
      ],
      closedDate: '14 mai 2026',
      lastReachedEtape: null,
      stageHistory: [
        { etape: 'Nouvelle', enteredAt: '12/05/26 14:22', source: 'auto' },
        { etape: 'Contacté / RDV pris', enteredAt: '12/05/26 15:40', source: 'auto' },
        { etape: 'Qualifié', enteredAt: '13/05/26 09:15', source: 'auto' },
        { etape: 'Signé / Souscrit', enteredAt: '13/05/26 17:30', source: 'auto' },
        { etape: 'Gagnée', enteredAt: '14/05/26 10:05', source: 'auto' },
      ],
      amountHistory: [
        { montant: 10_000, changedAt: '12/05/26 14:22' },
        { montant: 12_500, changedAt: '13/05/26 09:15' },
        { montant: 14_000, changedAt: '13/05/26 17:30' },
      ],
      utm: {
        utmSource: 'google',
        utmMedium: 'organic',
        utmCampaign: 'assurance-vie-2026',
        utmContent: 'landing-hero',
      },
    },
    {
      id: 'deal-2',
      dealId: '8134',
      creation: '03 avr. 2026, 09:45',
      type: 'Cross-Sell',
      source: 'Direct',
      owner: 'Hildegarde Champey',
      priority: 'medium',
      montant: 7_300,
      etape: 'Qualifié',
      projets: [{ projetId: 'proj-3', projetName: 'Assurance-vie', provider: 'Generali', status: 'Ouvert', creationDate: '12 avr. 2026' }],
      rendezVous: [
        {
          id: 'rdv-8134-1',
          title: 'Point bilan assurance-vie',
          startsAt: '2026-04-10T14:00:00',
          durationMinutes: 60,
          owner: 'Hildegarde Champey',
          status: 'Réalisé',
        },
        {
          id: 'rdv-8134-2',
          title: 'Proposition commerciale',
          startsAt: '2026-05-28T11:00:00',
          durationMinutes: 45,
          owner: 'Hildegarde Champey',
          status: 'À venir',
        },
      ],
      closedDate: null,
      lastReachedEtape: null,
      stageHistory: [
        { etape: 'Nouvelle', enteredAt: '03/04/26 09:45', source: 'auto' },
        { etape: 'Contacté / RDV pris', enteredAt: '05/04/26 14:10', source: 'auto' },
        { etape: 'Qualifié', enteredAt: '12/04/26 11:20', source: 'auto' },
      ],
      amountHistory: [
        { montant: 5_000, changedAt: '03/04/26 09:45' },
        { montant: 7_300, changedAt: '12/04/26 11:20' },
      ],
      utm: {
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmContent: null,
      },
    },
    {
      id: 'deal-3',
      dealId: '8302',
      creation: '18 mars 2026, 16:10',
      type: 'Upsell',
      source: 'Organic Search',
      owner: 'Hildegarde Champey',
      priority: 'normal',
      montant: 1_000,
      etape: 'Gagnée',
      projets: [{ projetId: 'proj-1', projetName: 'Assurance-vie', provider: 'Spirica', status: 'Ouvert', creationDate: '22 mars 2026' }],
      rendezVous: [
        {
          id: 'rdv-8302-1',
          title: 'Découverte besoins épargne',
          startsAt: '2026-03-19T10:00:00',
          durationMinutes: 45,
          owner: 'Hildegarde Champey',
          status: 'Réalisé',
        },
        {
          id: 'rdv-8302-2',
          title: 'Relance proposition Spirica',
          startsAt: '2026-03-21T15:30:00',
          durationMinutes: 30,
          owner: 'Hildegarde Champey',
          status: 'Annulé',
        },
        {
          id: 'rdv-8302-3',
          title: 'Point signature',
          startsAt: '2026-03-22T09:00:00',
          durationMinutes: 20,
          owner: 'Étienne Moreau',
          status: 'Réalisé',
        },
        {
          id: 'rdv-8302-4',
          title: 'Suivi post-souscription',
          startsAt: '2026-05-25T11:00:00',
          durationMinutes: 30,
          owner: 'Hildegarde Champey',
          status: 'À venir',
        },
      ],
      closedDate: '22 mars 2026',
      lastReachedEtape: null,
      stageHistory: [
        { etape: 'Nouvelle', enteredAt: '18/03/26 16:10', source: 'auto' },
        { etape: 'Contacté / RDV pris', enteredAt: '19/03/26 09:00', source: 'auto' },
        { etape: 'Qualifié', enteredAt: '20/03/26 10:45', source: 'auto' },
        { etape: 'Signé / Souscrit', enteredAt: '21/03/26 14:30', source: 'auto' },
        { etape: 'Gagnée', enteredAt: '22/03/26 08:15', source: 'auto' },
      ],
      amountHistory: [
        { montant: 1_000, changedAt: '18/03/26 16:10' },
      ],
      utm: {
        utmSource: 'google',
        utmMedium: 'organic',
        utmCampaign: 'epargne-responsable',
        utmContent: null,
      },
    },
    {
      id: 'deal-4',
      dealId: '8567',
      creation: '28 fév. 2026, 11:30',
      type: 'New Biz',
      source: 'Paid Search',
      owner: 'Étienne Moreau',
      priority: 'normal',
      montant: 5_000,
      etape: 'Perdue',
      projets: [{ projetId: '', projetName: 'PER Individuel', provider: 'Suravenir', status: 'Clôturé', creationDate: '28 fév. 2026' }],
      rendezVous: [
        {
          id: 'rdv-8567-1',
          title: 'Premier contact',
          startsAt: '2026-03-01T09:30:00',
          durationMinutes: 30,
          owner: 'Étienne Moreau',
          status: 'Réalisé',
        },
        {
          id: 'rdv-8567-2',
          title: 'Présentation offre PER',
          startsAt: '2026-03-08T16:00:00',
          durationMinutes: 30,
          owner: 'Étienne Moreau',
          status: 'No-show',
        },
        {
          id: 'rdv-8567-3',
          title: 'Échange de clôture',
          startsAt: '2026-03-09T15:00:00',
          durationMinutes: 20,
          owner: 'Étienne Moreau',
          status: 'Annulé',
        },
      ],
      closedDate: '10 mars 2026',
      lastReachedEtape: 'Signé / Souscrit',
      stageHistory: [
        { etape: 'Nouvelle', enteredAt: '28/02/26 11:30', source: 'auto' },
        { etape: 'Contacté / RDV pris', enteredAt: '01/03/26 10:15', source: 'auto' },
        { etape: 'Qualifié', enteredAt: '04/03/26 16:00', source: 'auto' },
        { etape: 'Signé / Souscrit', enteredAt: '07/03/26 11:45', source: 'auto' },
        { etape: 'Perdue', enteredAt: '10/03/26 09:30', source: 'auto' },
      ],
      amountHistory: [
        { montant: 8_000, changedAt: '28/02/26 11:30' },
        { montant: 6_500, changedAt: '04/03/26 16:00' },
        { montant: 5_000, changedAt: '07/03/26 11:45' },
      ],
      utm: {
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'per-individuel-q1',
        utmContent: 'banner-retraite',
      },
    },
    {
      id: 'deal-5',
      dealId: '8901',
      creation: '15 jan. 2026, 08:55',
      type: 'Upsell',
      source: 'AI Referral',
      owner: 'Hildegarde Champey',
      priority: 'high',
      montant: 20_000,
      etape: 'Contacté / RDV pris',
      projets: [],
      rendezVous: [
        {
          id: 'rdv-8901-1',
          title: 'Découverte besoins',
          startsAt: '2026-05-30T09:00:00',
          durationMinutes: 45,
          owner: 'Hildegarde Champey',
          status: 'À venir',
        },
      ],
      closedDate: null,
      lastReachedEtape: null,
      stageHistory: [
        { etape: 'Nouvelle', enteredAt: '15/01/26 08:55', source: 'auto' },
        { etape: 'Contacté / RDV pris', enteredAt: '20/01/26 14:30', source: 'auto' },
      ],
      amountHistory: [
        { montant: 15_000, changedAt: '15/01/26 08:55' },
        { montant: 20_000, changedAt: '20/01/26 14:30' },
      ],
      utm: {
        utmSource: 'chatbot',
        utmMedium: 'referral',
        utmCampaign: 'ai-recommandation',
        utmContent: 'upsell-prompt',
      },
    },
  ],
}
