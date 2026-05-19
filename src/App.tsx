import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { ObjectivesPage } from './components/ObjectivesPage'
import { ProfilePage } from './components/ProfilePage'

export type Page = 'dashboard' | 'objectifs' | 'profile'

const PAGE_PATHS: Record<Page, string> = {
  dashboard: '/',
  objectifs: '/objectifs',
  profile: '/profile',
}

function resolvePageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === PAGE_PATHS.objectifs) return 'objectifs'
  if (normalizedPath === PAGE_PATHS.profile) return 'profile'
  return 'dashboard'
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

  if (page === 'objectifs') return <ObjectivesPage setPage={navigateToPage} />
  if (page === 'profile') return <ProfilePage setPage={navigateToPage} />
  return <Dashboard page={page} setPage={navigateToPage} />
}

export default App
