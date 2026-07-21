import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Hourglass,
  Inbox,
  Kanban,
  MessageSquare,
  ClipboardList,
  RotateCcw,
  Search,
  SquareKanban,
  Ticket as TicketIcon,
  User,
  Users,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Page } from '../App'

/* ------------------------------------------------------------------ */
/* Types & configuration                                               */
/* ------------------------------------------------------------------ */

type TicketStatus = 'col1' | 'col2' | 'done' | 'closed'

interface PropertyDef {
  key: string
  label: string
  type: 'select' | 'text'
  options?: string[]
  placeholder?: string
}

interface PipelineDef {
  id: string
  label: string
  /** Labels for the two workflow columns; « Terminé » and « Clôturé » are systematic. */
  workflowColumns: [string, string]
  properties: PropertyDef[]
  /** Property key surfaced on the card next to the category badge (e.g. montant for the rachats). */
  cardExtraKey?: string
}

interface TeamDef {
  id: string
  label: string
  icon: LucideIcon
  pipelines: PipelineDef[]
}

interface TicketNote {
  id: string
  author: string
  date: string
  text: string
}

interface Ticket {
  id: string
  ref: string
  pipelineId: string
  customer: string
  product: string
  owner: string
  createdAt: string
  status: TicketStatus
  properties: Record<string, string>
  notes: TicketNote[]
}

const CURRENT_USER = 'Marvin Klap'

const RACHAT_PROPERTIES: PropertyDef[] = [
  { key: 'montant', label: 'Montant du rachat', type: 'text', placeholder: 'ex. 12 000 €' },
  { key: 'typeRachat', label: 'Type de rachat', type: 'select', options: ['Rachat total', 'Rachat partiel'] },
  {
    key: 'motif',
    label: 'Motif du rachat',
    type: 'select',
    options: ['Besoin de liquidités', 'Projet immobilier', 'Insatisfaction performance', 'Changement de situation', 'Autre'],
  },
  { key: 'canal', label: 'Canal de la demande', type: 'select', options: ['Email', 'Téléphone', 'Intercom', 'Courrier'] },
  { key: 'ibanVerifie', label: 'IBAN vérifié', type: 'select', options: ['Oui', 'Non'] },
]

const INCIDENT_PROPERTIES: PropertyDef[] = [
  { key: 'severite', label: 'Sévérité', type: 'select', options: ['P1 — Critique', 'P2 — Majeure', 'P3 — Mineure'] },
  { key: 'environnement', label: 'Environnement', type: 'select', options: ['Production', 'Staging'] },
  { key: 'perimetre', label: 'Périmètre', type: 'text', placeholder: 'ex. Espace client, onboarding…' },
]

const DEMANDE_INTERNE_PROPERTIES: PropertyDef[] = [
  { key: 'categorie', label: 'Catégorie', type: 'select', options: ['Accès', 'Outillage', 'Data', 'Autre'] },
  { key: 'urgence', label: 'Urgence', type: 'select', options: ['Basse', 'Moyenne', 'Haute'] },
]

const TEAMS: TeamDef[] = [
  {
    id: 'operations',
    label: 'Opérations',
    icon: Users,
    pipelines: [
      {
        id: 'demandes-rachat',
        label: 'Demandes de rachat',
        workflowColumns: ['Nouvelles demandes', 'En cours de traitement'],
        properties: RACHAT_PROPERTIES,
        cardExtraKey: 'montant',
      },
    ],
  },
  {
    id: 'tech',
    label: 'Tech',
    icon: Wrench,
    pipelines: [
      {
        id: 'incidents',
        label: 'Incidents',
        workflowColumns: ['À qualifier', 'En cours'],
        properties: INCIDENT_PROPERTIES,
        cardExtraKey: 'severite',
      },
      {
        id: 'demandes-internes',
        label: 'Demandes internes',
        workflowColumns: ['Backlog', 'En cours'],
        properties: DEMANDE_INTERNE_PROPERTIES,
        cardExtraKey: 'urgence',
      },
    ],
  },
]

const COLUMN_ORDER: TicketStatus[] = ['col1', 'col2', 'done', 'closed']

const COLUMN_META: Record<
  TicketStatus,
  {
    icon: LucideIcon
    headerText: string
    iconClass: string
    countClass: string
    containerClass: string
    dividerClass: string
    statusLabelClass: string
  }
> = {
  col1: {
    icon: Inbox,
    headerText: 'text-gray-700',
    iconClass: 'text-blue-500',
    countClass: 'bg-white text-gray-500 border-gray-200',
    containerClass: 'bg-white/50 border border-gray-200/60',
    dividerClass: 'border-gray-200/70',
    statusLabelClass: 'text-blue-700',
  },
  col2: {
    icon: Hourglass,
    headerText: 'text-gray-700',
    iconClass: 'text-amber-500',
    countClass: 'bg-white text-gray-500 border-gray-200',
    containerClass: 'bg-white/50 border border-gray-200/60',
    dividerClass: 'border-gray-200/70',
    statusLabelClass: 'text-amber-700',
  },
  done: {
    icon: CheckCircle2,
    headerText: 'text-emerald-800',
    iconClass: 'text-emerald-600',
    countClass: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
    containerClass: 'bg-emerald-50/70 border border-emerald-200/60',
    dividerClass: 'border-emerald-200/60',
    statusLabelClass: 'text-emerald-700',
  },
  closed: {
    icon: XCircle,
    headerText: 'text-gray-500',
    iconClass: 'text-gray-400',
    countClass: 'bg-gray-200/70 text-gray-500 border-gray-300/60',
    containerClass: 'bg-gray-200/40 border border-gray-300/50',
    dividerClass: 'border-gray-300/50',
    statusLabelClass: 'text-gray-500',
  },
}

/** Columns collapsed by default when opening a pipeline. */
const DEFAULT_COLLAPSED: TicketStatus[] = ['closed']

function columnLabel(pipeline: PipelineDef, status: TicketStatus): string {
  if (status === 'col1') return pipeline.workflowColumns[0]
  if (status === 'col2') return pipeline.workflowColumns[1]
  return status === 'done' ? 'Terminé' : 'Clôturé'
}

const PRODUCT_BADGE_STYLES: Record<string, string> = {
  'Assurance vie': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'PER': 'bg-violet-50 text-violet-700 border-violet-200',
  'Assurance vie enfant': 'bg-sky-50 text-sky-700 border-sky-200',
}

function productBadgeClass(product: string): string {
  return PRODUCT_BADGE_STYLES[product] || 'bg-gray-50 text-gray-600 border-gray-200'
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2)
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const INITIAL_TICKETS: Ticket[] = [
  // --- Opérations · Demandes de rachat ---
  {
    id: 't1', ref: 'OPS-101', pipelineId: 'demandes-rachat', customer: 'Marie Lefebvre', product: 'Assurance vie',
    owner: 'Camille Roussel', createdAt: '4 juil. 2026', status: 'col1',
    properties: { montant: '12 000 €', canal: 'Email' }, notes: [],
  },
  {
    id: 't2', ref: 'OPS-102', pipelineId: 'demandes-rachat', customer: 'Jean-Pierre Morel', product: 'PER',
    owner: 'Thomas Bernard', createdAt: '3 juil. 2026', status: 'col1',
    properties: { montant: '30 000 €' }, notes: [],
  },
  {
    id: 't3', ref: 'OPS-103', pipelineId: 'demandes-rachat', customer: 'Sophie Garnier', product: 'Assurance vie',
    owner: 'Camille Roussel', createdAt: '2 juil. 2026', status: 'col1',
    properties: { montant: '6 400 €', canal: 'Téléphone' }, notes: [],
  },
  {
    id: 't19', ref: 'OPS-111', pipelineId: 'demandes-rachat', customer: 'Bruno Keller', product: 'PER',
    owner: 'Léa Martin', createdAt: '1 juil. 2026', status: 'col1',
    properties: { montant: '9 000 €', canal: 'Intercom' }, notes: [],
  },
  {
    id: 't20', ref: 'OPS-112', pipelineId: 'demandes-rachat', customer: 'Chloé Baron', product: 'Assurance vie',
    owner: 'Thomas Bernard', createdAt: '30 juin 2026', status: 'col1',
    properties: { montant: '25 000 €', canal: 'Email' }, notes: [],
  },
  {
    id: 't21', ref: 'OPS-113', pipelineId: 'demandes-rachat', customer: 'Karim Haddad', product: 'Assurance vie enfant',
    owner: 'Camille Roussel', createdAt: '29 juin 2026', status: 'col1',
    properties: { montant: '4 500 €' }, notes: [],
  },
  {
    id: 't4', ref: 'OPS-104', pipelineId: 'demandes-rachat', customer: 'Antoine Rousseau', product: 'PER',
    owner: 'Léa Martin', createdAt: '26 juin 2026', status: 'col2',
    properties: { montant: '15 000 €', typeRachat: 'Rachat partiel', motif: 'Projet immobilier', canal: 'Intercom', ibanVerifie: 'Oui' },
    notes: [
      { id: 'n1', author: 'Léa Martin', date: '30/06/26 11:24', text: 'Client relancé pour le justificatif de domicile — attendu cette semaine.' },
    ],
  },
  {
    id: 't5', ref: 'OPS-105', pipelineId: 'demandes-rachat', customer: 'Claire Dubois', product: 'Assurance vie',
    owner: 'Thomas Bernard', createdAt: '24 juin 2026', status: 'col2',
    properties: { montant: '8 500 €', typeRachat: 'Rachat partiel', canal: 'Email' },
    notes: [],
  },
  {
    id: 't6', ref: 'OPS-106', pipelineId: 'demandes-rachat', customer: 'Nadia Benali', product: 'Assurance vie enfant',
    owner: 'Camille Roussel', createdAt: '22 juin 2026', status: 'col2',
    properties: { montant: '3 200 €', typeRachat: 'Rachat total', motif: 'Besoin de liquidités', canal: 'Téléphone', ibanVerifie: 'Non' },
    notes: [],
  },
  {
    id: 't7', ref: 'OPS-107', pipelineId: 'demandes-rachat', customer: 'Lucas Marchand', product: 'PER',
    owner: 'Léa Martin', createdAt: '12 juin 2026', status: 'done',
    properties: { montant: '22 000 €', typeRachat: 'Rachat total', motif: 'Changement de situation', canal: 'Email', ibanVerifie: 'Oui' },
    notes: [
      { id: 'n2', author: 'Léa Martin', date: '19/06/26 09:41', text: 'Virement émis le 19/06, confirmation envoyée au client.' },
    ],
  },
  {
    id: 't8', ref: 'OPS-108', pipelineId: 'demandes-rachat', customer: 'Émilie Perrot', product: 'Assurance vie',
    owner: 'Thomas Bernard', createdAt: '10 juin 2026', status: 'done',
    properties: { montant: '5 000 €', typeRachat: 'Rachat partiel', motif: 'Besoin de liquidités', canal: 'Intercom', ibanVerifie: 'Oui' },
    notes: [],
  },
  {
    id: 't9', ref: 'OPS-109', pipelineId: 'demandes-rachat', customer: 'Hugo Lemoine', product: 'Assurance vie',
    owner: 'Camille Roussel', createdAt: '8 juin 2026', status: 'closed',
    properties: { montant: '18 500 €', typeRachat: 'Rachat total', motif: 'Insatisfaction performance', canal: 'Email' },
    notes: [
      { id: 'n3', author: 'Camille Roussel', date: '15/06/26 16:02', text: 'Le client a finalement renoncé au rachat après échange avec son conseiller.' },
    ],
  },
  {
    id: 't10', ref: 'OPS-110', pipelineId: 'demandes-rachat', customer: 'Isabelle Costa', product: 'PER',
    owner: 'Léa Martin', createdAt: '28 mai 2026', status: 'closed',
    properties: { montant: '2 750 €', canal: 'Courrier' }, notes: [],
  },

  // --- Tech · Incidents ---
  {
    id: 't11', ref: 'TEC-201', pipelineId: 'incidents', customer: 'Paul Vasseur', product: 'Assurance vie',
    owner: 'Antoine Petit', createdAt: '6 juil. 2026', status: 'col1',
    properties: { environnement: 'Production' }, notes: [],
  },
  {
    id: 't12', ref: 'TEC-202', pipelineId: 'incidents', customer: 'Julie Fontaine', product: 'PER',
    owner: 'Sarah Nguyen', createdAt: '5 juil. 2026', status: 'col1',
    properties: {}, notes: [],
  },
  {
    id: 't13', ref: 'TEC-203', pipelineId: 'incidents', customer: 'Marc Dupont', product: 'Assurance vie',
    owner: 'Antoine Petit', createdAt: '30 juin 2026', status: 'col2',
    properties: { severite: 'P2 — Majeure', environnement: 'Production', perimetre: 'Espace client — versements' },
    notes: [],
  },
  {
    id: 't14', ref: 'TEC-204', pipelineId: 'incidents', customer: 'Anne Girard', product: 'Assurance vie enfant',
    owner: 'Sarah Nguyen', createdAt: '18 juin 2026', status: 'done',
    properties: { severite: 'P3 — Mineure', environnement: 'Staging', perimetre: 'Onboarding' },
    notes: [],
  },
  {
    id: 't15', ref: 'TEC-205', pipelineId: 'incidents', customer: 'Rémi Charpentier', product: 'PER',
    owner: 'Antoine Petit', createdAt: '9 juin 2026', status: 'closed',
    properties: { severite: 'P3 — Mineure', environnement: 'Production' },
    notes: [],
  },

  // --- Tech · Demandes internes ---
  {
    id: 't16', ref: 'INT-301', pipelineId: 'demandes-internes', customer: 'Équipe Care', product: 'Assurance vie',
    owner: 'Sarah Nguyen', createdAt: '3 juil. 2026', status: 'col1',
    properties: { categorie: 'Outillage' }, notes: [],
  },
  {
    id: 't17', ref: 'INT-302', pipelineId: 'demandes-internes', customer: 'Équipe Conformité', product: 'PER',
    owner: 'Antoine Petit', createdAt: '27 juin 2026', status: 'col2',
    properties: { categorie: 'Data', urgence: 'Haute' },
    notes: [],
  },
  {
    id: 't18', ref: 'INT-303', pipelineId: 'demandes-internes', customer: 'Équipe Ops', product: 'Assurance vie',
    owner: 'Sarah Nguyen', createdAt: '15 juin 2026', status: 'done',
    properties: { categorie: 'Accès', urgence: 'Moyenne' },
    notes: [],
  },
]

/* ------------------------------------------------------------------ */
/* Shared small components                                             */
/* ------------------------------------------------------------------ */

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: string[]
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
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Kanban card                                                         */
/* ------------------------------------------------------------------ */

function TicketCard({
  ticket,
  extraValue,
  isSelected,
  isClosed,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  ticket: Ticket
  extraValue: string
  isSelected: boolean
  isClosed: boolean
  isDragging: boolean
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border p-3 transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
        isSelected ? 'border-emerald-300 ring-2 ring-emerald-400/30' : 'border-gray-200/80 shadow-sm'
      } ${isClosed ? 'opacity-70' : ''} ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[13px] font-semibold text-gray-900 truncate">{ticket.customer}</span>
        <span className="shrink-0 text-[10px] font-medium text-gray-300 pt-0.5">#{ticket.ref}</span>
      </div>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap truncate ${productBadgeClass(ticket.product)}`}>
          {ticket.product}
        </span>
        {extraValue && (
          <span className="shrink-0 text-[12px] font-semibold text-gray-700 truncate">{extraValue}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-100 min-w-0">
        <div
          className="w-[18px] h-[18px] rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-semibold text-gray-600 shrink-0"
          aria-hidden
        >
          {getInitials(ticket.owner)}
        </div>
        <span className="text-[11px] text-gray-500 truncate">{ticket.owner}</span>
        <span className="ml-auto shrink-0 text-[11px] text-gray-400">{ticket.createdAt}</span>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Sidebar : status select, editable properties, notes                 */
/* ------------------------------------------------------------------ */

function StatusCard({
  pipeline,
  status,
  onChange,
}: {
  pipeline: PipelineDef
  status: TicketStatus
  onChange: (status: TicketStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const meta = COLUMN_META[status]
  const Icon = meta.icon

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
          <Icon size={15} className={meta.iconClass} aria-hidden />
        </div>
        <div ref={dropdownRef} className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className={`flex items-center w-full text-left min-w-0 rounded-lg border transition-colors cursor-pointer px-2 py-1 hover:bg-gray-50 hover:border-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 ${
              open ? 'bg-gray-50 border-gray-200' : 'border-transparent'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[12px] text-gray-400">Statut</div>
              <div className={`text-[14px] font-semibold ${meta.statusLabelClass}`}>{columnLabel(pipeline, status)}</div>
            </div>
            <ChevronDown size={14} className="ml-auto text-gray-300 shrink-0" />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 z-20 w-64 bg-white rounded-xl border border-gray-200 shadow-lg py-1">
              {COLUMN_ORDER.map((s) => {
                const m = COLUMN_META[s]
                const OptIcon = m.icon
                const isSelected = s === status
                return (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setOpen(false)
                      if (s !== status) onChange(s)
                    }}
                    className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between gap-2 ${isSelected ? 'font-semibold bg-gray-50' : ''}`}
                  >
                    <span className={`flex items-center gap-2.5 min-w-0 ${m.statusLabelClass}`}>
                      <OptIcon size={14} className="shrink-0" />
                      <span className="truncate">{columnLabel(pipeline, s)}</span>
                    </span>
                    {isSelected && <Check size={14} className="text-emerald-600 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SelectFieldRow({
  def,
  value,
  onChange,
}: {
  def: PropertyDef
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`w-full text-left min-w-0 rounded-lg border transition-colors px-2 py-1 cursor-pointer hover:bg-gray-50 hover:border-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 ${
          open ? 'bg-gray-50 border-gray-200' : 'border-transparent'
        }`}
      >
        <div className="text-[12px] text-gray-400">{def.label}</div>
        <div className={`text-[14px] font-medium min-h-[20px] flex items-center ${value ? 'text-gray-900' : 'text-gray-300'}`}>
          {value || 'À renseigner'}
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 w-full min-w-[220px] bg-white rounded-xl border border-gray-200 shadow-lg py-1 max-h-56 overflow-y-auto">
          {(def.options ?? []).map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false)
                onChange(opt)
              }}
              className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between ${
                opt === value ? 'font-semibold text-emerald-700' : 'text-gray-700'
              }`}
            >
              {opt}
              {opt === value && <Check size={14} className="text-emerald-600 shrink-0" />}
            </button>
          ))}
          {value && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false)
                  onChange('')
                }}
                className="w-full text-left px-3 py-2 text-[13px] text-gray-400 hover:bg-gray-50"
              >
                Effacer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function TextFieldRow({
  def,
  value,
  onCommit,
}: {
  def: PropertyDef
  value: string
  onCommit: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft.trim() !== value) onCommit(draft.trim())
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
        <div className="text-[12px] text-gray-400">{def.label}</div>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(value)
              setEditing(false)
            }
          }}
          placeholder={def.placeholder}
          className="w-full text-[14px] font-medium text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full text-left min-w-0 rounded-lg border border-transparent transition-colors px-2 py-1 cursor-pointer hover:bg-gray-50 hover:border-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30"
    >
      <div className="text-[12px] text-gray-400">{def.label}</div>
      <div className={`text-[14px] font-medium min-h-[20px] flex items-center ${value ? 'text-gray-900' : 'text-gray-300'}`}>
        {value || 'À renseigner'}
      </div>
    </button>
  )
}

function PropertiesCard({
  pipeline,
  ticket,
  owners,
  onPropertyChange,
  onOwnerChange,
}: {
  pipeline: PipelineDef
  ticket: Ticket
  owners: string[]
  onPropertyChange: (key: string, value: string) => void
  onOwnerChange: (owner: string) => void
}) {
  const filled = pipeline.properties.filter((d) => Boolean(ticket.properties[d.key])).length
  const total = pipeline.properties.length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
            <ClipboardList size={16} className="text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Informations à compléter</h3>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            filled === total
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {filled}/{total}
        </span>
      </div>

      <div className="space-y-1">
        {/* Owner — systematic across pipelines */}
        <SelectFieldRow
          def={{ key: 'owner', label: 'Owner', type: 'select', options: owners }}
          value={ticket.owner}
          onChange={(v) => v && onOwnerChange(v)}
        />
        {pipeline.properties.map((def) =>
          def.type === 'select' ? (
            <SelectFieldRow
              key={def.key}
              def={def}
              value={ticket.properties[def.key] ?? ''}
              onChange={(v) => onPropertyChange(def.key, v)}
            />
          ) : (
            <TextFieldRow
              key={def.key}
              def={def}
              value={ticket.properties[def.key] ?? ''}
              onCommit={(v) => onPropertyChange(def.key, v)}
            />
          ),
        )}
      </div>
    </div>
  )
}

function formatNowTimestamp(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  const hh = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mins}`
}

function NotesCard({ notes, onAddNote }: { notes: TicketNote[]; onAddNote: (text: string) => void }) {
  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    const text = draft.trim()
    if (!text) return
    onAddNote(text)
    setDraft('')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
          <MessageSquare size={16} className="text-gray-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
        {notes.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200">
            {notes.length}
          </span>
        )}
      </div>

      {notes.length > 0 && (
        <div className="space-y-3 mb-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-semibold text-gray-600 shrink-0">
                  {getInitials(note.author)}
                </div>
                <span className="text-[12px] font-semibold text-gray-700">{note.author}</span>
                <span className="ml-auto text-[11px] text-gray-400 whitespace-nowrap">{note.date}</span>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{note.text}</p>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ajouter une note interne…"
        rows={3}
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 outline-none resize-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-200"
      />
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-default"
          style={{ backgroundColor: '#0E1111' }}
        >
          Ajouter la note
        </button>
      </div>
    </div>
  )
}

function TicketSidebar({
  ticket,
  pipeline,
  owners,
  onClose,
  onStatusChange,
  onPropertyChange,
  onOwnerChange,
  onAddNote,
}: {
  ticket: Ticket
  pipeline: PipelineDef
  owners: string[]
  onClose: () => void
  onStatusChange: (status: TicketStatus) => void
  onPropertyChange: (key: string, value: string) => void
  onOwnerChange: (owner: string) => void
  onAddNote: (text: string) => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    return () => setVisible(false)
  }, [ticket.id])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 min-h-dvh w-full bg-black/10 z-[100] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-hidden
      />

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
                <TicketIcon size={16} className="text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">Ticket #{ticket.ref}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${productBadgeClass(ticket.product)}`}>
                    {ticket.product}
                  </span>
                </div>
                <div className="text-[13px] text-gray-400 mt-0.5">
                  {pipeline.label} · Créé le {ticket.createdAt}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Customer */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User size={15} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-gray-400 leading-tight">Client</div>
              <button className="text-[13px] font-semibold text-gray-900 hover:text-emerald-700 hover:underline underline-offset-2 truncate leading-tight">
                {ticket.customer}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto bg-[#faf8f5] p-5 space-y-4">
          <StatusCard pipeline={pipeline} status={ticket.status} onChange={onStatusChange} />
          <PropertiesCard
            pipeline={pipeline}
            ticket={ticket}
            owners={owners}
            onPropertyChange={onPropertyChange}
            onOwnerChange={onOwnerChange}
          />
          <NotesCard notes={ticket.notes} onAddNote={onAddNote} />
        </div>
      </div>
    </>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Kanban column                                                       */
/* ------------------------------------------------------------------ */

function KanbanColumn({
  pipeline,
  status,
  tickets,
  selectedTicketId,
  draggingTicketId,
  isDropTarget,
  isCollapsed,
  onToggleCollapse,
  onSelectTicket,
  onTicketDragStart,
  onTicketDragEnd,
  onDragOverColumn,
  onDragLeaveColumn,
  onDropOnColumn,
}: {
  pipeline: PipelineDef
  status: TicketStatus
  tickets: Ticket[]
  selectedTicketId: string | null
  draggingTicketId: string | null
  isDropTarget: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onSelectTicket: (id: string) => void
  onTicketDragStart: (id: string, e: React.DragEvent) => void
  onTicketDragEnd: () => void
  onDragOverColumn: (e: React.DragEvent) => void
  onDragLeaveColumn: (e: React.DragEvent) => void
  onDropOnColumn: (e: React.DragEvent) => void
}) {
  const meta = COLUMN_META[status]
  const Icon = meta.icon
  const label = columnLabel(pipeline, status)

  if (isCollapsed) {
    return (
      <div
        onDragOver={onDragOverColumn}
        onDragLeave={onDragLeaveColumn}
        onDrop={onDropOnColumn}
        className={`rounded-2xl ${meta.containerClass} flex flex-col min-h-0 transition-shadow ${
          isDropTarget ? 'ring-2 ring-emerald-400/60' : ''
        }`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title={`Déplier « ${label} »`}
          className="flex-1 min-h-0 w-full flex flex-col items-center gap-2.5 pt-3.5 pb-3 rounded-2xl hover:bg-black/[0.03] transition-colors cursor-pointer"
        >
          <Icon size={15} className={`${meta.iconClass} shrink-0`} />
          <span className={`[writing-mode:vertical-rl] text-[13px] font-semibold whitespace-nowrap ${meta.headerText}`}>
            {label}
          </span>
          <span
            className={`mt-auto inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.countClass}`}
          >
            {tickets.length}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={onDragOverColumn}
      onDragLeave={onDragLeaveColumn}
      onDrop={onDropOnColumn}
      className={`rounded-2xl ${meta.containerClass} flex flex-col min-h-0 transition-shadow ${
        isDropTarget ? 'ring-2 ring-emerald-400/60' : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        title={`Replier « ${label} »`}
        className="shrink-0 w-full flex items-center gap-2 px-4 pt-3.5 pb-2.5 text-left rounded-t-2xl hover:bg-black/[0.03] transition-colors cursor-pointer"
      >
        <Icon size={15} className={meta.iconClass} />
        <span className={`text-[13px] font-semibold ${meta.headerText}`}>{label}</span>
        <span className={`ml-auto inline-flex items-center justify-center min-w-[22px] px-1.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.countClass}`}>
          {tickets.length}
        </span>
      </button>
      <div className={`shrink-0 mx-3 border-t ${meta.dividerClass}`} />
      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 pt-2.5 pb-2.5 space-y-2">
        {tickets.length === 0 ? (
          <div className="mx-1 mt-1 rounded-xl border border-dashed border-gray-300/70 py-8 text-center text-[12px] text-gray-400">
            Aucun ticket
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              extraValue={pipeline.cardExtraKey ? ticket.properties[pipeline.cardExtraKey] ?? '' : ''}
              isSelected={selectedTicketId === ticket.id}
              isClosed={status === 'closed'}
              isDragging={draggingTicketId === ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
              onDragStart={(e) => onTicketDragStart(ticket.id, e)}
              onDragEnd={onTicketDragEnd}
            />
          ))
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

interface TicketsPageProps {
  setPage: (page: Page) => void
}

export function TicketsPage({ setPage }: TicketsPageProps) {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS)
  const [teamId, setTeamId] = useState<string>(TEAMS[0].id)
  const [pipelineId, setPipelineId] = useState<string>(TEAMS[0].pipelines[0].id)
  const [search, setSearch] = useState('')
  const [filterProduct, setFilterProduct] = useState<Set<string>>(new Set())
  const [filterOwner, setFilterOwner] = useState<Set<string>>(new Set())
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null)
  const [dropTargetStatus, setDropTargetStatus] = useState<TicketStatus | null>(null)
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TicketStatus>>(new Set(DEFAULT_COLLAPSED))
  const [lastMove, setLastMove] = useState<{ ticketId: string; ref: string; from: TicketStatus; toLabel: string } | null>(null)
  const lastDragEndAt = useRef(0)

  const team = TEAMS.find((t) => t.id === teamId) ?? TEAMS[0]
  const pipeline = team.pipelines.find((p) => p.id === pipelineId) ?? team.pipelines[0]

  useEffect(() => {
    if (!lastMove) return
    const id = setTimeout(() => setLastMove(null), 6000)
    return () => clearTimeout(id)
  }, [lastMove])

  const handleTeamChange = (nextTeamId: string) => {
    if (nextTeamId === teamId) return
    const nextTeam = TEAMS.find((t) => t.id === nextTeamId) ?? TEAMS[0]
    setTeamId(nextTeamId)
    setPipelineId(nextTeam.pipelines[0].id)
    setSearch('')
    setFilterProduct(new Set())
    setFilterOwner(new Set())
    setSelectedTicketId(null)
    setCollapsedColumns(new Set(DEFAULT_COLLAPSED))
  }

  const handlePipelineChange = (nextPipelineId: string) => {
    if (nextPipelineId === pipelineId) return
    setPipelineId(nextPipelineId)
    setSearch('')
    setFilterProduct(new Set())
    setFilterOwner(new Set())
    setSelectedTicketId(null)
    setCollapsedColumns(new Set(DEFAULT_COLLAPSED))
  }

  const toggleColumnCollapsed = (status: TicketStatus) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const pipelineTickets = useMemo(
    () => tickets.filter((t) => t.pipelineId === pipeline.id),
    [tickets, pipeline.id],
  )

  const products = useMemo(
    () => [...new Set(pipelineTickets.map((t) => t.product))].sort((a, b) => a.localeCompare(b, 'fr')),
    [pipelineTickets],
  )
  const owners = useMemo(
    () => [...new Set(pipelineTickets.map((t) => t.owner))].sort((a, b) => a.localeCompare(b, 'fr')),
    [pipelineTickets],
  )

  const filteredTickets = pipelineTickets.filter((t) => {
    if (search.trim() && !t.customer.toLowerCase().includes(search.trim().toLowerCase())) return false
    if (filterProduct.size > 0 && !filterProduct.has(t.product)) return false
    if (filterOwner.size > 0 && !filterOwner.has(t.owner)) return false
    return true
  })

  const toggleSet = (prev: Set<string>, value: string): Set<string> => {
    const next = new Set(prev)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const selectedTicket = selectedTicketId ? tickets.find((t) => t.id === selectedTicketId) ?? null : null

  const updateTicket = (id: string, updater: (t: Ticket) => Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? updater(t) : t)))
  }

  const moveTicket = (id: string, to: TicketStatus) => {
    const ticket = tickets.find((t) => t.id === id)
    if (!ticket || ticket.status === to) return
    const from = ticket.status
    updateTicket(id, (t) => ({ ...t, status: to }))
    setLastMove({ ticketId: id, ref: ticket.ref, from, toLabel: columnLabel(pipeline, to) })
  }

  const undoMove = () => {
    if (!lastMove) return
    const { ticketId, from } = lastMove
    updateTicket(ticketId, (t) => ({ ...t, status: from }))
    setLastMove(null)
  }

  const handleTicketDragStart = (id: string, e: React.DragEvent) => {
    e.dataTransfer?.setData('text/plain', id)
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
    setDraggingTicketId(id)
  }

  const handleTicketDragEnd = () => {
    lastDragEndAt.current = Date.now()
    setDraggingTicketId(null)
    setDropTargetStatus(null)
  }

  const handleSelectTicket = (id: string) => {
    // A click event can fire right after a drop lands; don't open the sidebar for it.
    if (Date.now() - lastDragEndAt.current < 250) return
    setSelectedTicketId(id)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#faf8f5]">
      {/* Header */}
      <div className="shrink-0 bg-[#faf8f5]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage('home')}
              className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
              <SquareKanban size={20} className="text-gray-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Tickets — Goodoffice</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              POC
            </span>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-[88rem] px-6 pt-6 flex-1 min-h-0 flex flex-col gap-4">
        {/* Team + pipeline selector */}
        <div className="shrink-0 bg-white rounded-2xl border border-gray-100 px-5 py-3.5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {TEAMS.map((t) => {
              const TeamIcon = t.icon
              const active = t.id === teamId
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTeamChange(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                    active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TeamIcon size={14} className={active ? 'text-emerald-600' : 'text-gray-400'} />
                  {t.label}
                </button>
              )
            })}
          </div>

          <div className="h-6 w-px bg-gray-200" />

          <div className="flex items-center gap-2 flex-wrap">
            {team.pipelines.map((p) => {
              const active = p.id === pipeline.id
              const count = tickets.filter((t) => t.pipelineId === p.id).length
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePipelineChange(p.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Kanban size={14} className={active ? 'text-emerald-600' : 'text-gray-400'} />
                  {p.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      active
                        ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Toolbar: search + filters */}
        <div className="shrink-0 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 w-72 focus-within:ring-2 focus-within:ring-emerald-400/30 focus-within:border-emerald-200">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              className="flex-1 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 bg-transparent"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-300 hover:text-gray-500 shrink-0"
                aria-label="Effacer la recherche"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <FilterDropdown
            label="Tous les produits"
            options={products}
            selected={filterProduct}
            onToggle={(v) => setFilterProduct(toggleSet(filterProduct, v))}
            onClear={() => setFilterProduct(new Set())}
          />
          <FilterDropdown
            label="Tous les owners"
            options={owners}
            selected={filterOwner}
            onToggle={(v) => setFilterOwner(toggleSet(filterOwner, v))}
            onClear={() => setFilterOwner(new Set())}
          />
          <span className="ml-auto text-[12px] text-gray-400">
            {filteredTickets.length} ticket{filteredTickets.length > 1 ? 's' : ''} affiché{filteredTickets.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Kanban board — columns stretch to the bottom, cards scroll inside each column */}
        <div
          className="grid gap-4 flex-1 min-h-0 pb-6"
          style={{
            gridTemplateColumns: COLUMN_ORDER.map((s) => (collapsedColumns.has(s) ? '3rem' : 'minmax(0, 1fr)')).join(' '),
          }}
        >
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              pipeline={pipeline}
              status={status}
              tickets={filteredTickets.filter((t) => t.status === status)}
              selectedTicketId={selectedTicketId}
              draggingTicketId={draggingTicketId}
              isDropTarget={dropTargetStatus === status && draggingTicketId !== null}
              isCollapsed={collapsedColumns.has(status)}
              onToggleCollapse={() => toggleColumnCollapsed(status)}
              onSelectTicket={handleSelectTicket}
              onTicketDragStart={handleTicketDragStart}
              onTicketDragEnd={handleTicketDragEnd}
              onDragOverColumn={(e) => {
                if (!draggingTicketId) return
                e.preventDefault()
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
                if (dropTargetStatus !== status) setDropTargetStatus(status)
              }}
              onDragLeaveColumn={(e) => {
                if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                  setDropTargetStatus((s) => (s === status ? null : s))
                }
              }}
              onDropOnColumn={(e) => {
                e.preventDefault()
                if (draggingTicketId) moveTicket(draggingTicketId, status)
                setDropTargetStatus(null)
                setDraggingTicketId(null)
              }}
            />
          ))}
        </div>
      </div>

      {/* Move confirmation pill */}
      {lastMove && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130]">
          <div
            className="flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 rounded-full shadow-xl text-white"
            style={{ backgroundColor: '#0E1111' }}
          >
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span className="text-[13px] font-medium whitespace-nowrap">
              Ticket #{lastMove.ref} déplacé vers «&nbsp;{lastMove.toLabel}&nbsp;»
            </span>
            <button
              type="button"
              onClick={undoMove}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Ticket details sidebar */}
      {selectedTicket && (
        <TicketSidebar
          ticket={selectedTicket}
          pipeline={pipeline}
          owners={owners}
          onClose={() => setSelectedTicketId(null)}
          onStatusChange={(status) => moveTicket(selectedTicket.id, status)}
          onPropertyChange={(key, value) =>
            updateTicket(selectedTicket.id, (t) => ({ ...t, properties: { ...t.properties, [key]: value } }))
          }
          onOwnerChange={(owner) => updateTicket(selectedTicket.id, (t) => ({ ...t, owner }))}
          onAddNote={(text) =>
            updateTicket(selectedTicket.id, (t) => ({
              ...t,
              notes: [
                ...t.notes,
                { id: `note-${t.id}-${t.notes.length + 1}`, author: CURRENT_USER, date: formatNowTimestamp(), text },
              ],
            }))
          }
        />
      )}
    </div>
  )
}
