import type { Deal } from '../types'

const STORAGE_KEY = 'goodvest-proto-deals'

export function loadDeals(fallback: Deal[]): Deal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Deal[]
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback

    const fallbackById = new Map(fallback.map((d) => [d.id, d]))
    return parsed.map((stored) => {
      const fb = fallbackById.get(stored.id)
      if (!fb) return stored
      // Anciennes persistance sans ce champ : reprendre les rendez-vous des mocks
      if (Array.isArray(stored.rendezVous)) return stored
      return { ...stored, rendezVous: fb.rendezVous ?? [] }
    })
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
