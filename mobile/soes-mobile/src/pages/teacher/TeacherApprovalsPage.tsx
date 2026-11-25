import { BackToTopFlatList } from '../../components/ui/BackToTop'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { listApprovedExamApprovals, listPendingExamApprovals } from '../../api/teacher-approvals.api'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SectionCard } from '../../components/ui/SectionCard'
import { PaginationControls } from '../../components/ui/PaginationControls'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { ExamApproval } from '../../types/teacher-approvals.types'
import { formatDateTime } from '../../utils/date'

type Tab = 'pending' | 'approved'

export function TeacherApprovalsPage({ showHeader = true }: { showHeader?: boolean }) {
  const [tab, setTab] = useState<Tab>('pending')
  const [items, setItems] = useState<ExamApproval[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const load = useCallback(async (nextPage: number, nextTab: Tab = tab) => {
    try {
      const result = nextTab === 'pending' ? await listPendingExamApprovals(nextPage) : await listApprovedExamApprovals(nextPage)
      setItems(result.items); setPage(nextPage); setTotalPages(result.pagination.totalPages); setError(false)
    } catch { setError(true) } finally { setLoading(false); setRefreshing(false) }
  }, [tab])
  useEffect(() => { setLoading(true); void load(1, tab) }, [tab, load])

  return <View style={styles.root}>
    {showHeader && <View style={styles.header}><ScreenHeader title="Duyệt chuyên môn" description="Theo dõi đề chờ duyệt và toàn bộ lịch sử đề đã duyệt" /></View>}
    <View style={styles.tabs}>
      {([['pending', 'Đề gửi duyệt'], ['approved', 'Đề đã duyệt']] as const).map(([key, label]) =>
        <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.selected]} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
          <Text style={[styles.tabText, tab === key && styles.selectedText]}>{label}</Text>
        </Pressable>)}
    </View>
    {loading && items.length === 0 ? <ScreenState kind="loading" /> : error && items.length === 0 ? <ScreenState kind="error" onRetry={() => void load(1)} /> :
      <BackToTopFlatList key={`${tab}-${page}`} data={items} keyExtractor={(exam) => exam.id} contentContainerStyle={styles.list}
        renderItem={({ item }) => <Pressable onPress={() => router.push(`/(app)/(teacher)/approvals/${item.id}` as never)} accessibilityRole="button">
          <SectionCard title={item.title}>
            <View style={styles.row}><StatusBadge label={tab === 'approved' ? 'Đã duyệt' : 'Đang chờ xử lý'} tone={tab === 'approved' ? 'success' : 'warning'} /><Text style={styles.muted}>Lần gửi {item.reviewRound.version}</Text></View>
            <Text style={styles.line}>{item.subject.code} · {item.subject.name}</Text>
            <Text style={styles.line}>Người ra đề: {item.creator?.fullName ?? '—'}</Text>
            {tab === 'approved' && <Text style={styles.reviewer}>Được duyệt bởi: {item.reviewRound.reviewerName ?? item.reviewer?.fullName ?? '—'}</Text>}
            <Text style={styles.line}>{item.questionCount} câu · {item.totalPoints} điểm · Gửi {formatDateTime(item.reviewRound.submittedAt)}</Text>
          </SectionCard>
        </Pressable>}
        ListEmptyComponent={<ScreenState kind="empty" message={tab === 'approved' ? 'Chưa có đề đã duyệt.' : 'Không có đề đang chờ duyệt.'} />}
        ListFooterComponent={<PaginationControls page={page} totalPages={totalPages} loading={loading} onPage={(next) => { setLoading(true); void load(next) }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(page) }} />} />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 0 }, list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, marginBottom: 4, padding: 3, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, minHeight: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 8 }, selected: { backgroundColor: '#2563eb' }, tabText: { color: '#475569', fontWeight: '700', fontSize: 13 }, selectedText: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }, muted: { color: '#64748b', fontSize: 12 }, line: { color: '#64748b', fontSize: 13, lineHeight: 20 }, reviewer: { color: '#047857', fontSize: 13, fontWeight: '700', lineHeight: 20 },
})
