import { Check, PenLine, X } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '../types'
import { TaskTypeBadge, ProspectBadge, TierBadge } from './Badge'
import { SLAIndicator } from './SLAIndicator'
import { RelationTile } from './RelationTile'
import { getParisToday } from '../utils/calendarMetrics'

interface TaskRowProps {
  task: Task
  isEven: boolean
  showTypeColumn: boolean
  onDealClick?: (dealId: string) => void
}

function formatProspectPhone(phone: string): string {
  const normalized = phone.replace(/\s+/g, '')
  const match = normalized.match(/^\+33([67])(\d{2})(\d{2})(\d{2})(\d{2})$/)

  if (!match) {
    return phone
  }

  const [, firstDigit, part1, part2, part3, part4] = match
  return `+33 ${firstDigit} ${part1} ${part2} ${part3} ${part4}`
}

export function TaskRow({ task, isEven, showTypeColumn, onDealClick }: TaskRowProps) {
  const parsedDueDate = parse(task.createdAt, 'dd/MM HH:mm', getParisToday())
  const dueDateLabel = isValid(parsedDueDate)
    ? format(parsedDueDate, 'eee d MMM HH:mm', { locale: fr })
    : task.createdAt
  const telHref = `tel:${task.prospectPhone.replace(/\s+/g, '')}`
  const formattedPhone = formatProspectPhone(task.prospectPhone)

  return (
    <tr className={`group hover:bg-amber-100/60 transition-colors border-b border-gray-100 last:border-0 ${isEven ? 'bg-white' : 'bg-[#fdfcfa]'}`}>
      <td className="px-2 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-900 font-medium">{dueDateLabel}</span>
          <SLAIndicator minutes={task.slaMinutes} />
        </div>
      </td>
      <td className="px-2 py-2">
        <div>
          <span className="text-[12px] text-gray-900 font-medium">{task.prospectName}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <ProspectBadge type={task.prospectType} />
            <TierBadge tier={task.tier} />
          </div>
        </div>
      </td>
      {showTypeColumn && (
        <td className="px-2 py-2">
          <TaskTypeBadge type={task.type} />
        </td>
      )}
      <td className="px-1.5 py-2">
        <RelationTile
          relation={task.relation}
          onDealClick={task.type === 'Rétention livret' ? undefined : onDealClick}
        />
      </td>
      <td className="px-2 py-2 whitespace-nowrap">
        <a
          href={telHref}
          className="text-[12px] font-medium text-[#1a3a3a] hover:underline"
        >
          {formattedPhone}
        </a>
      </td>
      <td className="px-2 py-2">
        <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <button
            title="Marquer traité"
            className="p-2 rounded-md hover:bg-green-100 text-green-500 hover:text-green-600 transition-colors"
          >
            <Check size={18} strokeWidth={2.5} />
          </button>
          <button
            title="Notes"
            className="p-2 rounded-md hover:bg-white text-gray-500 hover:text-gray-700 transition-colors"
          >
            <PenLine size={18} strokeWidth={2} />
          </button>
          <button
            title="Supprimer"
            className="p-2 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
      </td>
    </tr>
  )
}
