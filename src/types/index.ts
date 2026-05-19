export type TierLevel = 'Tier 1' | 'Tier 2' | 'Tier 3'
export type ProspectType = 'Lead' | 'Client'
export type AppointmentCategory = 'Rendez-vous clients' | 'Care' | 'OOO' | 'Interne' | 'Suivi leads'
export type TaskType = 'Demande de rappel' | 'Rétention livret' | 'Drop'
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

export type TaskProjectRelation = {
  kind: 'project'
  projectName: string
  projectType: ProjectType
  projectAmount: number
  projectStatus: ProjectStatus
}

export type TaskDealRelation = {
  kind: 'deal'
  dealId: string
  dealAmount: number
  dealEtape: DealEtape
  projectCount: number
  /** Set when the deal has a single linked project */
  singleProjectName?: string
  /** Used for product filters when inferable from the deal */
  projectType?: ProjectType
}

export type TaskRelation = TaskProjectRelation | TaskDealRelation

interface TaskBase {
  id: string
  createdAt: string
  conseiller: string
  tier: TierLevel
  prospectType: ProspectType
  prospectName: string
  prospectPhone: string
  status: TaskStatus
  slaMinutes: number
  dealId?: string
  completedAt?: string
}

/** Rétention livret tasks are always linked to a project; other types are always linked to a deal. */
export type Task =
  | (TaskBase & { type: 'Rétention livret'; relation: TaskProjectRelation })
  | (TaskBase & { type: 'Demande de rappel'; relation: TaskDealRelation })
  | (TaskBase & { type: 'Drop'; relation: TaskDealRelation })

export type DealType = 'New Biz' | 'Cross-Sell' | 'Upsell'
export type DealSource = 'Direct' | 'Paid Search' | 'Organic Search' | 'AI Referral'
export type DealEtape = 'Nouvelle' | 'Contacté / RDV pris' | 'Qualifié' | 'Signé / Souscrit' | 'Gagnée' | 'Perdue'

export type DealLossReason = 'Inactivité' | 'Non éligible' | 'Pas intéressé' | 'Trop cher'

export interface DealProjet {
  projetId: string
  projetName: string
  provider: string
  status: 'Ouvert' | 'Clôturé'
  creationDate: string
}

export interface DealStageEntry {
  etape: DealEtape
  enteredAt: string
  /** Omit or `auto` for system transitions; `manual` when changed in Key details. */
  source?: 'auto' | 'manual'
  /** Display name when `source` is `manual` (e.g. deal owner). */
  changedBy?: string
}

export interface DealAmountEntry {
  montant: number
  changedAt: string
}

export interface DealUtm {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
}

export type DealPriority = 'normal' | 'medium' | 'high'

export interface Deal {
  id: string
  dealId: string
  creation: string
  type: DealType
  source: DealSource
  owner: string
  priority: DealPriority
  montant: number
  etape: DealEtape
  projets: DealProjet[]
  closedDate: string | null
  lastReachedEtape: string | null
  stageHistory: DealStageEntry[]
  amountHistory: DealAmountEntry[]
  utm: DealUtm
  /** Set when etape is Perdue (loss reason from close modal). */
  lossReason?: DealLossReason
}

export type ContractStatus = 'Ouvert' | 'Clôturé'

export interface ClientProject {
  id: string
  productName: string
  provider: string
  status: ContractStatus
  assure: string
  contrat: string
  reference: string
  soldeActuel: number
  gain: number
  vlp: number | null
  souscriptionDate: string
}

export interface ClientProfile {
  id: string
  civilite: string
  prenom: string
  nom: string
  tier: TierLevel
  prospectType: ProspectType
  email: string
  phone: string
  dateNaissance: string
  villeNaissance: string
  departement: string
  paysNaissance: string
  adresse: string
  ville: string
  codePostal: string
  pays: string
  situationPro: string
  profession: string
  csp: string
  salaireAnnuel: string
  entreprise: string | null
  conseillerName: string
  conseillerSince: string
  encoursTotal: number
  plusValuesCumulees: number
  versementsMensuels: number
  contratsOuverts: number
  derniereConnexion: string
  projects: ClientProject[]
  deals: Deal[]
}
