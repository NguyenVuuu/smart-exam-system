import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '../../../components/ui/ScreenHeader'
import { ScreenState } from '../../../components/ui/ScreenState'
import { SearchField } from '../../../components/ui/SearchField'
import { CourseCard } from './CourseCard'
import { listCourses } from './api'
import type { TeacherCourse } from './types'

export function TeacherCoursesScreen() {
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async (nextPage: number, query: string) => {
    try {
      const result = await listCourses(nextPage, query)
      setCourses((current) => nextPage === 1 ? result.items : [...current, ...result.items])
      setPage(nextPage)
      setTotalPages(result.pagination.totalPages)
      setError(false)
    } catch { setError(true) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { void load(1, keyword) }, 250)
    return () => clearTimeout(timer)
  }, [keyword, load])

  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader title="Lớp học phần" description="Các lớp bạn đang phụ trách" /><SearchField value={keyword} onChangeText={setKeyword} placeholder="Tìm lớp hoặc môn học" /></View>
    {loading && courses.length === 0 ? <ScreenState kind="loading" /> : error && courses.length === 0 ? <ScreenState kind="error" onRetry={() => void load(1, keyword)} /> :
      <FlatList data={courses} keyExtractor={(course) => course.id} renderItem={({ item }) => <CourseCard course={item} />}
        contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<ScreenState kind="empty" message="Không tìm thấy lớp học phần." />}
        ListFooterComponent={error ? <Text style={styles.error}>Không thể tải thêm lớp. Kéo xuống để thử lại.</Text> : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(1, keyword) }} />}
        onEndReached={() => { if (!loading && !error && page < totalPages) { setLoading(true); void load(page + 1, keyword) } }} onEndReachedThreshold={0.3} />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 4 }, list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 32, flexGrow: 1 },
  error: { color: '#b91c1c', fontSize: 12, textAlign: 'center', padding: 12 },
})
