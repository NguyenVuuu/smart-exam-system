import { useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native'
import { router } from 'expo-router'
import { ScreenState } from '../../ui/ScreenState'
import { PaginationControls } from '../../ui/PaginationControls'
import { formatDateTime } from '../../../utils/date'
import { listExams, listStudents } from '../../../api/teacher-courses.api'
import type { CourseExam, CourseStudent } from '../../../types/teacher-courses.types'

interface Props { courseId: string; kind: 'students' | 'exams' }
type Row = CourseStudent | CourseExam

export function CoursePagedTab({ courseId, kind }: Props) {
  const [items, setItems] = useState<Row[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load(nextPage: number) {
    try {
      const data = kind === 'students' ? await listStudents(courseId, nextPage) : await listExams(courseId, nextPage)
      setItems(data.items)
      setPage(nextPage)
      setTotalPages(data.pagination.totalPages)
      setError(false)
    } catch { setError(true) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let active = true
    const request = kind === 'students' ? listStudents(courseId, 1) : listExams(courseId, 1)
    request.then((data) => { if (active) { setItems(data.items); setTotalPages(data.pagination.totalPages); setError(false) } })
      .catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId, kind])

  if (loading && items.length === 0) return <ScreenState kind="loading" />
  if (error && items.length === 0) return <ScreenState kind="error" onRetry={() => void load(1)} />
  return <FlatList data={items} keyExtractor={(item) => 'scheduleId' in item ? item.scheduleId : item.id}
    contentContainerStyle={styles.list} ListEmptyComponent={<ScreenState kind="empty" message={kind === 'students' ? 'Chưa có sinh viên.' : 'Chưa có ca thi.'} />}
    renderItem={({ item }) => kind === 'students' ? <StudentRow item={item as CourseStudent} /> : <ExamRow item={item as CourseExam} />}
    ListFooterComponent={<PaginationControls page={page} totalPages={totalPages} loading={loading} onPage={(next) => { setLoading(true); void load(next) }} />}
    refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load(page)} />} />
}

function StudentRow({ item }: { item: CourseStudent }) {
  return <Pressable style={styles.row}><Text style={styles.title}>{item.fullName}</Text><Text style={styles.subtitle}>{item.studentCode}{item.email ? ` · ${item.email}` : ''}</Text></Pressable>
}

function ExamRow({ item }: { item: CourseExam }) {
  return <Pressable style={styles.row} onPress={() => router.push({ pathname: '/(app)/(teacher)/exams/[examId]', params: { examId: item.examId } })}>
    <Text style={styles.title}>{item.title}</Text><Text style={styles.subtitle}>{formatDateTime(item.startTime)} · {item.status}</Text>
  </Pressable>
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  row: { padding: 14, borderRadius: 12, backgroundColor: '#fff', borderColor: '#e2e8f0', borderWidth: 1, marginBottom: 9 },
  title: { color: '#0f172a', fontWeight: '700', fontSize: 14 }, subtitle: { color: '#64748b', marginTop: 5, fontSize: 12 },
})
