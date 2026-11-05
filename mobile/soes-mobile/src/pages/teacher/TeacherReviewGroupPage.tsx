import { isAxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native'
import { getReviewGroup, listReviewGroupCandidates } from '../../api/teacher-review-group.api'
import { ReviewGroupManager, ReviewGroupMembers } from '../../components/teacher/review-group/ReviewGroupManager'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SectionCard } from '../../components/ui/SectionCard'
import { useAuthStore } from '../../store/authStore'
import type { ReviewGroup, ReviewGroupCandidate } from '../../types/teacher-review-group.types'

async function fetchGroupData(isHead: boolean) {
  const group = getReviewGroup().catch((cause: unknown) => {
    if (isHead && isAxiosError(cause) && cause.response?.status === 404) return null
    throw cause
  })
  const candidates = isHead ? listReviewGroupCandidates() : Promise.resolve([] as ReviewGroupCandidate[])
  return Promise.all([group, candidates])
}

export function TeacherReviewGroupPage() {
  const isHead = useAuthStore((state) => state.user?.role === 'DEPARTMENT_HEAD')
  const [group, setGroup] = useState<ReviewGroup | null>(null)
  const [candidates, setCandidates] = useState<ReviewGroupCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const load = useCallback(async () => {
    try {
      const [nextGroup, nextCandidates] = await fetchGroupData(isHead)
      setGroup(nextGroup); setCandidates(nextCandidates); setError(false)
    } catch { setError(true) }
    finally { setLoading(false); setRefreshing(false) }
  }, [isHead])
  useEffect(() => {
    let active = true
    fetchGroupData(isHead)
      .then(([nextGroup, nextCandidates]) => { if (active) { setGroup(nextGroup); setCandidates(nextCandidates); setError(false) } })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isHead])

  if (loading && !group) return <ScreenState kind="loading" />
  if (error && !group) return <ScreenState kind="error" onRetry={() => void load()} />
  return <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} />}>
    <ScreenHeader title="Nhóm duyệt đề bộ môn" description="Mỗi bộ môn có một nhóm duyệt đề cố định" />
    {group ? <><SectionCard title={group.name}>
      <Text style={styles.line}>{group.department.code} · {group.department.name}</Text>
      <Text style={styles.line}>Trạng thái: {group.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Text>
    </SectionCard><ReviewGroupMembers group={group} onChanged={load} /></> : null}
    {isHead ? <ReviewGroupManager key={group ? `${group.id}-${group.name}` : 'new'} group={group} candidates={candidates} onChanged={load} /> : null}
    {!group && !isHead ? <ScreenState kind="empty" message="Bộ môn chưa có nhóm duyệt đề." /> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  line: { color: '#475569', fontSize: 13, lineHeight: 20 },
})
