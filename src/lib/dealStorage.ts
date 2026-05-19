import type { Deal, DealCloseDateEntry, DealStageEntry } from '../types'

/** Ancienne persistance sans enrichissement automatique depuis les mocks à jour */
const LEGACY_STORAGE_KEY = 'goodvest-proto-deals'

/** Nouvelle série de snapshots dans le navigateur — bump si nécessaire. */
const STORAGE_KEY = 'goodvest-proto-deals-v2'

/** Réinjecte source / changedBy depuis les mocks (clé exacte puis même rang + même étape si horodatages divergent). */
function enrichStageHistoryFromFallback(stored: DealStageEntry[], fb: DealStageEntry[]): DealStageEntry[] {
  if (!fb.length || !stored.length) return stored
  const fbByKey = new Map(fb.map((e) => [`${e.etape}|${e.enteredAt}`, e]))
  return stored.map((entry, i) => {
    const keyed = fbByKey.get(`${entry.etape}|${entry.enteredAt}`)
    const atIndex = fb[i]
    const attribution =
      keyed?.source === 'manual' && keyed.changedBy
        ? keyed
        : atIndex?.etape === entry.etape && atIndex.source === 'manual' && atIndex.changedBy
          ? atIndex
          : null
    if (attribution?.source === 'manual' && attribution.changedBy) {
      return { ...entry, source: 'manual', changedBy: attribution.changedBy }
    }
    return entry
  })
}

/** Réinjecte source / changedBy sur l'historique des dates de clôture depuis les mocks. */
function enrichCloseDateHistoryFromFallback(
  stored: DealCloseDateEntry[],
  fb: DealCloseDateEntry[],
): DealCloseDateEntry[] {
  if (!fb.length || !stored.length) return stored
  const fbByKey = new Map(fb.map((e) => [`${e.closedDate ?? ''}|${e.changedAt}`, e]))
  return stored.map((entry, i) => {
    const keyed = fbByKey.get(`${entry.closedDate ?? ''}|${entry.changedAt}`)
    const atIndex = fb[i]
    const attribution =
      keyed?.source === 'manual' && keyed.changedBy
        ? keyed
        : atIndex?.closedDate === entry.closedDate &&
            atIndex?.changedAt === entry.changedAt &&
            atIndex.source === 'manual' &&
            atIndex.changedBy
          ? atIndex
          : null
    if (attribution?.source === 'manual' && attribution.changedBy) {
      return { ...entry, source: 'manual', changedBy: attribution.changedBy }
    }
    return entry
  })
}

export function loadDeals(fallback: Deal[]): Deal[] {
  try {
    let migratedFromLegacy = false
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw && localStorage.getItem(LEGACY_STORAGE_KEY)) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY)
      migratedFromLegacy = true
    }
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Deal[]
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback

    const fallbackById = new Map(fallback.map((d) => [d.id, d]))
    const merged = parsed.map((stored) => {
      const fb = fallbackById.get(stored.id)
      if (!fb) return stored

      let next: Deal = stored

      // Anciennes persistance sans ce champ : reprendre les rendez-vous des mocks
      if (!Array.isArray(stored.rendezVous)) {
        next = { ...next, rendezVous: fb.rendezVous ?? [] }
      }

      const closeDateHistoryBase = Array.isArray(stored.closeDateHistory)
        ? stored.closeDateHistory
        : (fb.closeDateHistory ?? [])

      next = {
        ...next,
        stageHistory: enrichStageHistoryFromFallback(next.stageHistory ?? [], fb.stageHistory ?? []),
        closeDateHistory: enrichCloseDateHistoryFromFallback(closeDateHistoryBase, fb.closeDateHistory ?? []),
      }

      return next
    })

    if (migratedFromLegacy) {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY)
      } catch {
        //
      }
    }

    return merged
  } catch {
    return fallback
  }
}

export function saveDeals(deals: Deal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals))
  } catch {
    // Proto: ignore quota / private mode errors
  }
}
