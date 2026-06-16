import { Search, X } from 'lucide-react'
import type { ChannelFilter, DatePreset, Filters } from '../lib/metrics'

interface Props {
  filters: Filters
  onChange: (next: Filters) => void
}

const CHANNELS: { value: ChannelFilter; label: string }[] = [
  { value: 'all', label: 'Tous les canaux' },
  { value: 'chat', label: 'Chat' },
  { value: 'email', label: 'Email' },
]

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: '90d', label: '90 j' },
  { value: '30d', label: '30 j' },
  { value: '14d', label: '14 j' },
  { value: '7d', label: '7 j' },
]

function SegGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            value === opt.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function FilterBar({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SegGroup
        options={CHANNELS}
        value={filters.channel}
        onChange={(channel) => onChange({ ...filters, channel })}
      />
      <SegGroup
        options={PRESETS}
        value={filters.datePreset}
        onChange={(datePreset) => onChange({ ...filters, datePreset })}
      />

      <div className="relative ml-auto">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Rechercher un sujet, résumé…"
          className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-700 placeholder:text-slate-400 focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/10"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
