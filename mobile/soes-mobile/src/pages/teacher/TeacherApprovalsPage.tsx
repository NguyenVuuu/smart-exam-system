import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { listPendingExamApprovals } from '../../api/teacher-approvals.api'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SectionCard } from '../../components/ui/SectionCard'
import { PaginationControls } from '../../components/ui/PaginationControls'
import type { ExamApproval } from '../../types/teacher-approvals.types'
import { formatDateTime } from '../../utils/date'

export function TeacherApprovalsPage() {
  const [items, setItems] = useState<ExamApproval[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const load = useCallback(async (nextPage: number) => {
    try {
      const result = await listPendingExamApprovals(nextPage)
      setItems(result.items)
      setPage(nextPage); setTotalPages(result.pagination.totalPages); setError(false)
    } catch { setError(true) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])
  useEffect(() => {
    let active = true
    listPendingExamApprovals(1).then((result) => {
      if (!active) return
      setItems(result.items); setPage(1); setTotalPages(result.pagination.totalPages); setError(false)
    }).catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader title="Duyệt đề cuối kỳ" description="Các đề đang chờ thành viên nhóm thẩm định" /></View>
    {loading && items.length === 0 ? <ScreenState kind="loading" /> : error && items.length === 0 ? <ScreenState kind="error" onRetry={() => void load(1)} /> :
      <FlatList data={items} keyExtractor={(exam) => exam.id} contentContainerStyle={styles.list}
        renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.push(`/(app)/(teacher)/approvals/${item.id}` as never)}>
          <SectionCard title={item.title}><Text style={styles.line}>{item.subject.code} · {item.subject.name}</Text>
            <Text style={styles.line}>Lần gửi {item.reviewRound.version} · {formatDateTime(item.reviewRound.submittedAt)}</Text>
            <Text style={styles.line}>{item.questionCount} câu · {item.totalPoints} điểm</Text></SectionCard>
        </Pressable>}
        ListEmptyComponent={<ScreenState kind="empty" message="Không có đề đang chờ duyệt." />}
        ListFooterComponent={<>{error && <Text style={styles.error}>Không tải được trang này.</Text>}
          <PaginationControls page={page} totalPages={totalPages} loading={loading} onPage={(next) => { setLoading(true); void load(next) }} /></>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(page || 1) }} />} />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 0 },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 }, line: { color: '#64748b', fontSize: 13, lineHeight: 20 },
  error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
})
