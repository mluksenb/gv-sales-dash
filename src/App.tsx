import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { HomePage } from './components/HomePage'
import { ObjectivesPage } from './components/ObjectivesPage'
import { ProfilePage } from './components/ProfilePage'

export type Page = 'home' | 'dashboard' | 'objectifs' | 'profile'

const PAGE_PATHS: Record<Page, string> = {
  home: '/',
  dashboard: '/dashboard',
  objectifs: '/objectifs',
  profile: '/profile',
}

function resolvePageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === PAGE_PATHS.dashboard) return 'dashboard'
  if (normalizedPath === PAGE_PATHS.objectifs) return 'objectifs'
  if (normalizedPath === PAGE_PATHS.profile) return 'profile'
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

  const navigateToPage = (nextPage: Page) => {
    setPage(nextPage)
    const nextPath = PAGE_PATHS[nextPage]

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }

  if (page === 'home') return <HomePage setPage={navigateToPage} />
  if (page === 'objectifs') return <ObjectivesPage setPage={navigateToPage} />
  if (page === 'profile') return <ProfilePage setPage={navigateToPage} />
  return <Dashboard setPage={navigateToPage} />
}

export default App
