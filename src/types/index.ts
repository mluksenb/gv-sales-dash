export type TierLevel = 'Tier 1' | 'Tier 2' | 'Tier 3'
export type ProspectType = 'Lead' | 'Client'
export type AppointmentCategory = 'Rendez-vous clients' | 'Care' | 'OOO' | 'Interne' | 'Suivi leads'
export type TaskType = 'Rappel explicite' | 'Rétention livret' | 'Tél récolté'
export type TaskStatus = 'À traiter' | 'En cours' | 'Terminé'
export type ProjectType =
  | 'life_insurance'
  | 'life_insurance_kid'
  | 'savings_account'
  | 'retirement_plan'
export type ProjectStatus = 'proposition' | 'simulation' | 'souscription' | 'documents' | 'envoi'

export interface Appointment {
  id: string
  time: string
  name: string
  category?: AppointmentCategory
  prospectType: ProspectType
  tier?: TierLevel
  hasTel?: boolean
  isNew?: boolean
  timeHint?: string
  noShow?: boolean
}

export interface DaySchedule {
  date: Date
  appointments: Appointment[]
}

export interface Task {
  id: string
  createdAt: string
  type: TaskType
  conseiller: string
  tier: TierLevel
  prospectType: ProspectType
  prospectName: string
  projectName: string
  projectType: ProjectType
  projectAmount: number
  projectStatus: ProjectStatus
  status: TaskStatus
  slaMinutes: number
}
