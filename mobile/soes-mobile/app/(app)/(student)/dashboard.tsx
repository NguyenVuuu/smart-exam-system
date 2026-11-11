import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { Hand } from 'lucide-react-native'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { useStudentDashboard } from '../../../src/hooks/useStudentDashboard'
import StudentLayout from '../../../src/components/student/StudentLayout'
import DashboardStatCards from '../../../src/components/student/DashboardStatCards'
import DashboardAnalytics from '../../../src/components/student/DashboardAnalytics'
import UpcomingExamList from '../../../src/components/student/UpcomingExamList'
import NotificationList from '../../../src/components/student/NotificationList'
import DashboardSkeleton from '../../../src/components/student/DashboardSkeleton'

export default function StudentDashboard() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const { isLoading, error, fullName, statCards, analyticsItems, upcomingExams, notifications } =
    useStudentDashboard()

  if (!isInitialized || !isAuthenticated) return null

  return (
    <StudentLayout activeRoute="dashboard">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 14, color: '#ef4444', marginBottom: 12 }}>{error}</Text>
            <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2563eb', borderRadius: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Xin chào, {fullName}</Text>
                <Hand size={19} color="#f59e0b" />
              </View>
              <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>
                Chúc bạn có một ngày học tập hiệu quả!
              </Text>
            </View>
            <DashboardStatCards cards={statCards} />
            <DashboardAnalytics items={analyticsItems} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <UpcomingExamList exams={upcomingExams} />
              <NotificationList notifications={notifications} />
            </View>
          </>
        )}
      </ScrollView>
    </StudentLayout>
  )
}
