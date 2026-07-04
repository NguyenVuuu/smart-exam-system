import { useAuthStore } from '../../store/authStore'
import {
  NOTIFICATIONS,
  STAT_CARDS,
  UPCOMING_EXAMS,
} from './mock/dashboard.mock'
import DashboardAnalytics from './components/DashboardAnalytics'
import DashboardGreeting from './components/DashboardGreeting'
import DashboardStatCards from './components/DashboardStatCards'
import NotificationList from './components/NotificationList'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import UpcomingExamList from './components/UpcomingExamList'
import { useDashboardAnalytics } from './hooks/useDashboardAnalytics'

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user)
  const analytics = useDashboardAnalytics()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <StudentTopBar />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <DashboardGreeting fullName={user?.fullName ?? 'Sinh viên'} />

          <DashboardStatCards cards={STAT_CARDS} />

          <DashboardAnalytics {...analytics} />

          <div className="flex gap-4">
            <UpcomingExamList exams={UPCOMING_EXAMS} />
            <NotificationList notifications={NOTIFICATIONS} />
          </div>
        </main>
      </div>
    </div>
  )
}
