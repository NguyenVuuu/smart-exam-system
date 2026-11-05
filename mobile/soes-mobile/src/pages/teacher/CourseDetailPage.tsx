import { useEffect, useState } from 'react'
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SectionCard } from '../../components/ui/SectionCard'
import { formatDateTime } from '../../utils/date'
import { getCourse } from '../../api/teacher-courses.api'
import { CoursePagedTab } from '../../components/teacher/courses/CoursePagedTab'
import { CoursePostsSection } from '../../components/teacher/courses/CoursePostsSection'
import type { CourseDetail } from '../../types/teacher-courses.types'

type Tab = 'overview' | 'students' | 'materials' | 'posts' | 'exams'
const tabs: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Tổng quan' }, { key: 'students', label: 'Sinh viên' },
  { key: 'materials', label: 'Tài liệu' }, { key: 'posts', label: 'Bài viết' }, { key: 'exams', label: 'Đề thi' },
]

export function CourseDetailScreen({ id }: { id: string }) {
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')

  async function reload() {
    setLoading(true)
    try { setCourse(await getCourse(id)); setError(false) }
    catch { setError(true) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    let active = true
    getCourse(id).then((value) => { if (active) setCourse(value) })
      .catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading && !course) return <ScreenState kind="loading" />
  if (error && !course) return <ScreenState kind="error" onRetry={() => void reload()} />
  if (!course) return <ScreenState kind="empty" />
  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader title={course.subject.name} description={`${course.subject.code} · ${course.code} · ${course.semester.name}`} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabScroll}>
      {tabs.map((entry) => <Pressable key={entry.key} onPress={() => setTab(entry.key)} style={[styles.tab, tab === entry.key && styles.tabActive]}>
        <Text style={[styles.tabText, tab === entry.key && styles.tabTextActive]}>{entry.label}</Text>
      </Pressable>)}
    </ScrollView>
    {tab === 'students' || tab === 'exams' ? <CoursePagedTab key={tab} courseId={id} kind={tab} /> :
      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'overview' && <SectionCard title="Thông tin lớp"><Text style={styles.line}>Trạng thái: {course.status === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'}</Text><Text style={styles.line}>Sinh viên: {course.enrollmentCount}</Text><Text style={styles.line}>Ca thi: {course.scheduleCount}</Text></SectionCard>}
        {tab === 'materials' && (course.materials.length ? course.materials.map((item) => <SectionCard key={item.id} title={item.title ?? item.fileName}><Text style={styles.line}>{item.fileName} · {formatDateTime(item.createdAt)}</Text></SectionCard>) : <ScreenState kind="empty" message="Chưa có tài liệu." />)}
        {tab === 'posts' && <CoursePostsSection courseId={id} posts={course.posts} onChanged={reload} />}
      </ScrollView>}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 0 }, tabScroll: { flexGrow: 0 },
  tabs: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 }, tab: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, tabText: { color: '#475569', fontWeight: '600' }, tabTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 32 }, line: { color: '#334155', fontSize: 14, lineHeight: 21, marginBottom: 6 }, meta: { color: '#94a3b8', fontSize: 12, marginTop: 8 },
})
