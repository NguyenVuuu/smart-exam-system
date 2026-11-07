import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SearchField } from '../../components/ui/SearchField'
import { PaginationControls } from '../../components/ui/PaginationControls'
import { CourseCard } from '../../components/teacher/courses/CourseCard'
import { listCourses } from '../../api/teacher-courses.api'
import type { TeacherCourse } from '../../types/teacher-courses.types'

export function TeacherCoursesScreen() {
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async (nextPage: number, query: string) => {
    const currentRequest = ++requestId.current
    try {
      const result = await listCourses(nextPage, query)
      if (currentRequest !== requestId.current) return
      setCourses(result.items)
      setPage(nextPage)
      setTotalPages(result.pagination.totalPages)
      setError(false)
    } catch { if (currentRequest === requestId.current) setError(true) }
    finally { if (currentRequest === requestId.current) { setLoading(false); setRefreshing(false) } }
  }, [])

  useEffect(() => {
    requestId.current += 1
    const timer = setTimeout(() => { setCourses([]); setLoading(true); void load(1, keyword) }, 250)
    return () => { clearTimeout(timer); requestId.current += 1 }
  }, [keyword, load])

  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader showBack title="Lớp học phần" description="Các lớp bạn đang phụ trách" /><SearchField value={keyword} onChangeText={setKeyword} placeholder="Tìm lớp hoặc môn học" /></View>
    {loading && courses.length === 0 ? <ScreenState kind="loading" /> : error && courses.length === 0 ? <ScreenState kind="error" onRetry={() => void load(1, keyword)} /> :
      <FlatList key={page} data={courses} keyExtractor={(course) => course.id} renderItem={({ item }) => <CourseCard course={item} />}
        contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<ScreenState kind="empty" message="Không tìm thấy lớp học phần." />}
        ListFooterComponent={<>{error && <Text style={styles.error}>Không thể tải lớp.</Text>}
          <PaginationControls page={page} totalPages={totalPages} loading={loading} onPage={(next) => { setLoading(true); void load(next, keyword) }} /></>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(page, keyword) }} />} />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 4 }, list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 32, flexGrow: 1 },
  error: { color: '#b91c1c', fontSize: 12, textAlign: 'center', padding: 12 },
})
