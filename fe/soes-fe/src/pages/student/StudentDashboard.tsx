import DashboardAnalytics from './components/DashboardAnalytics'
import DashboardGreeting from './components/DashboardGreeting'
import DashboardStatCards from './components/DashboardStatCards'
import NotificationList from './components/NotificationList'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import UpcomingExamList from './components/UpcomingExamList'
import { useDashboardAnalytics } from './hooks/useDashboardAnalytics'
import { useStudentDashboard } from './hooks/useStudentDashboard'

export default function StudentDashboard() {
  const { isLoading, error, fullName, statCards, analyticsItems, upcomingExams, notifications } =
    useStudentDashboard()

  const analyticsProps = useDashboardAnalytics(analyticsItems)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <StudentTopBar />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <DashboardSkeleton />
          ) : error ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : (
            <>
              <DashboardGreeting fullName={fullName} />
              <DashboardStatCards cards={statCards} />
              <DashboardAnalytics {...analyticsProps} />
              <div className="flex gap-4">
                <UpcomingExamList exams={upcomingExams} />
                <NotificationList notifications={notifications} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-10 w-64 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
      <div className="flex gap-4">
        <div className="h-40 flex-1 bg-gray-200 rounded-xl" />
        <div className="h-40 flex-1 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
