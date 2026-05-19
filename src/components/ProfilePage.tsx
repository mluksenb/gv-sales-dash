import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Mail, Phone, CircleAlert, ChevronDown, ChevronUp, ArrowUpDown, Check, User, MapPin, Briefcase, Folder, MoreVertical, Eye, Activity, PiggyBank, ArrowLeftRight, Clock, FileText, Video, PieChart, Sparkles, PhoneCall, ShieldCheck, PenLine, Trophy, XCircle, X, Calendar, Building2, Search, ClipboardList, RotateCcw, Flame, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parse, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clientProfile, tasks as allTasks } from '../data/mockData'
import type { Page } from '../App'
import type {
  ClientProject,
  Deal,
  DealEtape,
  DealLossReason,
  DealPriority,
  DealProjet,
  DealRendezVous,
  DealRendezVousStatus,
  DealStageEntry,
  DealUtm,
  TaskStatus,
  TaskType,
} from '../types'
import { SLAIndicator } from './SLAIndicator'
import { getParisToday } from '../utils/calendarMetrics'
import {
  getProfileTabFromUrl,
  PROFILE_TAB_PARAM,
  type ProfileTab,
} from '../lib/profileTabs'
import { loadDeals, saveDeals } from '../lib/dealStorage'
import { applyStageChange, getStageHistorySourceLabel, getStageLabelClass, LOSS_REASON_OPTIONS } from '../lib/dealStage'

const ALL_TABS = [
  { id: 'informations' as const, label: 'Informations' },
  { id: 'opportunites' as const, label: 'Opportunités' },
  { id: 'projets' as const, label: 'Projets' },
  { id: 'timeline' as const, label: 'Timeline' },
  { id: 'operations' as const, label: 'Opérations' },
  { id: 'documents' as const, label: 'Documents' },
  { id: 'sessions' as const, label: 'Sessions' },
  { id: 'segments' as const, label: 'Segments' },
] as const

const ACTIVE_TABS = new Set<string>(['informations', 'opportunites', 'projets'])

function withProfileTabInUrl(tab: ProfileTab): string {
  const params = new URLSearchParams(window.location.search)
  params.set(PROFILE_TAB_PARAM, tab)
  const query = params.toString()
  return query ? `${window.location.pathname}?${query}` : window.location.pathname
}

interface ProfilePageProps {
  setPage: (page: Page) => void
}

function formatCurrency(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatCurrencyInt(value: number): string {
  return value.toLocaleString('fr-FR') + ' €'
}

function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-900 font-medium">{value || '–'}</div>
    </div>
  )
}

function SectionCard({ icon, title, children, iconBg }: { icon: React.ReactNode; title: string; children: React.ReactNode; iconBg?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${iconBg || 'bg-gray-50 border-gray-100'}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function ProjectCard({ project }: { project: ClientProject }) {
  const gainPositive = project.gain >= 0
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{project.productName}</h4>
          <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            {project.provider}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
            project.status === 'Ouvert'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}>
            {project.status}
          </span>
          <button className="w-7 h-7 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-400">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 text-[13px] text-gray-600 mb-4">
        <div>Assuré : <span className="font-medium text-gray-900">{project.assure}</span></div>
        <div>Contrat : <span className="font-medium text-gray-900">{project.contrat}</span></div>
        <div className="text-gray-400">{project.reference}</div>
      </div>

      <div className="border-t border-gray-100 pt-4 mt-auto space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-500">Solde actuel</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(project.soldeActuel)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-500">Gain</span>
          <span className={`text-sm font-semibold ${gainPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {gainPositive ? '+' : ''}{formatCurrency(project.gain)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-500">V.L.P</span>
          <span className="text-sm font-medium text-gray-900">
            {project.vlp != null ? formatCurrencyInt(project.vlp) : 'Non'}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mt-4">
        <span className="text-[11px] text-gray-400">Souscription : {project.souscriptionDate}</span>
      </div>
    </div>
  )
}

function InformationsTab() {
  const p = clientProfile
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <SectionCard icon={<User size={16} className="text-gray-500" />} title="Informations personnelles">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow label="Prénom" value={p.prenom} />
            <FieldRow label="Nom" value={p.nom} />
            <FieldRow label="Date de naissance" value={p.dateNaissance} />
            <FieldRow label="Ville de naissance" value={p.villeNaissance} />
            <FieldRow label="Département" value={p.departement} />
            <FieldRow label="Pays de naissance" value={p.paysNaissance} />
          </div>
        </SectionCard>

        <SectionCard icon={<MapPin size={16} className="text-orange-500" />} title="Adresse postale" iconBg="bg-orange-50 border-orange-100">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow label="Adresse" value={p.adresse} />
            <FieldRow label="Ville" value={p.ville} />
            <FieldRow label="Code postal" value={p.codePostal} />
            <FieldRow label="Pays" value={p.pays} />
          </div>
        </SectionCard>
      </div>

      <SectionCard icon={<Briefcase size={16} className="text-gray-500" />} title="Activité professionnelle">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <FieldRow label="Situation professionnelle" value={p.situationPro} />
          <FieldRow label="Entreprise" value={p.entreprise} />
        </div>
        <div className="mt-4 space-y-4">
          <FieldRow label="Profession" value={p.profession} />
          <FieldRow label="CSP" value={p.csp} />
          <FieldRow label="Salaire annuel" value={p.salaireAnnuel} />
        </div>
      </SectionCard>
    </div>
  )
}

function ProjetsTab() {
  const { projects } = clientProfile
  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex items-center gap-3">
        {['Tous les fournisseurs', 'Toutes les enveloppes', 'Tous les statuts'].map((label) => (
          <button
            key={label}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            {label}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[13px] text-gray-500">
          <Eye size={14} />
          <span>Afficher archivés</span>
        </div>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-3 gap-5">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}

const ETAPE_PIPELINE: { id: string; label: string; icon: LucideIcon; color: string; activeBg: string; activeText: string; activeBorder: string }[] = [
  { id: 'Nouvelle', label: 'Nouvelle', icon: Sparkles, color: 'text-blue-300', activeBg: 'bg-blue-100', activeText: 'text-blue-700', activeBorder: 'ring-blue-400' },
  { id: 'Contacté / RDV pris', label: 'Contacté / RDV pris', icon: PhoneCall, color: 'text-amber-300', activeBg: 'bg-amber-100', activeText: 'text-amber-700', activeBorder: 'ring-amber-400' },
  { id: 'Qualifié', label: 'Qualifié', icon: ShieldCheck, color: 'text-violet-300', activeBg: 'bg-violet-100', activeText: 'text-violet-700', activeBorder: 'ring-violet-400' },
  { id: 'Signé / Souscrit', label: 'Signé / Souscrit', icon: PenLine, color: 'text-orange-300', activeBg: 'bg-orange-100', activeText: 'text-orange-700', activeBorder: 'ring-orange-400' },
  { id: 'Gagnée', label: 'Gagnée', icon: Trophy, color: 'text-emerald-300', activeBg: 'bg-emerald-100', activeText: 'text-emerald-700', activeBorder: 'ring-emerald-400' },
  { id: 'Perdue', label: 'Perdue', icon: XCircle, color: 'text-red-300', activeBg: 'bg-red-100', activeText: 'text-red-600', activeBorder: 'ring-red-400' },
]

const ETAPE_BADGE_STYLES: Record<string, string> = {
  'Nouvelle': 'bg-blue-50 text-blue-700 border-blue-200',
  'Contacté / RDV pris': 'bg-amber-50 text-amber-700 border-amber-200',
  'Qualifié': 'bg-violet-50 text-violet-700 border-violet-200',
  'Signé / Souscrit': 'bg-orange-50 text-orange-700 border-orange-200',
  'Gagnée': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Perdue': 'bg-red-50 text-red-600 border-red-200',
}

function StageProgressBar({ currentEtape, lastReachedEtape }: { currentEtape: string; lastReachedEtape: string | null }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const isPerdue = currentEtape === 'Perdue'
  const progressStages = ETAPE_PIPELINE.filter((s) => s.id !== 'Perdue')

  const effectiveEtape = isPerdue ? (lastReachedEtape || 'Nouvelle') : currentEtape
  const currentIdx = progressStages.findIndex((s) => s.id === effectiveEtape)

  return (
    <div className="flex items-center gap-1">
      {progressStages.map((stage, i) => {
        const Icon = stage.icon
        const completed = i <= currentIdx
        const isCurrent = !isPerdue && i === currentIdx
        return (
          <div
            key={stage.id}
            className="relative"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                isPerdue
                  ? completed
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-gray-50 text-gray-300'
                  : completed
                    ? `${stage.activeBg} ${stage.activeText}`
                    : 'bg-gray-50 ' + stage.color
              } ${isCurrent ? `ring-2 ${stage.activeBorder}` : ''}`}
            >
              <Icon size={12} />
            </div>
            {hoveredIdx === i && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-gray-900 text-white text-[10px] font-medium whitespace-nowrap z-30 pointer-events-none">
                {stage.label}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-900" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StageBadge({ etape, size = 'md', showIcon = true }: { etape: string; size?: 'sm' | 'md'; showIcon?: boolean }) {
  const isPerdue = etape === 'Perdue'
  const pipelineEntry = ETAPE_PIPELINE.find((s) => s.id === etape)
  const Icon = showIcon ? pipelineEntry?.icon : undefined
  const isSm = size === 'sm'
  return (
    <span className={`inline-flex items-center ${isSm ? 'gap-1 px-2 py-0.5 text-[11px]' : 'gap-1.5 px-2.5 py-0.5 text-[12px]'} rounded-full font-medium border whitespace-nowrap ${
      isPerdue
        ? 'bg-gray-100 text-gray-500 border-gray-300'
        : ETAPE_BADGE_STYLES[etape] || 'bg-gray-50 text-gray-600 border-gray-200'
    }`}>
      {Icon && <Icon size={isSm ? 10 : 11} className="shrink-0" />}
      {isPerdue ? 'Perdue' : etape}
    </span>
  )
}

type SortDir = 'asc' | 'desc'
type SortKey = 'creation' | 'dealId' | 'type' | 'source' | 'owner' | 'priority' | 'montant' | 'etape' | 'closedDate' | 'projetName'

const PRIORITY_SORT_ORDER: Record<DealPriority, number> = { normal: 0, medium: 1, high: 2 }

function getOwnerInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2)
}

function DealPriorityFlames({ priority, size = 14 }: { priority: DealPriority; size?: number }) {
  if (priority === 'normal') return null
  if (priority === 'medium') {
    return <Flame size={size} className="text-orange-500 fill-orange-500 shrink-0" aria-hidden />
  }
  return (
    <span className="inline-flex items-center -space-x-0.5" aria-hidden>
      <Flame size={size} className="text-red-500 fill-red-500 shrink-0" />
      <Flame size={size} className="text-red-500 fill-red-500 shrink-0" />
    </span>
  )
}

const DEAL_TYPE_STYLES: Record<string, string> = {
  'New Biz': 'bg-blue-50 text-blue-700 border-blue-200',
  'Cross-Sell': 'bg-purple-50 text-purple-700 border-purple-200',
  'Upsell': 'bg-pink-50 text-pink-700 border-pink-200',
}

function compareDeal(a: Deal, b: Deal, key: SortKey, dir: SortDir): number {
  let cmp = 0
  if (key === 'montant') {
    cmp = a.montant - b.montant
  } else if (key === 'creation') {
    cmp = a.id.localeCompare(b.id)
  } else if (key === 'closedDate') {
    if (!a.closedDate && !b.closedDate) cmp = 0
    else if (!a.closedDate) cmp = 1
    else if (!b.closedDate) cmp = -1
    else cmp = a.closedDate.localeCompare(b.closedDate, 'fr')
  } else if (key === 'projetName') {
    const av = a.projets[0]?.projetName || ''
    const bv = b.projets[0]?.projetName || ''
    cmp = av.localeCompare(bv, 'fr')
  } else if (key === 'priority') {
    cmp = PRIORITY_SORT_ORDER[a.priority] - PRIORITY_SORT_ORDER[b.priority]
  } else {
    const av = a[key] as string
    const bv = b[key] as string
    cmp = av.localeCompare(bv, 'fr')
  }
  return dir === 'asc' ? cmp : -cmp
}

function FilterDropdown({
  label,
  options,
  bottomOptions,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: string[]
  bottomOptions?: string[]
  selected: Set<string>
  onToggle: (value: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const hasFilter = selected.size > 0
  const displayLabel = hasFilter
    ? selected.size === 1
      ? [...selected][0]
      : `${[...selected][0]} +${selected.size - 1}`
    : label

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium hover:bg-gray-50 ${
          hasFilter
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-white border-gray-200 text-gray-700'
        }`}
      >
        {displayLabel}
        <ChevronDown size={14} className={hasFilter ? 'text-emerald-500' : 'text-gray-400'} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[200px]">
            <button
              onClick={onClear}
              className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between ${!hasFilter ? 'font-semibold text-emerald-700' : 'text-gray-700'}`}
            >
              {label}
              {!hasFilter && <Check size={14} className="text-emerald-600" />}
            </button>
            <div className="border-t border-gray-100 my-1" />
            {options.map((opt) => {
              const checked = selected.has(opt)
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between ${checked ? 'font-semibold text-emerald-700' : 'text-gray-700'}`}
                >
                  {opt}
                  {checked && <Check size={14} className="text-emerald-600" />}
                </button>
              )
            })}
            {bottomOptions && bottomOptions.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-1" />
                {bottomOptions.map((opt) => {
                  const checked = selected.has(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => onToggle(opt)}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between ${checked ? 'font-semibold text-emerald-700' : 'text-gray-700'}`}
                    >
                      {opt}
                      {checked && <Check size={14} className="text-emerald-600" />}
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  alignRight,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey | null
  currentDir: SortDir
  onSort: (key: SortKey) => void
  alignRight?: boolean
}) {
  const active = currentKey === sortKey
  return (
    <th
      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 transition-colors ${
        active ? 'text-gray-700' : 'text-gray-400'
      } ${alignRight ? 'text-right' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${alignRight ? 'justify-end' : ''}`}>
        {label}
        {active ? (
          currentDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ArrowUpDown size={11} className="opacity-40" />
        )}
      </div>
    </th>
  )
}

function ProjetCell({ projets }: { projets: DealProjet[] }) {
  const [open, setOpen] = useState(false)

  if (projets.length === 0) {
    return null
  }

  if (projets.length === 1) {
    return (
      <button className="text-[13px] text-emerald-700 font-medium underline underline-offset-2 hover:text-emerald-800">
        {projets[0].projetName}
      </button>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="text-[13px] text-emerald-700 font-medium underline underline-offset-2 hover:text-emerald-800">
        {projets.length} projets
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-1 z-30">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg py-2 min-w-[220px]">
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Projets liés</div>
            {projets.map((p) => (
              <button
                key={p.projetId || p.projetName}
                className="w-full text-left px-3 py-1.5 text-[13px] text-emerald-700 font-medium hover:bg-gray-50 flex items-center gap-2"
              >
                <Folder size={12} className="text-gray-400 shrink-0" />
                {p.projetName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function parseFrenchDate(s: string): Date {
  const MONTHS: Record<string, number> = {
    'jan.': 0,
    'fév.': 1,
    'mars': 2,
    'avr.': 3,
    'mai': 4,
    'juin': 5,
    'juil.': 6,
    'août': 7,
    'sep.': 8,
    'sept.': 8,
    'oct.': 9,
    'nov.': 10,
    'déc.': 11,
  }
  const m = s.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})(?:,\s*(\d{2}):(\d{2}))?$/)
  if (!m) return new Date(NaN)
  const day = parseInt(m[1], 10)
  const month = MONTHS[m[2]] ?? 0
  const year = parseInt(m[3], 10)
  const hour = m[4] ? parseInt(m[4], 10) : 0
  const min = m[5] ? parseInt(m[5], 10) : 0
  return new Date(year, month, day, hour, min)
}

/** Parses stage/amount history timestamps: compact `DD/MM/YY HH:mm` (or `DD/MM/YYYY`) or legacy French strings. */
function parseDealHistoryInstant(s: string): Date {
  const compact = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (compact) {
    const day = parseInt(compact[1], 10)
    const month = parseInt(compact[2], 10) - 1
    const yStr = compact[3]
    const year = yStr.length === 2 ? 2000 + parseInt(yStr, 10) : parseInt(yStr, 10)
    const hour = compact[4] ? parseInt(compact[4], 10) : 0
    const min = compact[5] ? parseInt(compact[5], 10) : 0
    return new Date(year, month, day, hour, min)
  }
  return parseFrenchDate(s)
}

function formatDealHistoryTimestampDisplay(raw: string): string {
  const d = parseDealHistoryInstant(raw)
  if (!Number.isFinite(d.getTime())) return raw
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  const hh = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mins}`
}

function formatDuration(fromStr: string, toStr: string | null): string {
  const from = parseDealHistoryInstant(fromStr)
  const to = toStr ? parseDealHistoryInstant(toStr) : new Date()
  const diffMs = Math.max(0, to.getTime() - from.getTime())
  const totalMinutes = Math.floor(diffMs / 60_000)
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)

  if (days >= 1) return `${days} jour${days > 1 ? 's' : ''}`
  const h = totalHours
  const m = totalMinutes % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`
  return `${m}min`
}

function DealStageProgressBar({ currentEtape, lastReachedEtape }: { currentEtape: string; lastReachedEtape: string | null }) {
  const isPerdue = currentEtape === 'Perdue'
  const progressStages = ETAPE_PIPELINE.filter((s) => s.id !== 'Perdue')
  const effectiveEtape = isPerdue ? (lastReachedEtape || 'Nouvelle') : currentEtape
  const currentIdx = progressStages.findIndex((s) => s.id === effectiveEtape)

  return (
    <div className="flex items-center gap-1">
      {progressStages.map((stage, i) => {
        const completed = i <= currentIdx
        const stageColors: Record<string, string> = {
          'Nouvelle': '#93c5fd',
          'Contacté / RDV pris': '#fbbf24',
          'Qualifié': '#a78bfa',
          'Signé / Souscrit': '#fb923c',
          'Gagnée': '#34d399',
        }
        return (
          <div
            key={stage.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              !completed ? 'bg-gray-100' : isPerdue ? 'bg-gray-300' : ''
            }`}
            style={!isPerdue && completed ? { backgroundColor: stageColors[stage.id] || '#d1d5db' } : undefined}
          />
        )
      })}
    </div>
  )
}

function StageHistoryLog({ stageHistory, currentEtape }: { stageHistory: DealStageEntry[]; currentEtape: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pl-3 pr-2 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Etape
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Source
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Durée
            </th>
            <th className="pr-3.5 pl-2 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Date de modif.
            </th>
          </tr>
        </thead>
        <tbody>
          {stageHistory.map((entry, i) => {
            const isCurrent = entry.etape === currentEtape
            const nextEntry = stageHistory[i + 1] ?? null
            const duration = formatDuration(entry.enteredAt, nextEntry?.enteredAt ?? null)
            const sourceLabel = getStageHistorySourceLabel(entry)
            return (
              <tr key={i}>
                <td className="pl-3 pr-2 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-3 shrink-0">
                      {isCurrent ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> : null}
                    </div>
                    <span
                      className={`text-[13px] font-medium truncate ${
                        isCurrent ? getStageLabelClass(entry.etape as DealEtape) : 'text-gray-500'
                      }`}
                    >
                      {entry.etape}
                    </span>
                  </div>
                </td>
                <td className={`px-2 py-2.5 text-[13px] whitespace-nowrap ${isCurrent ? 'text-gray-600' : 'text-gray-400'}`}>
                  {sourceLabel}
                </td>
                <td className={`px-2 py-2.5 text-[13px] whitespace-nowrap ${isCurrent ? 'text-gray-500' : 'text-gray-400'}`}>
                  {duration}
                </td>
                <td
                  className={`pr-3.5 pl-2 py-2.5 text-right text-[13px] whitespace-nowrap ${isCurrent ? 'text-gray-700 font-medium' : 'text-gray-400'}`}
                >
                  {formatDealHistoryTimestampDisplay(entry.enteredAt)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}


const OWNER_OPTIONS = ['Hildegarde Champey', 'Étienne Moreau', 'Sophie Laurent', 'Marc Dupont', 'Julie Fontaine']

const PRIORITY_LABELS: Record<DealPriority, string> = {
  normal: 'Normal',
  medium: 'Élevé',
  high: 'Maximum',
}

const PRIORITY_OPTIONS: { value: DealPriority; label: string }[] = [
  { value: 'normal', label: PRIORITY_LABELS.normal },
  { value: 'medium', label: PRIORITY_LABELS.medium },
  { value: 'high', label: PRIORITY_LABELS.high },
]

function formatDateToFrench(isoDate: string): string {
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}

const CLOSE_DATE_MONTHS: Record<string, number> = {
  'jan.': 0,
  'janvier': 0,
  'fév.': 1,
  'février': 1,
  'mars': 2,
  'avr.': 3,
  'avril': 3,
  'mai': 4,
  'juin': 5,
  'juil.': 6,
  'juillet': 6,
  'août': 7,
  'sep.': 8,
  'septembre': 8,
  'oct.': 9,
  'octobre': 9,
  'nov.': 10,
  'novembre': 10,
  'déc.': 11,
  'décembre': 11,
}

function parseCloseDateDisplay(value: string): Date | null {
  const m = value.trim().match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/)
  if (!m) return null
  const month = CLOSE_DATE_MONTHS[m[2].toLowerCase()]
  if (month === undefined) return null
  return new Date(parseInt(m[3], 10), month, parseInt(m[1], 10))
}

function isCloseDateTodayOrPast(displayDate: string): boolean {
  const parsed = parseCloseDateDisplay(displayDate)
  if (!parsed) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  parsed.setHours(0, 0, 0, 0)
  return parsed.getTime() <= today.getTime()
}

function getCloseDateTextClass(displayDate: string | null | undefined, isClosed: boolean): string {
  if (!displayDate) return 'text-gray-400'
  if (isClosed) return 'text-gray-900'
  if (isCloseDateTodayOrPast(displayDate)) return 'text-red-500'
  return 'text-gray-900'
}

function LossReasonModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: (reason: DealLossReason) => void
}) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-[60]" onClick={onCancel} aria-hidden />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-xl p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loss-reason-title"
        >
          <h3 id="loss-reason-title" className="text-[15px] font-semibold text-gray-900 mb-1">
            Raison fermée
          </h3>
          <p className="text-[13px] text-gray-500 mb-4">Sélectionnez la raison de la perte du deal.</p>
          <div className="space-y-1">
            {LOSS_REASON_OPTIONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => onConfirm(reason)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
              >
                {reason}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 w-full py-2.5 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  )
}

function StageCard({
  etape,
  stageHistory,
  onStageChange,
}: {
  etape: DealEtape
  stageHistory: DealStageEntry[]
  onStageChange?: (newEtape: DealEtape, lossReason?: DealLossReason) => void
}) {
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [lossModalOpen, setLossModalOpen] = useState(false)
  const [pendingStageChange, setPendingStageChange] = useState<DealEtape | null>(null)
  const stageDropdownRef = useRef<HTMLDivElement>(null)

  const hasHistory = stageHistory.length > 0
  const currentStageEntry = ETAPE_PIPELINE.find((s) => s.id === etape)
  const currentStageStartEntry = [...stageHistory].reverse().find((e) => e.etape === etape)
  const sinceInCurrentStage = currentStageStartEntry
    ? formatDuration(currentStageStartEntry.enteredAt, null)
    : ''

  useEffect(() => {
    if (!onStageChange) {
      setEditing(false)
      setLossModalOpen(false)
      setPendingStageChange(null)
    }
  }, [onStageChange])

  useEffect(() => {
    if (!editing) return
    const handleClickOutside = (e: MouseEvent) => {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(e.target as Node)) {
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editing])

  const handleStageSelect = (stageId: DealEtape) => {
    if (stageId === etape) {
      setEditing(false)
      return
    }
    if (stageId === 'Perdue') {
      setEditing(false)
      setLossModalOpen(true)
      return
    }
    setEditing(false)
    setPendingStageChange(stageId)
  }

  const handleStageChangeConfirm = () => {
    if (pendingStageChange) {
      onStageChange?.(pendingStageChange)
    }
    setPendingStageChange(null)
  }

  const handleLossReasonConfirm = (reason: DealLossReason) => {
    onStageChange?.('Perdue', reason)
    setLossModalOpen(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
      <LossReasonModal
        open={lossModalOpen}
        onCancel={() => setLossModalOpen(false)}
        onConfirm={handleLossReasonConfirm}
      />
      {pendingStageChange && (
        <ConfirmDialog
          title="Changer l'étape"
          message={`Confirmer le passage de « ${currentStageEntry?.label ?? etape} » à « ${
            ETAPE_PIPELINE.find((s) => s.id === pendingStageChange)?.label ?? pendingStageChange
          } » ?`}
          confirmLabel="Confirmer"
          confirmButtonClassName="text-white bg-emerald-600 hover:bg-emerald-700"
          onConfirm={handleStageChangeConfirm}
          onCancel={() => setPendingStageChange(null)}
        />
      )}

      <div className="flex items-center justify-between gap-1.5">
        <div ref={stageDropdownRef} className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onStageChange && setEditing((v) => !v)}
            disabled={!onStageChange}
            aria-expanded={!!(editing && onStageChange)}
            aria-haspopup="listbox"
            title={onStageChange ? "Modifier l'étape" : undefined}
            className={`flex items-center w-full text-left min-w-0 rounded-lg border transition-colors ${
              onStageChange
                ? `cursor-pointer px-2 py-1 border-transparent hover:bg-gray-50 hover:border-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 focus-visible:border-emerald-200/60 active:bg-gray-100/60 ${
                    editing ? 'bg-gray-50 border-gray-200' : ''
                  }`
                : 'cursor-default py-1 border-transparent'
            }`}
          >
            <div className="text-left min-w-0">
              <div className="text-[12px] text-gray-400">Étape</div>
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 min-w-0">
                <span className={`text-[14px] font-semibold ${getStageLabelClass(etape)}`}>
                  {currentStageEntry?.label ?? etape}
                </span>
                {!historyExpanded && sinceInCurrentStage ? (
                  <span className="text-[13px] font-normal text-gray-400 whitespace-nowrap">
                    (depuis {sinceInCurrentStage})
                  </span>
                ) : null}
              </div>
            </div>
          </button>
          {editing && onStageChange ? (
            <div className="absolute top-full left-0 mt-1 z-20 w-64 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden py-1 max-h-72 overflow-y-auto">
              {ETAPE_PIPELINE.map((stage) => {
                const Icon = stage.icon
                const isSelected = stage.id === etape
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleStageSelect(stage.id as DealEtape)}
                    className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between gap-2 ${
                      isSelected ? 'font-semibold bg-gray-50' : ''
                    }`}
                  >
                    <span className={`flex items-center gap-2.5 min-w-0 ${getStageLabelClass(stage.id as DealEtape)}`}>
                      <Icon size={14} className="shrink-0" />
                      <span className="truncate">{stage.label}</span>
                    </span>
                    {isSelected && <Check size={14} className="text-emerald-600 shrink-0" />}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
        {hasHistory && (
          <button
            type="button"
            onClick={() => setHistoryExpanded((v) => !v)}
            className="shrink-0 p-1 rounded-lg hover:bg-gray-50 group"
            aria-expanded={historyExpanded}
            aria-label="Historique des étapes"
          >
            <ChevronDown
              size={16}
              className={`text-gray-300 group-hover:text-gray-500 transition-all duration-200 ${historyExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${historyExpanded ? 'max-h-[560px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="mt-3 pt-3 border-t border-gray-100">
          <StageHistoryLog stageHistory={stageHistory} currentEtape={etape} />
        </div>
      </div>
    </div>
  )
}

function KeyDetailsCard({
  owner,
  priority,
  closedDate,
  source,
  utm,
  isWon,
  isLost,
}: {
  owner: string
  priority: DealPriority
  closedDate: string | null
  source: string
  utm: DealUtm
  isWon: boolean
  isLost: boolean
}) {
  const [editingField, setEditingField] = useState<'owner' | 'priority' | 'closeDate' | null>(null)
  const [sourceExpanded, setSourceExpanded] = useState(false)
  const [ownerValue, setOwnerValue] = useState(owner)
  const [priorityValue, setPriorityValue] = useState(priority)
  const [closeDateValue, setCloseDateValue] = useState(closedDate || '')
  const [ownerSearch, setOwnerSearch] = useState('')
  const ownerDropdownRef = useRef<HTMLDivElement>(null)
  const priorityDropdownRef = useRef<HTMLDivElement>(null)
  const ownerSearchRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const isClosed = isWon || isLost
  const hasUtm = Boolean(utm.utmSource || utm.utmMedium || utm.utmCampaign || utm.utmContent)
  const utmRows = [
    { label: 'utm_source', value: utm.utmSource },
    { label: 'utm_medium', value: utm.utmMedium },
    { label: 'utm_campaign', value: utm.utmCampaign },
    { label: 'utm_content', value: utm.utmContent },
  ]

  useEffect(() => {
    setPriorityValue(priority)
  }, [priority])

  useEffect(() => {
    setCloseDateValue(closedDate || '')
  }, [closedDate])

  useEffect(() => {
    if (isClosed && editingField === 'closeDate') setEditingField(null)
  }, [isClosed, editingField])

  useEffect(() => {
    if (editingField === 'owner') ownerSearchRef.current?.focus()
    if (editingField === 'closeDate' && !isClosed) {
      dateInputRef.current?.focus()
      dateInputRef.current?.showPicker()
    }
  }, [editingField, isClosed])

  useEffect(() => {
    if (editingField !== 'owner' && editingField !== 'priority') return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (editingField === 'owner' && ownerDropdownRef.current && !ownerDropdownRef.current.contains(target)) {
        setEditingField(null)
        setOwnerSearch('')
      }
      if (editingField === 'priority' && priorityDropdownRef.current && !priorityDropdownRef.current.contains(target)) {
        setEditingField(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editingField])

  const filteredOwners = OWNER_OPTIONS.filter((name) => name.toLowerCase().includes(ownerSearch.toLowerCase()))

  const handleOwnerSelect = (name: string) => {
    setOwnerValue(name)
    setEditingField(null)
    setOwnerSearch('')
  }

  const handlePrioritySelect = (value: DealPriority) => {
    setPriorityValue(value)
    setEditingField(null)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value
    if (isoDate) {
      setCloseDateValue(formatDateToFrench(isoDate))
    }
    setEditingField(null)
  }

  const keyFieldBtnClass = (isActive: boolean, enabled: boolean) =>
    enabled
      ? `w-full text-left min-w-0 rounded-lg border transition-colors px-2 py-1 ${
          isActive
            ? 'border-gray-200 bg-gray-50 cursor-pointer'
            : 'cursor-pointer border-transparent hover:bg-gray-50 hover:border-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 focus-visible:border-emerald-200/60 active:bg-gray-100/60'
        }`
      : 'w-full text-left min-w-0 rounded-lg border border-transparent px-2 py-1 cursor-default'

  const toggleField = (field: 'owner' | 'priority' | 'closeDate') => {
    setEditingField((f) => {
      if (f === field) {
        if (field === 'owner') setOwnerSearch('')
        return null
      }
      if (f === 'owner') setOwnerSearch('')
      return field
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      {/* Owner */}
      <div className="flex items-center gap-3 w-full min-w-0">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-600 shrink-0">
          {getOwnerInitials(ownerValue)}
        </div>
        <div ref={ownerDropdownRef} className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => toggleField('owner')}
            aria-expanded={editingField === 'owner'}
            aria-haspopup="listbox"
            className={keyFieldBtnClass(editingField === 'owner', true)}
          >
            <div className="text-[12px] text-gray-400">Owner</div>
            <div className="text-[14px] font-medium text-gray-900">{ownerValue}</div>
          </button>
          {editingField === 'owner' ? (
            <div className="absolute top-full left-0 mt-1 z-20 w-56 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  ref={ownerSearchRef}
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="flex-1 text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {filteredOwners.length === 0 ? (
                  <div className="px-3 py-2.5 text-[13px] text-gray-400">Aucun résultat</div>
                ) : (
                  filteredOwners.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleOwnerSelect(name)}
                      className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between ${
                        name === ownerValue ? 'font-semibold text-emerald-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-semibold text-gray-600 shrink-0">
                          {getOwnerInitials(name)}
                        </div>
                        {name}
                      </div>
                      {name === ownerValue && <Check size={14} className="text-emerald-600 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Priority */}
      <div className="flex items-center gap-3 w-full min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
          <Flame size={15} className="text-gray-400" />
        </div>
        <div ref={priorityDropdownRef} className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => toggleField('priority')}
            aria-expanded={editingField === 'priority'}
            aria-haspopup="listbox"
            className={keyFieldBtnClass(editingField === 'priority', true)}
          >
            <div className="text-[12px] text-gray-400">Niveau de priorité</div>
            <div
              className={`text-[14px] font-medium min-h-[20px] flex items-center ${
                priorityValue === 'normal' ? 'text-gray-400' : 'text-gray-900'
              }`}
            >
              {PRIORITY_LABELS[priorityValue]}
            </div>
          </button>
          {editingField === 'priority' ? (
            <div className="absolute top-full left-0 mt-1 z-20 w-52 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden py-1">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePrioritySelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between ${
                    option.value === priorityValue ? 'font-semibold text-emerald-700' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                  {option.value === priorityValue && <Check size={14} className="text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Close date */}
      <div className="flex items-center gap-3 w-full min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
          <Calendar size={15} className="text-gray-400" />
        </div>
        <div className="relative flex-1 min-w-0">
          {editingField === 'closeDate' && !isClosed ? (
            <input
              ref={dateInputRef}
              type="date"
              onChange={handleDateChange}
              onBlur={() => setEditingField(null)}
              className="w-full text-[14px] font-medium text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
          ) : isClosed ? (
            <div className={keyFieldBtnClass(false, false)}>
              <div className="text-[12px] text-gray-400">Close date</div>
              <div
                className={`text-[14px] font-medium ${getCloseDateTextClass(
                  closeDateValue || closedDate,
                  isClosed,
                )}`}
              >
                {closeDateValue || 'Non définie'}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => toggleField('closeDate')}
              className={keyFieldBtnClass(false, true)}
            >
              <div className="text-[12px] text-gray-400">Close date</div>
              <div
                className={`text-[14px] font-medium ${getCloseDateTextClass(
                  closeDateValue || closedDate,
                  isClosed,
                )}`}
              >
                {closeDateValue || 'Non définie'}
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Source (+ expandable UTM) */}
      <div>
        <button
          type="button"
          onClick={() => hasUtm && setSourceExpanded((v) => !v)}
          disabled={!hasUtm}
          className={`flex items-center justify-between w-full gap-2 text-left min-w-0 ${hasUtm ? 'cursor-pointer group' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
              <Building2 size={15} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] text-gray-400">Source</div>
              <div className="text-[14px] font-medium text-gray-900 truncate">{source}</div>
            </div>
          </div>
          {hasUtm ? (
            <ChevronDown
              size={16}
              className={`shrink-0 text-gray-300 group-hover:text-gray-500 transition-all duration-200 ${sourceExpanded ? 'rotate-180' : ''}`}
            />
          ) : null}
        </button>
        <div
          className={`overflow-hidden transition-all duration-200 ease-out ${sourceExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {utmRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-gray-400 font-mono">{row.label}</span>
                <span className={`text-[13px] text-right ${row.value ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                  {row.value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function projetKey(p: DealProjet): string {
  return p.projetId || p.projetName
}

function clientProjectToDealProjet(project: ClientProject): DealProjet {
  return {
    projetId: project.id,
    projetName: project.productName,
    provider: project.provider,
    status: project.status,
    creationDate: project.souscriptionDate,
  }
}

function formatAjouterProjetsLabel(count: number): string {
  if (count === 0) return 'Ajouter'
  const noun = count === 1 ? 'projet' : 'projets'
  return `Ajouter ${count} ${noun}`
}

function ProjetTile({
  projet,
  selected = false,
  selectable = false,
  onToggleSelect,
  onDissociate,
}: {
  projet: DealProjet
  selected?: boolean
  selectable?: boolean
  onToggleSelect?: () => void
  onDissociate?: () => void
}) {
  const className = `w-full px-4 py-3 rounded-xl border text-left transition-colors ${
    selected
      ? 'border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-200/80'
      : 'border-gray-100 bg-gray-50/50'
  } ${selectable ? 'cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/30' : ''}`

  const content = (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[13px] font-semibold text-gray-900">{projet.projetName}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            projet.status === 'Ouvert'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-500 border-gray-300'
          }`}>
            {projet.status}
          </span>
          {onDissociate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDissociate()
              }}
              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
              aria-label={`Dissocier ${projet.projetName}`}
            >
              <X size={14} />
            </button>
          )}
          {selectable && selected && (
            <span className="w-6 h-6 rounded-md flex items-center justify-center text-emerald-600">
              <Check size={14} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
          {projet.provider}
        </span>
        <span className="text-[12px] text-gray-400">Créé le {projet.creationDate}</span>
      </div>
    </>
  )

  if (selectable) {
    return (
      <button type="button" onClick={onToggleSelect} className={className}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}

function AssociateProjetsModal({
  availableProjets,
  onConfirm,
  onClose,
}: {
  availableProjets: DealProjet[]
  onConfirm: (projets: DealProjet[]) => void
  onClose: () => void
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const toggleProjet = (projet: DealProjet) => {
    const key = projetKey(projet)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectedCount = selectedKeys.size
  const selectedProjets = availableProjets.filter((p) => selectedKeys.has(projetKey(p)))

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="associate-projets-title"
        className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col max-h-[min(85vh,640px)]"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <h3 id="associate-projets-title" className="text-[15px] font-semibold text-gray-900">
            Associer des projets
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 min-h-0">
          {availableProjets.length === 0 ? (
            <p className="text-[13px] text-gray-400">Tous les projets du client sont déjà associés à ce deal.</p>
          ) : (
            availableProjets.map((p) => (
              <ProjetTile
                key={projetKey(p)}
                projet={p}
                selectable
                selected={selectedKeys.has(projetKey(p))}
                onToggleSelect={() => toggleProjet(p)}
              />
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={selectedCount === 0 || availableProjets.length === 0}
            onClick={() => onConfirm(selectedProjets)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {formatAjouterProjetsLabel(selectedCount)}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmButtonClassName = 'text-white bg-red-600 hover:bg-red-700',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmButtonClassName?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-6"
      >
        <h3 id="confirm-dialog-title" className="text-[15px] font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-[13px] text-gray-500 leading-relaxed mb-6">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${confirmButtonClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjetsCard({
  projets,
  availableProjets,
  onDissociateProjet,
  onAssociateProjets,
}: {
  projets: DealProjet[]
  availableProjets: DealProjet[]
  onDissociateProjet?: (projet: DealProjet) => void
  onAssociateProjets?: (projets: DealProjet[]) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [pendingDissociate, setPendingDissociate] = useState<DealProjet | null>(null)
  const [associateOpen, setAssociateOpen] = useState(false)

  return (
    <>
      {pendingDissociate && onDissociateProjet && (
        <ConfirmDialog
          title="Dissocier ce projet ?"
          message={`Le projet « ${pendingDissociate.projetName} » ne sera plus lié à ce deal.`}
          confirmLabel="Dissocier"
          onCancel={() => setPendingDissociate(null)}
          onConfirm={() => {
            onDissociateProjet(pendingDissociate)
            setPendingDissociate(null)
          }}
        />
      )}
      {associateOpen && onAssociateProjets && (
        <AssociateProjetsModal
          availableProjets={availableProjets}
          onClose={() => setAssociateOpen(false)}
          onConfirm={(selected) => {
            onAssociateProjets(selected)
            setAssociateOpen(false)
          }}
        />
      )}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
            <Folder size={15} className="text-gray-500" />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Projets liés</span>
          <span className="text-[12px] font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
            {projets.length}
          </span>
        </div>
        <ChevronDown size={16} className={`text-gray-300 group-hover:text-gray-500 transition-all duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ease-out ${expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mt-4 space-y-2">
          {projets.length === 0 ? (
            <p className="text-[13px] text-gray-400 px-1">Aucun projet lié à ce deal.</p>
          ) : (
            projets.map((p) => (
              <ProjetTile
                key={projetKey(p)}
                projet={p}
                onDissociate={onDissociateProjet ? () => setPendingDissociate(p) : undefined}
              />
            ))
          )}
          {onAssociateProjets && (
            <button
              type="button"
              onClick={() => setAssociateOpen(true)}
              className="flex items-center gap-1.5 px-1 py-1.5 text-[13px] font-medium text-gray-500 hover:text-emerald-700 transition-colors"
            >
              <Plus size={14} className="shrink-0" />
              Associer un projet
            </button>
          )}
        </div>
      </div>
      </div>
    </>
  )
}

function formatDurationFr(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

const RDV_STATUS_BADGE_STYLES: Record<DealRendezVousStatus, string> = {
  'À venir': 'bg-blue-50 text-blue-700 border-blue-200',
  'Réalisé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Annulé': 'bg-gray-100 text-gray-500 border-gray-300',
  'No-show': 'bg-red-50 text-red-700 border-red-200',
}

function formatRendezVousMeta(rdv: DealRendezVous): string {
  const start = parseISO(rdv.startsAt)
  if (!isValid(start)) return '—'
  const datePart = format(start, 'EEEE d MMMM yyyy', { locale: fr })
  const prettyDate = datePart.charAt(0).toUpperCase() + datePart.slice(1)
  const timePart = format(start, 'HH:mm')
  return `${prettyDate} · ${timePart} · ${formatDurationFr(rdv.durationMinutes)}`
}

function RendezVousTile({ rdv }: { rdv: DealRendezVous }) {
  const titleCancelled = rdv.status === 'No-show' || rdv.status === 'Annulé'
  return (
    <div className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 text-left">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`text-[13px] font-semibold ${
            titleCancelled ? 'text-gray-400 line-through' : 'text-gray-900'
          }`}
        >
          {rdv.title}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${RDV_STATUS_BADGE_STYLES[rdv.status]}`}
        >
          {rdv.status}
        </span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-semibold text-gray-600 shrink-0"
          title={rdv.owner}
        >
          {getOwnerInitials(rdv.owner)}
        </div>
        <span className="text-[12px] text-gray-400 truncate">{formatRendezVousMeta(rdv)}</span>
      </div>
    </div>
  )
}

function RendezVousCard({ rendezVous }: { rendezVous: DealRendezVous[] }) {
  const [expanded, setExpanded] = useState(true)
  const sorted = useMemo(
    () =>
      [...rendezVous].sort((a, b) => {
        const ta = parseISO(a.startsAt).getTime()
        const tb = parseISO(b.startsAt).getTime()
        const na = Number.isNaN(ta) ? 0 : ta
        const nb = Number.isNaN(tb) ? 0 : tb
        return na - nb
      }),
    [rendezVous],
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
            <Calendar size={15} className="text-gray-500" />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Rendez-vous</span>
          <span className="text-[12px] font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
            {rendezVous.length}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-300 group-hover:text-gray-500 transition-all duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="mt-4 space-y-2">
          {sorted.length === 0 ? (
            <p className="text-[13px] text-gray-400 px-1">Aucun rendez-vous lié à ce deal.</p>
          ) : (
            sorted.map((rdv) => <RendezVousTile key={rdv.id} rdv={rdv} />)
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_FILTERS: { label: string; value: 'pending' | 'Terminé' }[] = [
  { label: 'À traiter', value: 'pending' },
  { label: 'Validées', value: 'Terminé' },
]
const TASK_TYPES: TaskType[] = ['Demande de rappel', 'Rétention livret', 'Drop']

const STATUS_BADGE_STYLES: Record<TaskStatus, string> = {
  'À traiter': 'bg-amber-50 text-amber-700 border-amber-200',
  'En cours': 'bg-blue-50 text-blue-700 border-blue-200',
  'Terminé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function getTileStyle(status: TaskStatus): string {
  if (status === 'Terminé') return 'bg-emerald-50/60 border-emerald-200'
  return 'bg-amber-50/60 border-amber-200'
}

function TasksCard({ dealId }: { dealId: string }) {
  const [expanded, setExpanded] = useState(true)
  const [filterStatus, setFilterStatus] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<Set<string>>(new Set())

  const toggleFilter = (prev: Set<string>, value: string): Set<string> => {
    const next = new Set(prev)
    next.has(value) ? next.delete(value) : next.add(value)
    return next
  }

  const dealTasks = useMemo(() => allTasks.filter((t) => t.dealId === dealId), [dealId])

  const filteredTasks = useMemo(() => {
    let result = dealTasks
    if (filterStatus.size > 0) {
      result = result.filter((t) => {
        const isValidated = t.status === 'Terminé'
        const isPending = !isValidated
        return (filterStatus.has('À traiter') && isPending) || (filterStatus.has('Validées') && isValidated)
      })
    }
    if (filterType.size > 0) result = result.filter((t) => filterType.has(t.type))
    return result
  }, [dealTasks, filterStatus, filterType])

  const hasActiveFilter = filterStatus.size > 0 || filterType.size > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
            <ClipboardList size={15} className="text-gray-500" />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">Tâches</span>
          <span className="text-[12px] font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
            {dealTasks.length}
          </span>
        </div>
        <ChevronDown size={16} className={`text-gray-300 group-hover:text-gray-500 transition-all duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ease-out ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {/* Filters */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Toutes"
            options={STATUS_FILTERS.map((f) => f.label)}
            selected={filterStatus}
            onToggle={(v) => setFilterStatus(toggleFilter(filterStatus, v))}
            onClear={() => setFilterStatus(new Set())}
          />
          <FilterDropdown
            label="Tous types"
            options={TASK_TYPES}
            selected={filterType}
            onToggle={(v) => setFilterType(toggleFilter(filterType, v))}
            onClear={() => setFilterType(new Set())}
          />
        </div>

        {/* Task list */}
        <div className="mt-3 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-gray-400">
              {hasActiveFilter ? 'Aucune tâche ne correspond aux filtres' : 'Aucune tâche'}
            </div>
          ) : (
            filteredTasks.map((task) => {
              const parsedDue = parse(task.createdAt, 'dd/MM HH:mm', getParisToday())
              const dueLabel = isValid(parsedDue)
                ? format(parsedDue, "d MMMM yyyy, HH:mm", { locale: fr })
                : task.createdAt

              const isDone = task.status === 'Terminé'
              let completedLabel = ''
              if (isDone && task.completedAt) {
                const parsedCompleted = parse(task.completedAt, 'dd/MM HH:mm', getParisToday())
                completedLabel = isValid(parsedCompleted)
                  ? format(parsedCompleted, "d MMMM yyyy, HH:mm", { locale: fr })
                  : task.completedAt
              }

              return (
                <div
                  key={task.id}
                  className={`group/task relative w-full px-4 py-3 rounded-xl border ${getTileStyle(task.status)}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[13px] font-semibold text-gray-900">{task.type}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE_STYLES[task.status]}`}>
                      {task.status === 'Terminé' ? 'Validée' : task.status}
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-500">
                    Owner : <span className="font-medium text-gray-700">{task.conseiller}</span>
                  </div>
                  {isDone && completedLabel ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] text-gray-500">Validée le {completedLabel}</span>
                      <SLAIndicator minutes={task.slaMinutes} size="sm" />
                    </div>
                  ) : (
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      Échéance : {dueLabel}
                    </div>
                  )}

                  {/* Hover toolbox */}
                  <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-0.5 bg-gray-100 rounded-lg p-1 opacity-0 group-hover/task:opacity-100 transition-opacity shadow-sm">
                    {isDone ? (
                      <button
                        title="Rouvrir la tâche"
                        className="p-1.5 rounded-md hover:bg-amber-100 text-amber-500 hover:text-amber-600 transition-colors"
                      >
                        <RotateCcw size={15} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        title="Marquer traité"
                        className="p-1.5 rounded-md hover:bg-green-100 text-green-500 hover:text-green-600 transition-colors"
                      >
                        <Check size={15} strokeWidth={2.5} />
                      </button>
                    )}
                    <button
                      title="Supprimer"
                      className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export function DealDetailsSidebar({
  deal,
  onClose,
  onDissociateProjet,
  onAssociateProjets,
  onStageChange,
}: {
  deal: Deal
  onClose: () => void
  onDissociateProjet?: (projet: DealProjet) => void
  onAssociateProjets?: (projets: DealProjet[]) => void
  onStageChange?: (newEtape: DealEtape, lossReason?: DealLossReason) => void
}) {
  const [visible, setVisible] = useState(false)
  const [amountExpanded, setAmountExpanded] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    return () => setVisible(false)
  }, [deal.id])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  const typeStyle = DEAL_TYPE_STYLES[deal.type] || 'bg-gray-50 text-gray-600 border-gray-200'
  const isWon = deal.etape === 'Gagnée'
  const isLost = deal.etape === 'Perdue'
  const canModifyProjets = !isWon && !isLost

  return createPortal(
    <>
      {/* Backdrop — portaled to body so fixed positioning isn’t clipped by profile layout */}
      <div
        className={`fixed inset-0 min-h-dvh w-full bg-black/10 z-[100] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-hidden
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-dvh min-h-dvh w-[33.333vw] min-w-[420px] max-w-[640px] bg-white border-l border-gray-200 shadow-2xl z-[110] flex flex-col transition-transform duration-200 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Briefcase size={16} className="text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">Deal #{deal.dealId}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${typeStyle}`}>
                    {deal.type}
                  </span>
                </div>
                <div className="text-[13px] text-gray-400 mt-0.5">Créé le {deal.creation}</div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Amount */}
          <div className={`mb-4 ${isLost ? 'opacity-50' : ''}`}>
            <button
              onClick={() => deal.amountHistory.length > 1 && setAmountExpanded((v) => !v)}
              className={`flex items-center gap-2 group ${deal.amountHistory.length > 1 ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`text-3xl font-bold tracking-tight ${isLost ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {formatCurrencyInt(deal.montant)}
              </span>
              {deal.amountHistory.length > 1 && (
                <ChevronDown size={16} className={`text-gray-300 group-hover:text-gray-500 transition-all duration-200 ${amountExpanded ? 'rotate-180' : ''}`} />
              )}
            </button>
            <div className={`overflow-hidden transition-all duration-200 ease-out ${amountExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pl-3.5 pr-2 py-2 w-0" aria-hidden />
                      <th className="pr-2 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="pr-3.5 pl-2 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Date de modif.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deal.amountHistory.map((entry, i) => {
                      const isCurrent = i === deal.amountHistory.length - 1
                      return (
                        <tr key={i}>
                          <td className="pl-3.5 pr-2 py-2.5 w-0">
                            <div className="flex items-center justify-center w-3">
                              {isCurrent && (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className={`pr-2 py-2.5 text-[13px] font-semibold whitespace-nowrap ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                            {formatCurrencyInt(entry.montant)}
                          </td>
                          <td className={`pr-3.5 pl-2 py-2.5 text-right text-[13px] whitespace-nowrap ${isCurrent ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                            {formatDealHistoryTimestampDisplay(entry.changedAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Stage progress */}
          <DealStageProgressBar currentEtape={deal.etape} lastReachedEtape={deal.lastReachedEtape} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto bg-[#faf8f5] p-5 space-y-4">
          <StageCard
            etape={deal.etape}
            stageHistory={deal.stageHistory}
            onStageChange={canModifyProjets ? onStageChange : undefined}
          />

          {/* Key details card */}
          <KeyDetailsCard
            owner={deal.owner}
            priority={deal.priority}
            closedDate={deal.closedDate}
            source={deal.source}
            utm={deal.utm}
            isWon={isWon}
            isLost={isLost}
          />

          {/* Projets card */}
          <ProjetsCard
            projets={deal.projets}
            availableProjets={getAvailableProjetsForDeal(deal)}
            onDissociateProjet={canModifyProjets ? onDissociateProjet : undefined}
            onAssociateProjets={canModifyProjets ? onAssociateProjets : undefined}
          />

          <RendezVousCard rendezVous={deal.rendezVous ?? []} />

          {/* Tasks card */}
          <TasksCard dealId={deal.dealId} />
        </div>

      </div>
    </>,
    document.body,
  )
}

function removeProjetFromDeal(deal: Deal, projet: DealProjet): Deal {
  const key = projetKey(projet)
  return {
    ...deal,
    projets: deal.projets.filter((p) => projetKey(p) !== key),
  }
}

function addProjetsToDeal(deal: Deal, projets: DealProjet[]): Deal {
  const linkedKeys = new Set(deal.projets.map(projetKey))
  const toAdd = projets.filter((p) => !linkedKeys.has(projetKey(p)))
  return { ...deal, projets: [...deal.projets, ...toAdd] }
}

function getAvailableProjetsForDeal(deal: Deal): DealProjet[] {
  const linkedKeys = new Set(deal.projets.map(projetKey))
  return clientProfile.projects
    .filter((p) => !linkedKeys.has(p.id))
    .map(clientProjectToDealProjet)
}

const SANS_PROJET = 'Sans projet'

function DealsTab() {
  const [deals, setDeals] = useState<Deal[]>(() => loadDeals(clientProfile.deals))

  useEffect(() => {
    saveDeals(deals)
  }, [deals])

  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterType, setFilterType] = useState<Set<string>>(new Set())
  const [filterEtape, setFilterEtape] = useState<Set<string>>(new Set())
  const [filterProjet, setFilterProjet] = useState<Set<string>>(new Set())
  const [filterOwner, setFilterOwner] = useState<Set<string>>(new Set())
  const [filterSource, setFilterSource] = useState<Set<string>>(new Set())
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)

  const types = ['New Biz', 'Cross-Sell', 'Upsell']
  const etapes = ['Nouvelle', 'Contacté / RDV pris', 'Qualifié', 'Signé / Souscrit', 'Gagnée', 'Perdue']
  const projets = [
    ...new Set(deals.flatMap((d) => d.projets.map((p) => p.projetName).filter(Boolean))),
  ].sort((a, b) => a.localeCompare(b, 'fr'))
  const owners = [...new Set(deals.map((d) => d.owner))].sort((a, b) => a.localeCompare(b, 'fr'))
  const sources = [...new Set(deals.map((d) => d.source))].sort()

  const toggleSet = (prev: Set<string>, value: string): Set<string> => {
    const next = new Set(prev)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  let filtered = deals.filter((d) => {
    if (filterType.size > 0 && !filterType.has(d.type)) return false
    if (filterEtape.size > 0 && !filterEtape.has(d.etape)) return false
    if (filterProjet.size > 0) {
      const hasSansProjet = filterProjet.has(SANS_PROJET)
      const namedFilters = new Set([...filterProjet].filter((v) => v !== SANS_PROJET))
      const names = d.projets.map((p) => p.projetName)
      const matches =
        (hasSansProjet && d.projets.length === 0) ||
        (namedFilters.size > 0 && names.some((name) => namedFilters.has(name)))
      if (!matches) return false
    }
    if (filterOwner.size > 0 && !filterOwner.has(d.owner)) return false
    if (filterSource.size > 0 && !filterSource.has(d.source)) return false
    return true
  })

  if (sortKey) {
    filtered = [...filtered].sort((a, b) => compareDeal(a, b, sortKey, sortDir))
  }

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <FilterDropdown label="Tous les types" options={types} selected={filterType} onToggle={(v) => setFilterType(toggleSet(filterType, v))} onClear={() => setFilterType(new Set())} />
          <FilterDropdown label="Toutes les étapes" options={etapes} selected={filterEtape} onToggle={(v) => setFilterEtape(toggleSet(filterEtape, v))} onClear={() => setFilterEtape(new Set())} />
          <FilterDropdown label="Tous les projets" options={projets} bottomOptions={[SANS_PROJET]} selected={filterProjet} onToggle={(v) => setFilterProjet(toggleSet(filterProjet, v))} onClear={() => setFilterProjet(new Set())} />
          <FilterDropdown label="Tous les owners" options={owners} selected={filterOwner} onToggle={(v) => setFilterOwner(toggleSet(filterOwner, v))} onClear={() => setFilterOwner(new Set())} />
          <FilterDropdown label="Toutes les sources" options={sources} selected={filterSource} onToggle={(v) => setFilterSource(toggleSet(filterSource, v))} onClear={() => setFilterSource(new Set())} />
        </div>
        <button
          type="button"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90"
          style={{ backgroundColor: '#0E1111' }}
        >
          Créer une opportunité
        </button>
      </div>

      {/* Deals table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-visible">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <SortHeader label="Création" sortKey="creation" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Type" sortKey="type" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Projet" sortKey="projetName" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Prio" sortKey="priority" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Montant" sortKey="montant" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} alignRight />
              <SortHeader label="Étape" sortKey="etape" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <th className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
              <SortHeader label="Close Date" sortKey="closedDate" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Source" sortKey="source" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Owner" sortKey="owner" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-center text-[13px] text-gray-400">Aucun deal ne correspond aux filtres sélectionnés</td>
              </tr>
            ) : (
              filtered.map((deal, i) => {
                const alt = i % 2 === 1
                const rowBg = alt ? 'bg-gray-50/80' : ''
                const isSelected = selectedDeal?.id === deal.id
                const isPerdue = deal.etape === 'Perdue'
                return (
                  <tr
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal)}
                    className={`border-b border-gray-200 last:border-b-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/60 hover:bg-emerald-50/80' : `hover:bg-amber-100/60 ${rowBg}`
                    }`}
                  >
                    <td className="px-5 py-3.5 text-[13px] text-gray-500 whitespace-nowrap">{deal.creation}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${DEAL_TYPE_STYLES[deal.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {deal.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <ProjetCell projets={deal.projets} />
                    </td>
                    <td className={`px-5 py-3.5 ${isPerdue ? 'opacity-50' : ''}`}>
                      <DealPriorityFlames priority={deal.priority} size={14} />
                    </td>
                    <td className={`px-5 py-3.5 text-[13px] font-semibold text-right whitespace-nowrap ${isPerdue ? 'text-gray-400' : 'text-gray-900'}`}>{formatCurrencyInt(deal.montant)}</td>
                    <td className="px-5 py-3.5">
                      <StageProgressBar currentEtape={deal.etape} lastReachedEtape={deal.lastReachedEtape} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StageBadge etape={deal.etape} showIcon={false} />
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500 whitespace-nowrap">{deal.closedDate || '–'}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-700">{deal.source}</td>
                    <td className="px-5 py-3.5">
                      <div
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600 shrink-0"
                        title={deal.owner}
                      >
                        {getOwnerInitials(deal.owner)}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Deal details sidebar */}
      {selectedDeal && (
        <DealDetailsSidebar
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onDissociateProjet={(projet) => {
            const updated = removeProjetFromDeal(selectedDeal, projet)
            setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
            setSelectedDeal(updated)
          }}
          onAssociateProjets={(projets) => {
            const updated = addProjetsToDeal(selectedDeal, projets)
            setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
            setSelectedDeal(updated)
          }}
          onStageChange={(newEtape, lossReason) => {
            const updated = applyStageChange(selectedDeal, newEtape, lossReason, selectedDeal.owner)
            setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
            setSelectedDeal(updated)
          }}
        />
      )}
    </div>
  )
}

export function ProfilePage({ setPage: _setPage }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => getProfileTabFromUrl(window.location.search))
  const p = clientProfile

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getProfileTabFromUrl(window.location.search))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const nextUrl = withProfileTabInUrl(activeTab)
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState({}, '', nextUrl)
    }
  }, [activeTab])

  const handleTabChange = (nextTab: ProfileTab) => {
    if (nextTab === activeTab) return
    setActiveTab(nextTab)
    window.history.pushState({}, '', withProfileTabInUrl(nextTab))
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto w-full max-w-[88rem] p-6 space-y-4">
        {/* Breadcrumb card */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User size={16} className="text-gray-500" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-gray-900">Fiche client</div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <span>Clients</span>
                <ChevronRight size={10} className="text-gray-300" />
                <span>{p.civilite} {p.prenom} {p.nom}</span>
                <ChevronRight size={10} className="text-gray-300" />
                <span className="text-gray-600">{{ informations: 'Informations', opportunites: 'Opportunités', projets: 'Projets' }[activeTab]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100">
              <CircleAlert size={14} />
              Signaler suspect
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90" style={{ backgroundColor: '#0E1111' }}>
              Actions
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
        {/* Top row: client identity card + advisor card */}
        <div className="flex gap-4">
          {/* Client identity & contact card */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-violet-100/70 pointer-events-none" />
              <div className="relative px-4 py-3">
                <div className="flex items-center gap-2.5 mb-0.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <h1 className="text-lg font-bold text-gray-900">{p.civilite} {p.prenom} {p.nom}</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-300">
                    {p.tier}
                  </span>
                  <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-400">
                    Client
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 mb-2 ml-10">
                  Dernière connexion : {p.derniereConnexion}
                </div>

                <div className="border-t border-gray-100 pt-2.5 flex flex-wrap items-start gap-x-6 gap-y-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Mail size={14} className="text-gray-700" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-gray-400 leading-tight">Email</div>
                      <a
                        href={`mailto:${p.email}`}
                        className="text-[13px] font-semibold text-gray-900 hover:text-emerald-700 hover:underline underline-offset-2 block truncate leading-tight"
                      >
                        {p.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Phone size={14} className="text-gray-700" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-gray-400 leading-tight">Numéro de téléphone</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap leading-tight">{p.phone}</span>
                        <button
                          type="button"
                          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 shrink-0"
                          aria-label="Appeler"
                        >
                          <Phone size={11} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advisor card */}
          <div className="w-64 shrink-0 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Conseiller attitré</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                CGP
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden shrink-0">
                HC
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-gray-900">{p.conseillerName}</div>
                <div className="text-[11px] text-gray-400">🗓 depuis le {p.conseillerSince}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1">
            <span className="text-xs">📊</span>
            <span>Cumulé sur {p.contratsOuverts} contrats ouverts</span>
          </div>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <PieChart size={15} className="text-gray-500" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">Encours total</div>
                <div className="text-[15px] font-bold text-gray-900">{formatCurrencyInt(p.encoursTotal)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <ArrowLeftRight size={15} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">Plus values cumulées</div>
                <div className="text-[15px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="text-[10px]">↗</span>
                  +{formatCurrencyInt(p.plusValuesCumulees)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                <Clock size={15} className="text-orange-500" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">Versements mensuels</div>
                <div className="text-[15px] font-bold text-gray-900">{p.versementsMensuels} €/mois</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-2xl border border-gray-100 px-2">
          <div className="flex gap-0">
            {ALL_TABS.map((tab) => {
              const isActive = tab.id === activeTab
              const isClickable = ACTIVE_TABS.has(tab.id)
              const TabIcon = {
                informations: User,
                opportunites: Briefcase,
                projets: Folder,
                timeline: Activity,
                operations: PiggyBank,
                documents: FileText,
                sessions: Video,
                segments: PieChart,
              }[tab.id]
              return (
                <button
                  key={tab.id}
                  onClick={() => isClickable && handleTabChange(tab.id as ProfileTab)}
                  className={`relative px-4 py-3 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
                >
                  <div className="flex items-center gap-1.5">
                    {TabIcon && <TabIcon size={14} />}
                    {tab.label}
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-900 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'informations' && <InformationsTab />}
          {activeTab === 'opportunites' && <DealsTab />}
          {activeTab === 'projets' && <ProjetsTab />}
        </div>
      </div>
    </div>
  )
}
