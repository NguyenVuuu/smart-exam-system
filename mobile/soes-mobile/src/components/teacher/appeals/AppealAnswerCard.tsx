import { StyleSheet, Text, View } from 'react-native'
import { SectionCard } from '../../ui/SectionCard'
import type { ExamQuestion } from '../../../types/teacher-exams.types'
import type { TeacherSubmission } from '../../../types/teacher-appeals.types'

export function AppealAnswerCard({ question, number, submission }: {
  question: ExamQuestion; number: number; submission: TeacherSubmission
}) {
  const answer = submission.answers?.find((item) => item.questionId === question.id)
  const selectedIds = answer?.selectedOptionIds ?? []
  return <SectionCard title={`Câu ${number} · ${question.points} điểm`}>
    <Text style={styles.question}>{question.content || question.title}</Text>
    {question.options.map((option) => {
      const selected = selectedIds.includes(option.id)
      return <View key={option.id} style={[styles.option, option.isCorrect && styles.correct, selected && !option.isCorrect && styles.incorrect]}>
        <Text style={styles.optionText}>{selected ? '✓  ' : ''}{option.content}{option.isCorrect ? '  · Đáp án' : ''}</Text>
      </View>
    })}
    {question.type === 'PROGRAMMING' && <View style={styles.code}>
      <Text style={styles.codeText}>{answer?.sourceCode || 'Sinh viên không nộp mã nguồn.'}</Text>
    </View>}
    <Text style={styles.score}>Điểm câu: {answer?.score ?? 'Chưa chấm'}</Text>
  </SectionCard>
}

const styles = StyleSheet.create({
  question: { color: '#0f172a', fontSize: 14, fontWeight: '600', lineHeight: 22, marginBottom: 12 },
  option: { borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', padding: 10, marginBottom: 6 },
  correct: { borderColor: '#86efac', backgroundColor: '#ecfdf5' },
  incorrect: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  optionText: { color: '#334155', fontSize: 13, lineHeight: 19 },
  code: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginTop: 8 },
  codeText: { color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 },
  score: { color: '#475569', fontSize: 12, fontWeight: '700', marginTop: 8 },
})
