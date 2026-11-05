import { StyleSheet, Text, TextInput, View } from 'react-native'
import { ExamQuestionCard } from '../exams/ExamQuestionCard'
import type { ApprovalSnapshot } from '../../../types/teacher-approvals.types'
import type { ExamQuestion } from '../../../types/teacher-exams.types'

type SnapshotQuestion = ApprovalSnapshot['examQuestions'][number]
interface Props { question: SnapshotQuestion; number: number; note: string; onNoteChange: (value: string) => void }

export function ApprovalQuestionCard({ question, number, note, onNoteChange }: Props) {
  const displayQuestion: ExamQuestion = {
    ...question, points: Number(question.points), testCases: question.programmingTests,
    programmingConfig: question.programmingConfig ? {
      timeLimitMs: question.programmingConfig.timeLimitMs,
      memoryLimitMb: question.programmingConfig.memoryLimitKb / 1024,
      maxCodeSizeKb: question.programmingConfig.maxCodeSizeKb,
    } : null,
  }
  return <ExamQuestionCard question={displayQuestion} number={number} footer={<View style={styles.note}>
    <Text style={styles.label}>Góp ý sửa câu này</Text>
    <TextInput value={note} onChangeText={onNoteChange} multiline maxLength={1000}
      placeholder="Nhập nội dung cần chỉnh sửa..." placeholderTextColor="#94a3b8"
      style={styles.input} textAlignVertical="top" accessibilityLabel={`Góp ý sửa câu ${number}`} />
  </View>} />
}

const styles = StyleSheet.create({
  note: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12 },
  label: { color: '#334155', fontWeight: '700', fontSize: 13, marginBottom: 8 },
  input: { minHeight: 80, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', padding: 10, color: '#0f172a' },
})
