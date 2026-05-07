import { Clock } from 'lucide-react'

interface SLAIndicatorProps {
  minutes: number
}

function formatSLA(minutes: number): string {
  if (minutes >= 0) {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
  }

  const abs = Math.abs(minutes)
  if (abs < 60) return `+${abs}m`
  if (abs < 1440) {
    const h = Math.floor(abs / 60)
    const m = abs % 60
    return m > 0 ? `+${h}h${m.toString().padStart(2, '0')}` : `+${h}h`
  }
  const days = Math.floor(abs / 1440)
  const h = Math.floor((abs % 1440) / 60)
  return h > 0 ? `+${days}j${h}h` : `+${days}j`
}

export function SLAIndicator({ minutes }: SLAIndicatorProps) {
  const isOverdue = minutes < 0
  const formatted = formatSLA(minutes)

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
        isOverdue ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
      }`}
    >
      <Clock size={12} />
      <span>{formatted}</span>
    </div>
  )
}
