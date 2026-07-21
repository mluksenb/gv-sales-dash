import { useEffect, useState } from 'react'
import { ClientContactPage } from './components/ClientContactPage'
import { Dashboard } from './components/Dashboard'
import { HomePage } from './components/HomePage'
import { ObjectivesPage } from './components/ObjectivesPage'
import { ProfilePage } from './components/ProfilePage'
import { TicketsPage } from './components/TicketsPage'
import { profileUrl, type ProfileTab } from './lib/profileTabs'

export type Page = 'home' | 'dashboard' | 'objectifs' | 'profile' | 'tickets' | 'client-contact'

export type NavigateOptions = { profileTab?: ProfileTab }

export type SetPageFn = (page: Page, options?: NavigateOptions) => void

const PAGE_PATHS: Record<Page, string> = {
  home: '/',
  dashboard: '/dashboard',
  objectifs: '/objectifs',
  profile: '/profile',
  tickets: '/tickets',
  'client-contact': '/espace-client-contact',
}

function pageUrl(page: Page, options?: NavigateOptions): string {
  if (page === 'profile' && options?.profileTab) {
    return profileUrl(options.profileTab)
  }
  return PAGE_PATHS[page]
}

function resolvePageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === PAGE_PATHS.dashboard) return 'dashboard'
  if (normalizedPath === PAGE_PATHS.objectifs) return 'objectifs'
  if (normalizedPath === PAGE_PATHS.profile) return 'profile'
  if (normalizedPath === PAGE_PATHS.tickets) return 'tickets'
  if (normalizedPath === PAGE_PATHS['client-contact']) return 'client-contact'
  return 'home'
}

function App() {
  const [page, setPage] = useState<Page>(() => resolvePageFromPath(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => {
      setPage(resolvePageFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToPage: SetPageFn = (nextPage, options) => {
    setPage(nextPage)
    const nextUrl = pageUrl(nextPage, options)
    const currentUrl = `${window.location.pathname}${window.location.search}`

    if (currentUrl !== nextUrl) {
      window.history.pushState({}, '', nextUrl)
    }
  }

  if (page === 'home') return <HomePage setPage={navigateToPage} />
  if (page === 'objectifs') return <ObjectivesPage setPage={navigateToPage} />
  if (page === 'profile') return <ProfilePage setPage={navigateToPage} />
  if (page === 'tickets') return <TicketsPage setPage={navigateToPage} />
  if (page === 'client-contact') return <ClientContactPage setPage={navigateToPage} />
  return <Dashboard setPage={navigateToPage} />
}

export default App
