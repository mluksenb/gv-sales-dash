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

export function SLAIndicator({ minutes, size = 'md' }: SLAIndicatorProps & { size?: 'sm' | 'md' }) {
  const isOverdue = minutes < 0
  const formatted = formatSLA(minutes)
  const isSm = size === 'sm'

  return (
    <div
      className={`inline-flex items-center font-medium ${
        isOverdue ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
      } ${isSm ? 'gap-1 px-1.5 py-0.5 rounded text-[11px]' : 'gap-1.5 px-2 py-1 rounded-md text-xs'}`}
    >
      <Clock size={isSm ? 10 : 12} />
      <span>{formatted}</span>
    </div>
  )
}
