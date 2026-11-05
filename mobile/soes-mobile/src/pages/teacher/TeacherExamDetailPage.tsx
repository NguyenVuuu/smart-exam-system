import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { getExam, getExamSchedules, getReviewHistory } from '../../api/teacher-exams.api'
import { ExamOverview } from '../../components/teacher/exams/ExamOverview'
import { ExamQuestionCard } from '../../components/teacher/exams/ExamQuestionCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SectionCard } from '../../components/ui/SectionCard'
import type { ExamDetail, ExamSchedule, ReviewHistory } from '../../types/teacher-exams.types'
import { formatDateTime } from '../../utils/date'

type Tab = 'overview' | 'questions' | 'schedules' | 'history'
const tabs: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Tổng quan' }, { key: 'questions', label: 'Câu hỏi' },
  { key: 'schedules', label: 'Ca thi' }, { key: 'history', label: 'Lịch sử duyệt' },
]

export function TeacherExamDetailPage({ id }: { id: string }) {
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [schedules, setSchedules] = useState<ExamSchedule[] | null>(null)
  const [history, setHistory] = useState<ReviewHistory[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tabError, setTabError] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try { setExam(await getExam(id)); setError(false) }
    catch { setError(true) }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => {
    let active = true
    getExam(id).then((result) => { if (active) { setExam(result); setError(false) } })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])
  useEffect(() => {
    if (tab === 'overview' || tab === 'questions' || (tab === 'schedules' && schedules) || (tab === 'history' && history)) return
    let active = true
    const load = tab === 'schedules' ? getExamSchedules(id) : getReviewHistory(id)
    load.then((items) => { if (!active) {
      return
    } if (tab === 'schedules') setSchedules(items as ExamSchedule[])
    else setHistory(items as ReviewHistory[]) }).catch(() => { if (active) setTabError(true) })
    return () => { active = false }
  }, [tab, id, schedules, history])

  if (loading && !exam) return <ScreenState kind="loading" />
  if (error && !exam) return <ScreenState kind="error" onRetry={() => void reload()} />
  if (!exam) return <ScreenState kind="empty" />
  const sortedQuestions = [...exam.questions].sort((a, b) => a.orderIndex - b.orderIndex)
  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader title={exam.title} description={`${exam.subject.code} · ${exam.semester.name}`} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabScroll}>
      {tabs.map((entry) => <Pressable key={entry.key} accessibilityRole="button" onPress={() => { setTabError(false); setTab(entry.key) }}
        style={[styles.tab, tab === entry.key && styles.active]}><Text style={[styles.tabText, tab === entry.key && styles.activeText]}>{entry.label}</Text></Pressable>)}
    </ScrollView>
    <ScrollView contentContainerStyle={styles.content}>
      {tab === 'overview' && <ExamOverview exam={exam} />}
      {tab === 'questions' && (sortedQuestions.length ? sortedQuestions.map((question, index) =>
        <ExamQuestionCard key={question.id} question={question} number={index + 1} />) : <ScreenState kind="empty" message="Đề chưa có câu hỏi." />)}
      {tab === 'schedules' && (schedules ? schedules.length ? schedules.map((schedule) => <SectionCard key={schedule.id} title={schedule.title}>
        <Text style={styles.line}>Bắt đầu: {formatDateTime(schedule.startTime)}</Text><Text style={styles.line}>Kết thúc: {formatDateTime(schedule.endTime)}</Text>
      </SectionCard>) : <ScreenState kind="empty" message="Chưa có ca thi." /> : <ScreenState kind={tabError ? 'error' : 'loading'} onRetry={() => { setTabError(false); void getExamSchedules(id).then(setSchedules).catch(() => setTabError(true)) }} />)}
      {tab === 'history' && (history ? history.length ? history.map((round) => <SectionCard key={round.id} title={`Lần duyệt ${round.version}`}>
        <Text style={styles.line}>Trạng thái: {round.status}</Text><Text style={styles.line}>Gửi lúc: {formatDateTime(round.submittedAt)}</Text>
        {round.decision?.reason ? <Text style={styles.line}>Lý do: {round.decision.reason}</Text> : null}
      </SectionCard>) : <ScreenState kind="empty" message="Chưa có lịch sử duyệt." /> : <ScreenState kind={tabError ? 'error' : 'loading'} onRetry={() => { setTabError(false); void getReviewHistory(id).then(setHistory).catch(() => setTabError(true)) }} />)}
    </ScrollView>
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 0 }, tabScroll: { flexGrow: 0 },
  tabs: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 }, tab: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  active: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, tabText: { color: '#475569', fontWeight: '600' }, activeText: { color: '#fff' },
  content: { padding: 16, paddingBottom: 32, flexGrow: 1 }, line: { color: '#475569', lineHeight: 20, fontSize: 13, marginBottom: 3 },
})
