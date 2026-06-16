const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const DATETIME_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const MONTH_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'short', day: 'numeric' })

export function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return DATETIME_FMT.format(new Date(iso))
}

export function formatDayMonth(iso: string | Date): string {
  return MONTH_FMT.format(typeof iso === 'string' ? new Date(iso) : iso)
}

/** Percentage as an integer string, e.g. 0.49 -> "49%". */
export function pct(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

/** Compact number formatting (1 234). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

export function relativeFromNow(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diffMs / 86_400_000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} j`
  const months = Math.floor(days / 30)
  if (months < 12) return `il y a ${months} mois`
  return `il y a ${Math.floor(months / 12)} an(s)`
}
