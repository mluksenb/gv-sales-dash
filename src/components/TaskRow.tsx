import { CheckCircle2, Eye, X } from 'lucide-react'
import type { Task } from '../types'
import { TaskTypeBadge, ProspectBadge, TierBadge } from './Badge'
import { SLAIndicator } from './SLAIndicator'
import { PROJECT_STATUS_FR } from '../lib/projectLabels'

interface TaskRowProps {
  task: Task
  isEven: boolean
  showTypeColumn: boolean
}

export function TaskRow({ task, isEven, showTypeColumn }: TaskRowProps) {
  const amountFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(task.projectAmount)

  return (
    <tr className={`group hover:bg-amber-100/60 transition-colors border-b border-gray-100 last:border-0 ${isEven ? 'bg-white' : 'bg-[#fdfcfa]'}`}>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-900 font-medium">{task.createdAt}</span>
          <SLAIndicator minutes={task.slaMinutes} />
        </div>
      </td>
      {showTypeColumn && (
        <td className="px-3 py-2.5">
          <TaskTypeBadge type={task.type} />
        </td>
      )}
      <td className="px-3 py-2.5">
        <div>
          <span className="text-[12px] text-gray-900 font-medium">{task.prospectName}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <ProspectBadge type={task.prospectType} />
            <TierBadge tier={task.tier} />
          </div>
        </div>
      </td>
      <td className="pl-1 pr-1 py-2.5">
        <div>
          <span className="text-[12px] text-gray-900">{task.projectName}</span>
          <div className="text-[11px] text-gray-500">
            {amountFormatted} · {PROJECT_STATUS_FR[task.projectStatus]}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <button
            title="Marquer traité"
            className="p-2 rounded-md hover:bg-green-100 text-green-500 hover:text-green-600 transition-colors"
          >
            <CheckCircle2 size={18} strokeWidth={2.2} />
          </button>
          <button
            title="Voir détails"
            className="p-2 rounded-md hover:bg-white text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Eye size={18} strokeWidth={2} />
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
