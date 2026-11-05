import { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { approveQuestion, listPendingQuestionApprovals, rejectQuestion } from '../../api/teacher-question-approvals.api'
import { QuestionApprovalCard } from '../../components/teacher/question-approvals/QuestionApprovalCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import type { QuestionApproval } from '../../types/teacher-question-approvals.types'

export function TeacherQuestionApprovalsPage() {
  const [items, setItems] = useState<QuestionApproval[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const load = useCallback(async (nextPage: number) => {
    try {
      const result = await listPendingQuestionApprovals(nextPage)
      setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items])
      setPage(nextPage); setTotalPages(result.pagination.totalPages); setError(false)
    } catch { setError(true) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])
  useEffect(() => {
    let active = true
    listPendingQuestionApprovals(1).then((result) => { if (active) {
      setItems(result.items); setPage(1); setTotalPages(result.pagination.totalPages); setError(false)
    } }).catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function decide(id: string, decision: 'approve' | 'reject') {
    if (busyId) return
    setBusyId(id)
    try {
      if (decision === 'approve') await approveQuestion(id)
      else await rejectQuestion(id, reason.trim())
      setRejectId(null); setReason('')
      Alert.alert('Thành công', decision === 'approve' ? 'Câu hỏi đã được duyệt.' : 'Đã gửi yêu cầu sửa cho tác giả.')
      await load(1)
    } catch { Alert.alert('Không thể xử lý', 'Câu hỏi có thể đã được duyệt hoặc quyền của bạn đã thay đổi.'); void load(1) }
    finally { setBusyId(null) }
  }
  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader title="Duyệt câu hỏi" description="Câu hỏi chờ duyệt vào ngân hàng dùng chung" /></View>
    {loading && items.length === 0 ? <ScreenState kind="loading" /> : error && items.length === 0 ? <ScreenState kind="error" onRetry={() => void load(1)} /> :
      <FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
        renderItem={({ item }) => <QuestionApprovalCard item={item} busy={busyId !== null}
          reason={rejectId === item.id ? reason : ''} editingReason={rejectId === item.id}
          onApprove={() => Alert.alert('Duyệt câu hỏi', 'Xác nhận đưa câu hỏi vào ngân hàng chung?', [
            { text: 'Hủy', style: 'cancel' }, { text: 'Duyệt', onPress: () => { void decide(item.id, 'approve') } },
          ])} onBeginReject={() => { setRejectId(item.id); setReason('') }} onReasonChange={setReason}
          onReject={() => Alert.alert('Yêu cầu sửa', 'Gửi lý do cho tác giả?', [
            { text: 'Hủy', style: 'cancel' }, { text: 'Gửi', onPress: () => { void decide(item.id, 'reject') } },
          ])} />}
        ListEmptyComponent={<ScreenState kind="empty" message="Không có câu hỏi đang chờ duyệt." />}
        ListFooterComponent={error ? <Text style={styles.error}>Không thể tải thêm câu hỏi.</Text> : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(1) }} />}
        onEndReached={() => { if (!loading && !error && page < totalPages) { setLoading(true); void load(page + 1) } }} onEndReachedThreshold={0.3} />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 0 },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 }, error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
})
