import { ClipboardList, Filter, ArrowUpDown, Check } from 'lucide-react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { tasks } from '../data/mockData'
import { TaskRow } from './TaskRow'
import type { TaskType, ProjectType } from '../types'

const TASK_TYPES: TaskType[] = ['Rappel explicite', 'Rétention livret', 'Tél récolté']

type TabValue = 'all' | TaskType
type SortOption = 'default' | 'most_late' | 'biggest_amount'

const TAB_ITEMS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'Tout' },
  ...TASK_TYPES.map(t => ({ value: t as TabValue, label: t })),
]

const PRODUCT_LABELS: Record<ProjectType, string> = {
  life_insurance: 'Assurance-vie',
  life_insurance_kid: 'Assurance-vie enfant',
  savings_account: 'Livret Goodvest',
  retirement_plan: 'Plan Épargne Retraite',
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Par défaut' },
  { value: 'most_late', label: 'Plus en retard d\'abord' },
  { value: 'biggest_amount', label: 'Montant le plus élevé' },
]

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

export function TasksTable() {
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<ProjectType>>(new Set())
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useClickOutside(filterRef, () => setFilterOpen(false))
  useClickOutside(sortRef, () => setSortOpen(false))

  const availableProducts = useMemo(() => {
    const types = new Set(tasks.map(t => t.projectType))
    return Array.from(types).sort()
  }, [])

  const toggleProduct = (p: ProjectType) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  const filteredTasks = useMemo(() => {
    let result = activeTab === 'all' ? tasks : tasks.filter(t => t.type === activeTab)
    if (selectedProducts.size > 0) {
      result = result.filter(t => selectedProducts.has(t.projectType))
    }
    if (sortBy === 'most_late') {
      result = [...result].sort((a, b) => a.slaMinutes - b.slaMinutes)
    } else if (sortBy === 'biggest_amount') {
      result = [...result].sort((a, b) => b.projectAmount - a.projectAmount)
    }
    return result
  }, [activeTab, selectedProducts, sortBy])

  const showTypeColumn = activeTab === 'all'

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length }
    for (const t of TASK_TYPES) counts[t] = tasks.filter(task => task.type === t).length
    return counts
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <ClipboardList size={16} className="text-gray-600" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">
          Tâches
        </h2>
      </div>

      <div className="px-6 pb-4 flex items-center justify-between">
        <div className="inline-flex items-center bg-gray-900 rounded-lg p-1 gap-0.5">
          {TAB_ITEMS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[11px] font-semibold ${
                activeTab === tab.value ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {tabCounts[tab.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Product filter */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                selectedProducts.size > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Filter size={13} />
              Produit
              {selectedProducts.size > 0 && (
                <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {selectedProducts.size}
                </span>
              )}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]">
                {availableProducts.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleProduct(p)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      selectedProducts.has(p)
                        ? 'bg-gray-900 border-gray-900'
                        : 'border-gray-300'
                    }`}>
                      {selectedProducts.has(p) && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    {PRODUCT_LABELS[p]}
                  </button>
                ))}
                {selectedProducts.size > 0 && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => setSelectedProducts(new Set())}
                      className="w-full text-left px-3 py-2 text-[12px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sort menu */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                sortBy !== 'default'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <ArrowUpDown size={13} />
              Trier
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[210px]">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12px] transition-colors ${
                      sortBy === opt.value
                        ? 'text-gray-900 font-medium bg-gray-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.value && <Check size={13} className="text-gray-900" strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide">
                Création
              </th>
              {showTypeColumn && (
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide">
                  Type
                </th>
              )}
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide">
                Prospect
              </th>
              <th className="pl-1 pr-1 py-2.5 text-left text-[11px] font-semibold tracking-wide">
                Projet
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide w-[100px]">
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, index) => (
              <TaskRow key={task.id} task={task} isEven={index % 2 === 0} showTypeColumn={showTypeColumn} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
