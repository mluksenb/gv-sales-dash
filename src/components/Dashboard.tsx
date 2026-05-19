import { WeeklyCalendar } from './WeeklyCalendar'
import { TasksTable } from './TasksTable'
import { StickyHeader } from './StickyHeader'
import type { Page } from '../App'

interface DashboardProps {
  setPage: (page: Page) => void
}

export function Dashboard({ setPage }: DashboardProps) {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <StickyHeader page="dashboard" setPage={setPage} />

      <div className="mx-auto w-full max-w-[88rem] p-6 space-y-6">
        <WeeklyCalendar />
        <TasksTable />
      </div>
    </div>
  )
}
