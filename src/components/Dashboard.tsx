import { WeeklyCalendar } from './WeeklyCalendar'
import { TasksTable } from './TasksTable'
import { StickyHeader } from './StickyHeader'

export function Dashboard() {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <StickyHeader />

      <div className="mx-auto w-full max-w-[88rem] p-6 space-y-6">
        <WeeklyCalendar />
        <TasksTable />
      </div>
    </div>
  )
}
