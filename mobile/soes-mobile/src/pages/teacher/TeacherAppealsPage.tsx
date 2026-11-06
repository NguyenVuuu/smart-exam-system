import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { listTeacherAppeals } from '../../api/teacher-appeals.api'
import { AppealCard } from '../../components/teacher/appeals/AppealCard'
import { ChoicePicker } from '../../components/ui/ChoicePicker'
import { PaginationControls } from '../../components/ui/PaginationControls'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import type { AppealStatus, TeacherAppeal } from '../../types/teacher-appeals.types'

const statuses = [
  { value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'IN_REVIEW', label: 'Đang xem xét' }, { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'REJECTED', label: 'Đã từ chối' },
]

export function TeacherAppealsPage() {
  const [items, setItems] = useState<TeacherAppeal[]>([])
  const [status, setStatus] = useState<AppealStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async (nextPage: number, nextStatus: AppealStatus | 'ALL') => {
    setLoading(true)
    try {
      const result = await listTeacherAppeals(nextPage, nextStatus)
      setItems(result.items); setPage(nextPage); setTotalPages(result.pagination.totalPages); setError(false)
    } catch { setError(true) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useFocusEffect(useCallback(() => { void load(1, status) }, [load, status]))

  return <View style={styles.root}>
    <FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
      ListHeaderComponent={<>
        <ScreenHeader title="Phúc khảo điểm" description="Xem yêu cầu, đối chiếu bài làm và lưu kết luận" />
        <ChoicePicker label="Trạng thái" placeholder="Tất cả trạng thái" options={statuses}
          selectedValues={[status]} onToggle={(value) => setStatus(value as AppealStatus | 'ALL')} />
      </>}
      renderItem={({ item }) => <AppealCard appeal={item} />}
      ListEmptyComponent={loading ? <ScreenState kind="loading" /> : error ? <ScreenState kind="error" onRetry={() => void load(1, status)} />
        : <ScreenState kind="empty" message="Không có yêu cầu phúc khảo phù hợp." />}
      ListFooterComponent={<>{error && items.length > 0 && <Text style={styles.error}>Không thể tải trang này.</Text>}
        <PaginationControls page={page} totalPages={totalPages} loading={loading} onPage={(next) => void load(next, status)} /></>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(page, status) }} />}
    />
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, list: { flexGrow: 1, padding: 16, paddingBottom: 36 },
  error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
})
