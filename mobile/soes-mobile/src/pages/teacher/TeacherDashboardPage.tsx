import { Bell, BookOpen, ClipboardCheck, CalendarDays } from 'lucide-react-native'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { useAuthStore } from '../../store/authStore'
import { formatDateTime } from '../../utils/date'
import { DashboardSection } from '../../components/teacher/dashboard/DashboardSection'
import { DashboardStat } from '../../components/teacher/dashboard/DashboardStat'
import { useTeacherDashboard } from '../../hooks/useTeacherDashboard'

export function TeacherDashboardScreen() {
  const name = useAuthStore((state) => state.user?.fullName)
  const { data, loading, refreshing, refresh } = useTeacherDashboard()
  if (loading && !data) return <ScreenState kind="loading" />
  if (!data) return <ScreenState kind="error" onRetry={() => void refresh()} />
  const { courses, assignments, approvals, unread } = data
  const allFailed = [courses, assignments, approvals, unread].every((item) => item.failed)
  if (allFailed) return <ScreenState kind="error" message="Không thể tải tổng quan. Kiểm tra kết nối và thử lại." onRetry={() => void refresh()} />

  return <ScrollView style={styles.root} contentContainerStyle={styles.content}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}>
    <ScreenHeader showBack={false} title={`Xin chào, ${name ?? 'Giảng viên'}`} description="Công việc giảng dạy và khảo thí của bạn" />
    <View style={styles.stats}>
      <DashboardStat label="Lớp học phần" value={courses.failed ? null : courses.data.pagination.totalItems} icon={BookOpen} />
      <DashboardStat label="Ca coi thi" value={assignments.failed ? null : assignments.data.pagination.totalItems} icon={CalendarDays} />
      {!approvals.failed && <DashboardStat label="Đề chờ duyệt" value={approvals.data.pagination.totalItems} icon={ClipboardCheck} />}
      <DashboardStat label="Thông báo chưa đọc" value={unread.failed ? null : unread.data} icon={Bell} />
    </View>
    <DashboardSection title="Lớp học phần" href="/(app)/(teacher)/courses" failed={courses.failed} emptyText="Bạn chưa phụ trách lớp nào."
      rows={courses.data.items.map((course) => ({ id: course.id, title: `${course.subject.code} · ${course.subject.name}`, subtitle: `${course.code} · ${course.enrollmentCount} sinh viên`, href: { pathname: '/(app)/(teacher)/courses/[courseOfferingId]', params: { courseOfferingId: course.id } } }))} />
    {!approvals.failed && <DashboardSection title="Đề chờ duyệt" href="/(app)/(teacher)/approvals" failed={false} emptyText="Không có đề chờ duyệt."
      rows={approvals.data.items.map((exam) => ({ id: exam.id, title: exam.title, subtitle: `Gửi lúc ${formatDateTime(exam.reviewRound.submittedAt)}`, href: { pathname: '/(app)/(teacher)/approvals/[approvalId]', params: { approvalId: exam.id } } }))} />}
    <DashboardSection title="Lịch coi thi" href="/(app)/(teacher)/invigilation" failed={assignments.failed} emptyText="Chưa có ca coi thi."
      rows={assignments.data.items.map((assignment) => ({ id: assignment.id, title: assignment.title, subtitle: formatDateTime(assignment.startTime) }))} />
    {courses.failed || assignments.failed || unread.failed ? <Text style={styles.hint}>Kéo xuống để thử tải lại các mục chưa hiển thị.</Text> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 16, paddingBottom: 32 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  hint: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 8 },
})
