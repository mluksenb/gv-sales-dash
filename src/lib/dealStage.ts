import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Deal, DealCloseDateEntry, DealEtape, DealLossReason } from '../types'

function appendCloseDateHistory(history: DealCloseDateEntry[] | undefined, entry: DealCloseDateEntry): DealCloseDateEntry[] {
  return [...(history ?? []), entry]
}

const OPEN_PIPELINE: DealEtape[] = [
  'Nouvelle',
  'Contacté / RDV pris',
  'Qualifié',
  'Signé',
]

function isTerminal(etape: DealEtape): boolean {
  return etape === 'Gagnée' || etape === 'Perdue'
}

export function formatTodayFrench(date = new Date()): string {
  return format(date, 'd MMMM yyyy', { locale: fr })
}

export function formatStageTimestamp(date = new Date()): string {
  return format(date, 'dd/MM/yy HH:mm')
}

function resolveLastReachedBeforeLoss(deal: Deal): DealEtape {
  if (!isTerminal(deal.etape)) return deal.etape
  if (deal.lastReachedEtape && OPEN_PIPELINE.includes(deal.lastReachedEtape as DealEtape)) {
    return deal.lastReachedEtape as DealEtape
  }
  const fromHistory = [...deal.stageHistory].reverse().find((e) => OPEN_PIPELINE.includes(e.etape))
  return fromHistory?.etape ?? 'Nouvelle'
}

export function applyStageChange(
  deal: Deal,
  newEtape: DealEtape,
  lossReason?: DealLossReason,
  changedBy?: string,
): Deal {
  if (deal.etape === newEtape) return deal

  const timestamp = formatStageTimestamp()
  const today = formatTodayFrench()

  let next: Deal = { ...deal, etape: newEtape }

  if (newEtape === 'Perdue') {
    if (!lossReason) return deal
    next = {
      ...next,
      lossReason,
      lastReachedEtape: resolveLastReachedBeforeLoss(deal),
      closedDate: today,
    }
  } else if (newEtape === 'Gagnée') {
    next = {
      ...next,
      lossReason: undefined,
      lastReachedEtape: null,
      closedDate: today,
    }
  } else {
    next = {
      ...next,
      lossReason: undefined,
      lastReachedEtape: null,
      closedDate: null,
    }
  }

  const lastHistory = deal.stageHistory[deal.stageHistory.length - 1]
  if (lastHistory?.etape !== newEtape) {
    next.stageHistory = [
      ...deal.stageHistory,
      {
        etape: newEtape,
        enteredAt: timestamp,
        ...(changedBy ? { source: 'manual' as const, changedBy } : {}),
      },
    ]
  }

  const prevCd = deal.closedDate ?? null
  const nextCd = next.closedDate ?? null
  if (prevCd !== nextCd) {
    next.closeDateHistory = appendCloseDateHistory(deal.closeDateHistory, {
      closedDate: nextCd,
      changedAt: timestamp,
      source: 'auto',
    })
  }

  return next
}

/** Manual forecast close date from the deal sidebar (blocked when deal is terminal). */
export function applyCloseDateChange(deal: Deal, newClosedDate: string | null | undefined, changedBy: string): Deal {
  if (deal.etape === 'Gagnée' || deal.etape === 'Perdue') return deal
  const normalized = newClosedDate?.trim() ? newClosedDate.trim() : null
  const prevCd = deal.closedDate ?? null
  if (prevCd === normalized) return deal
  const timestamp = formatStageTimestamp()
  return {
    ...deal,
    closedDate: normalized,
    closeDateHistory: appendCloseDateHistory(deal.closeDateHistory, {
      closedDate: normalized,
      changedAt: timestamp,
      source: 'manual',
      changedBy,
    }),
  }
}

export function getStageLabelClass(etape: DealEtape): string {
  if (etape === 'Gagnée') return 'text-emerald-600'
  if (etape === 'Perdue') return 'text-red-600'
  return 'text-gray-900'
}

export const LOSS_REASON_OPTIONS: DealLossReason[] = [
  'Inactivité',
  'Non éligible',
  'Pas intéressé',
  'Trop cher',
]
