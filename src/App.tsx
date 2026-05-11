import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { ObjectivesPage } from './components/ObjectivesPage'

export type Page = 'dashboard' | 'objectifs'

const PAGE_PATHS: Record<Page, string> = {
  dashboard: '/',
  objectifs: '/objectifs',
}

function resolvePageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return normalizedPath === PAGE_PATHS.objectifs ? 'objectifs' : 'dashboard'
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

  return page === 'objectifs'
    ? <ObjectivesPage setPage={navigateToPage} />
    : <Dashboard page={page} setPage={navigateToPage} />
}

export default App
