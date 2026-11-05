import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { listExams } from '../../api/teacher-exams.api'
import { ExamListCard } from '../../components/teacher/exams/ExamListCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SearchField } from '../../components/ui/SearchField'
import type { ExamSummary } from '../../types/teacher-exams.types'

type ExamType = 'ALL' | 'QUIZ' | 'MIDTERM' | 'FINAL'
const filters: { type: ExamType; label: string }[] = [
  { type: 'ALL', label: 'Tất cả' }, { type: 'QUIZ', label: 'Quiz' },
  { type: 'MIDTERM', label: 'Giữa kỳ' }, { type: 'FINAL', label: 'Cuối kỳ' },
]

export function TeacherExamsPage() {
  const [items, setItems] = useState<ExamSummary[]>([])
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<ExamType>('ALL')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const requestId = useRef(0)
  const inFlight = useRef(false)

  const load = useCallback(async (nextPage: number, query: string, nextType: ExamType) => {
    if (inFlight.current && nextPage > 1) return
    const currentRequest = ++requestId.current
    inFlight.current = true
    try {
      const result = await listExams(nextPage, query, nextType === 'ALL' ? undefined : nextType)
      if (currentRequest !== requestId.current) return
      setItems((previous) => nextPage === 1 ? result.items : [...previous, ...result.items])
      setPage(nextPage)
      setTotalPages(result.pagination.totalPages)
      setError(false)
    } catch { if (currentRequest === requestId.current) setError(true) }
    finally { if (currentRequest === requestId.current) { setLoading(false); setRefreshing(false); inFlight.current = false } }
  }, [])

  useEffect(() => {
    requestId.current += 1
    const timer = setTimeout(() => { setItems([]); setLoading(true); void load(1, keyword, type) }, 250)
    return () => { clearTimeout(timer); requestId.current += 1 }
  }, [keyword, type, load])

  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader title="Đề thi" description="Xem nội dung và tình trạng đề thi" />
      <SearchField value={keyword} onChangeText={setKeyword} placeholder="Tìm tên đề hoặc môn học" />
      <View style={styles.filters}>{filters.map((filter) => <Pressable key={filter.type} accessibilityRole="button"
        onPress={() => setType(filter.type)} style={[styles.filter, type === filter.type && styles.selected]}>
        <Text style={[styles.filterText, type === filter.type && styles.selectedText]}>{filter.label}</Text>
      </Pressable>)}</View></View>
    {loading && items.length === 0 ? <ScreenState kind="loading" /> : error && items.length === 0 ? <ScreenState kind="error" onRetry={() => void load(1, keyword, type)} /> :
      <FlatList data={items} keyExtractor={(exam) => exam.id} renderItem={({ item }) => <ExamListCard exam={item} />}
        contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<ScreenState kind="empty" message="Chưa có đề thi phù hợp." />}
        ListFooterComponent={error ? <Text style={styles.error}>Không thể tải thêm đề. Kéo xuống để thử lại.</Text> : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(1, keyword, type) }} />}
        onEndReached={() => { if (!loading && !error && page < totalPages) { setLoading(true); void load(page + 1, keyword, type) } }} onEndReachedThreshold={0.3} />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 2 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filter: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' },
  selected: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, filterText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  selectedText: { color: '#fff' }, list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 32, flexGrow: 1 },
  error: { color: '#b91c1c', fontSize: 12, textAlign: 'center', padding: 12 },
})
