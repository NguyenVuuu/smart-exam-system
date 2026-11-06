import { router } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { SectionCard } from '../../ui/SectionCard'
import type { AppealStatus, TeacherAppeal } from '../../../types/teacher-appeals.types'
import { formatDateTime } from '../../../utils/date'

export const appealStatusLabels: Record<AppealStatus, string> = {
  PENDING: 'Chờ xử lý', IN_REVIEW: 'Đang xem xét', RESOLVED: 'Đã xử lý', REJECTED: 'Đã từ chối',
}

export function AppealCard({ appeal }: { appeal: TeacherAppeal }) {
  return <Pressable accessibilityRole="button" onPress={() => router.push(`/(app)/(teacher)/appeals/${appeal.id}` as never)}>
    <SectionCard title={`${appeal.student.fullName} · ${appeal.student.studentCode}`}>
      <Text style={styles.exam}>{appeal.exam.title} · {appeal.exam.scheduleTitle}</Text>
      <Text style={styles.status}>{appealStatusLabels[appeal.status]} · {formatDateTime(appeal.createdAt)}</Text>
      <Text style={styles.reason} numberOfLines={3}>{appeal.reason}</Text>
      <Text style={styles.link}>Xem bài và xử lý →</Text>
    </SectionCard>
  </Pressable>
}

const styles = StyleSheet.create({
  exam: { color: '#475569', fontSize: 13 }, status: { color: '#2563eb', fontSize: 12, fontWeight: '700', marginTop: 6 },
  reason: { color: '#334155', fontSize: 13, lineHeight: 20, marginTop: 10 },
  link: { color: '#2563eb', fontWeight: '700', fontSize: 13, marginTop: 12 },
})
