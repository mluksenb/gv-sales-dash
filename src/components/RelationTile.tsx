import { Briefcase, Folder } from 'lucide-react'
import type { TaskRelation } from '../types'
import { PROJECT_STATUS_FR } from '../lib/projectLabels'
import { formatTaskCurrency, getDealRelationDetailLine } from '../lib/taskRelation'

const TILE_WIDTH_CLASS = 'w-[280px]'

interface RelationTileProps {
  relation: TaskRelation
  onDealClick?: (dealId: string) => void
}

export function RelationTile({ relation, onDealClick }: RelationTileProps) {
  if (relation.kind === 'deal') {
    const detailLine = getDealRelationDetailLine(relation)

    const tile = (
      <>
        <div className="w-8 h-8 rounded-lg bg-white border border-sky-100 flex items-center justify-center shrink-0">
          <Briefcase size={14} className="text-sky-600" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[12px] text-gray-900 font-medium block truncate">
            Deal #{relation.dealId}
          </span>
          <div className="text-[11px] text-gray-500 truncate">
            {detailLine}
          </div>
        </div>
      </>
    )

    const className = `inline-flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-sky-100 bg-sky-50/80 ${TILE_WIDTH_CLASS} text-left`

    if (onDealClick) {
      return (
        <button
          type="button"
          onClick={() => onDealClick(relation.dealId)}
          className={`${className} cursor-pointer hover:bg-sky-100/80 hover:border-sky-200 transition-colors`}
        >
          {tile}
        </button>
      )
    }

    return <div className={className}>{tile}</div>
  }

  const amountFormatted = formatTaskCurrency(relation.projectAmount)

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-gray-100 bg-gray-50/80 ${TILE_WIDTH_CLASS} cursor-not-allowed`}
    >
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
        <Folder size={14} className="text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[12px] text-gray-900 font-medium block truncate">{relation.projectName}</span>
        <div className="text-[11px] text-gray-500 truncate">
          {amountFormatted} · {PROJECT_STATUS_FR[relation.projectStatus]}
        </div>
      </div>
    </div>
  )
}

