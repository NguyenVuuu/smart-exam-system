import type { ReactNode } from 'react'
import { Check } from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import { RichContent } from '../../ui/RichContent'
import type { ExamQuestion } from '../../../types/teacher-exams.types'

interface Props { question: ExamQuestion; number: number; footer?: ReactNode }

export function ExamQuestionCard({ question, number, footer }: Props) {
  return <SectionCard>
    <View style={styles.heading}><StatusBadge label={`Câu ${number}`} tone="neutral" /><StatusBadge label={`${question.points} điểm`} tone="warning" /></View>
    <Text style={styles.title}>{question.title}</Text>
    <RichContent content={question.content} />
    {question.type === 'PROGRAMMING' ? <ProgrammingQuestionViewer question={question} /> : question.options.map((option) => <View key={option.id} style={[styles.option, option.isCorrect && styles.correct]}>
      {option.isCorrect && <Check size={16} color="#047857" />}
      <View style={styles.optionContent}><RichContent content={option.content} /></View>
    </View>)}
    {question.explanation && <View style={styles.explanation}><Text style={styles.explanationLabel}>Giải thích:</Text><RichContent content={question.explanation} /></View>}
    {footer}
  </SectionCard>
}

function ProgrammingQuestionViewer({ question }: { question: ExamQuestion }) {
  return <View>
    <Text style={styles.meta}>Ngôn ngữ: {question.language ?? '—'} · {question.programmingConfig?.timeLimitMs ?? '—'} ms · {question.programmingConfig?.memoryLimitMb ?? '—'} MB</Text>
    {question.testCases.map((test, index) => <View key={test.id} style={styles.test}>
      <Text style={styles.testTitle}>Test case {index + 1}{test.isHidden ? ' · Ẩn với sinh viên' : ''}</Text>
      <ScrollView horizontal nestedScrollEnabled><View><Text style={styles.code}>Input: {test.input}</Text><Text style={styles.code}>Output: {test.expectedOutput}</Text></View></ScrollView>
    </View>)}
  </View>
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', gap: 8, marginBottom: 10 }, title: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 9, padding: 10, marginTop: 6 },
  correct: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }, optionContent: { flex: 1, minWidth: 0 },
  explanation: { marginTop: 12 }, explanationLabel: { color: '#475569', fontSize: 12, fontWeight: '700' }, meta: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  test: { padding: 10, borderRadius: 9, backgroundColor: '#f8fafc', marginTop: 8 }, testTitle: { color: '#0f172a', fontWeight: '700', fontSize: 12 },
  code: { color: '#334155', fontFamily: 'monospace', fontSize: 12, marginTop: 5 },
})
