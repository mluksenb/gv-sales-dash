import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  ALL_INTERCOM_TOPICS,
  INTERCOM_TOPIC_CATEGORIES,
  INTERCOM_TOPICS_BY_CATEGORY,
  allIntercomTopicsSelected,
} from '../lib/intercomTaxonomy'
import { categoryColor } from '../support/lib/categories'

interface Props {
  selectedTopics: Set<string>
  onChange: (topics: Set<string>) => void
}

function CategoryCheckbox({
  category,
  topics,
  selectedTopics,
  onToggleCategory,
  onToggleTopic,
}: {
  category: string
  topics: string[]
  selectedTopics: Set<string>
  onToggleCategory: (category: string, checked: boolean) => void
  onToggleTopic: (topic: string, checked: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedCount = topics.filter((topic) => selectedTopics.has(topic)).length
  const allSelected = selectedCount === topics.length
  const someSelected = selectedCount > 0 && !allSelected
  const color = categoryColor(category)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = someSelected
  }, [someSelected])

  return (
    <div className="py-1">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
        <input
          ref={inputRef}
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onToggleCategory(category, e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
        />
        <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-[12px] font-semibold text-gray-800">{category}</span>
      </label>
      <div className="ml-5 space-y-0.5 border-l border-gray-100 pl-2">
        {topics.map((topic) => (
          <label
            key={topic}
            className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selectedTopics.has(topic)}
              onChange={(e) => onToggleTopic(topic, e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
            />
            <span className="text-[11px] leading-snug text-gray-600">{topic}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function IntercomConversationFilter({ selectedTopics, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const allSelected = allIntercomTopicsSelected(selectedTopics)
  const selectedCount = ALL_INTERCOM_TOPICS.filter((topic) => selectedTopics.has(topic)).length

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const toggleCategory = (category: string, checked: boolean) => {
    const next = new Set(selectedTopics)
    for (const topic of INTERCOM_TOPICS_BY_CATEGORY[category as keyof typeof INTERCOM_TOPICS_BY_CATEGORY]) {
      if (checked) next.add(topic)
      else next.delete(topic)
    }
    onChange(next)
  }

  const toggleTopic = (topic: string, checked: boolean) => {
    const next = new Set(selectedTopics)
    if (checked) next.add(topic)
    else next.delete(topic)
    onChange(next)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
          open || !allSelected
            ? 'border-gray-900 bg-white text-gray-900'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        Conversations Intercom
        {!allSelected && (
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
            {selectedCount}/{ALL_INTERCOM_TOPICS.length}
          </span>
        )}
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-[22rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2.5">
            <div className="text-[12px] font-semibold text-gray-900">Filtrer par motif Intercom</div>
            <div className="text-[11px] text-gray-400">Catégorie et sous-catégorie</div>
          </div>
          <div className="max-h-80 overflow-y-auto px-1 py-2">
            {INTERCOM_TOPIC_CATEGORIES.map((category) => (
              <CategoryCheckbox
                key={category}
                category={category}
                topics={INTERCOM_TOPICS_BY_CATEGORY[category]}
                selectedTopics={selectedTopics}
                onToggleCategory={toggleCategory}
                onToggleTopic={toggleTopic}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
