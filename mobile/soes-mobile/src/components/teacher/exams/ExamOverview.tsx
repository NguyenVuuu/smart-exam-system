import { StyleSheet, Text, View } from 'react-native'
import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import { formatDateTime } from '../../../utils/date'
import type { ExamDetail } from '../../../types/teacher-exams.types'

const types = { QUIZ: 'Quiz', MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ' } as const
const approval = { NOT_REQUIRED: 'Không cần duyệt', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Cần sửa' } as const

export function ExamOverview({ exam }: { exam: ExamDetail }) {
  return <>
    <SectionCard title="Thông tin đề thi">
      <View style={styles.badges}><StatusBadge label={types[exam.type]} /><StatusBadge label={approval[exam.approvalStatus]}
        tone={exam.approvalStatus === 'APPROVED' ? 'success' : exam.approvalStatus === 'REJECTED' ? 'danger' : 'warning'} /></View>
      <Text style={styles.line}>Môn học: {exam.subject.code} · {exam.subject.name}</Text>
      <Text style={styles.line}>Học kỳ: {exam.semester.name}</Text>
      <Text style={styles.line}>Thời lượng: {exam.defaultDurationMinutes} phút</Text>
      <Text style={styles.line}>Số câu: {exam.questionCount} · Tổng điểm: {exam.totalPoints}</Text>
      <Text style={styles.line}>Ca thi: {exam.scheduleCount} · Tạo lúc: {formatDateTime(exam.createdAt)}</Text>
      {exam.description ? <Text style={styles.description}>{exam.description}</Text> : null}
    </SectionCard>
    {exam.revisionFeedback?.length ? <SectionCard title="Góp ý cần sửa">
      {exam.revisionFeedback.map((item) => <View key={`${item.questionId}-${item.order}`} style={styles.feedback}>
        <Text style={styles.feedbackTitle}>Câu {item.order}: {item.title}</Text><Text style={styles.line}>{item.note}</Text>
      </View>)}
    </SectionCard> : null}
  </>
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  line: { color: '#475569', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  description: { color: '#334155', lineHeight: 21, marginTop: 8 },
  feedback: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  feedbackTitle: { fontWeight: '700', color: '#0f172a', marginBottom: 4 },
})
