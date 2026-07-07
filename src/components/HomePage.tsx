import { LayoutDashboard, Target, Briefcase, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Page, SetPageFn } from '../App'
import type { ProfileTab } from '../lib/profileTabs'

interface HomePageProps {
  setPage: SetPageFn
}

const NAV_ITEMS: {
  page: Exclude<Page, 'home'>
  label: string
  icon: LucideIcon
  profileTab?: ProfileTab
}[] = [
  {
    page: 'dashboard',
    label: 'Dashboard Conseiller',
    icon: LayoutDashboard,
  },
  {
    page: 'objectifs',
    label: 'Vue Équipe / Objectifs',
    icon: Target,
  },
  {
    page: 'profile',
    label: 'Opportunités (Fiche Client)',
    icon: Briefcase,
    profileTab: 'opportunites',
  },
]

export function HomePage({ setPage }: HomePageProps) {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        {NAV_ITEMS.map(({ page, label, icon: Icon, profileTab }) => (
          <button
            key={page}
            type="button"
            onClick={() => setPage(page, profileTab ? { profileTab } : undefined)}
            className="group w-full text-left rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-5 transition-all hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a3a]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f5]"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-[#faf8f5] border border-gray-100 flex items-center justify-center transition-colors group-hover:bg-[#1a3a3a]/5">
                <Icon size={22} className="text-[#1a3a3a]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 text-base font-semibold text-gray-900">{label}</div>
            </div>
          </button>
        ))}
        <a
          href="/docs-ai.html"
          className="group w-full text-left rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-5 transition-all hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a3a]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f5]"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#faf8f5] border border-gray-100 flex items-center justify-center transition-colors group-hover:bg-[#1a3a3a]/5">
              <ShieldCheck size={22} className="text-[#1a3a3a]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 text-base font-semibold text-gray-900">Pré-contrôle IA des documents (KYC)</div>
          </div>
        </a>
      </div>
    </div>
  )
}
