import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import type { ExamSummary } from '../../../types/teacher-exams.types'

const typeLabels = { QUIZ: 'Quiz', MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ' } as const
const approvalLabels = { NOT_REQUIRED: '', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Cần sửa' } as const

export function ExamListCard({ exam }: { exam: ExamSummary }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Xem đề ${exam.title}`}
    onPress={() => router.push(`/(app)/(teacher)/exams/${exam.id}` as never)}>
    <SectionCard>
      <View style={styles.top}><StatusBadge label={typeLabels[exam.type]} tone="neutral" />
        {exam.approvalStatus !== 'NOT_REQUIRED' && <StatusBadge label={approvalLabels[exam.approvalStatus]} tone={exam.approvalStatus === 'APPROVED' ? 'success' : exam.approvalStatus === 'REJECTED' ? 'danger' : 'warning'} />}</View>
      <View style={styles.row}><View style={styles.info}><Text style={styles.title}>{exam.title}</Text>
        <Text style={styles.meta}>{exam.subject.code} · {exam.subject.name}</Text>
        <Text style={styles.meta}>{exam.questionCount} câu · {exam.defaultDurationMinutes} phút · {exam.totalPoints} điểm</Text></View>
        <ChevronRight size={18} color="#64748b" /></View>
    </SectionCard>
  </Pressable>
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, info: { flex: 1, minWidth: 0 },
  title: { color: '#0f172a', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 12, lineHeight: 18 },
})
