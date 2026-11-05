import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { approveExam, getExamApproval, requestExamRevision } from '../../api/teacher-approvals.api'
import { ApprovalQuestionCard } from '../../components/teacher/approvals/ApprovalQuestionCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SectionCard } from '../../components/ui/SectionCard'
import { useKeyboardBottomOffset } from '../../hooks/useKeyboardBottomOffset'
import type { ExamApprovalDetail, QuestionRevisionNote } from '../../types/teacher-approvals.types'

export function TeacherApprovalDetailPage({ id }: { id: string }) {
  const [approval, setApproval] = useState<ExamApprovalDetail | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const { animatedOffset, isKeyboardOpen } = useKeyboardBottomOffset({ accountForBottomInset: true })

  const reload = useCallback(async () => {
    setLoading(true)
    try { setApproval(await getExamApproval(id)); setError(false) }
    catch { setError(true) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => {
    let active = true
    getExamApproval(id).then((result) => { if (active) { setApproval(result); setError(false) } })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  async function decide(kind: 'approve' | 'revision', questionNotes: QuestionRevisionNote[] = []) {
    if (busy) return
    setBusy(true)
    try {
      if (kind === 'approve') await approveExam(id)
      else await requestExamRevision(id, questionNotes)
      Alert.alert('Thành công', kind === 'approve' ? 'Đề thi đã được duyệt.' : 'Đã gửi góp ý cho người ra đề.')
      router.replace('/(app)/(teacher)/approvals' as never)
    } catch {
      Alert.alert('Không thể xử lý', 'Đề có thể đã được thành viên khác xử lý hoặc quyền duyệt đã thay đổi. Vui lòng tải lại.')
      void reload()
    } finally { setBusy(false) }
  }

  function confirmApprove() {
    Alert.alert('Duyệt đề thi', 'Xác nhận duyệt đề cuối kỳ này?', [
      { text: 'Hủy', style: 'cancel' }, { text: 'Duyệt đề', onPress: () => { void decide('approve') } },
    ])
  }
  function confirmRevision() {
    const questionNotes = Object.entries(notes).map(([questionId, note]) => ({ questionId, note: note.trim() }))
      .filter(({ note }) => note.length > 0)
    if (!questionNotes.length) {
      Alert.alert('Thiếu góp ý', 'Hãy nhập nội dung cần sửa ở ít nhất một câu hỏi.')
      return
    }
    Alert.alert('Yêu cầu sửa đề', `Gửi góp ý cho ${questionNotes.length} câu hỏi?`, [
      { text: 'Hủy', style: 'cancel' }, { text: 'Gửi yêu cầu', onPress: () => { void decide('revision', questionNotes) } },
    ])
  }

  if (loading && !approval) return <ScreenState kind="loading" />
  if (error && !approval) return <ScreenState kind="error" onRetry={() => void reload()} />
  if (!approval) return <ScreenState kind="empty" />

  const questions = [...approval.snapshot.examQuestions].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <Animated.View
      style={[
        styles.root,
        Platform.OS === 'ios' && { paddingBottom: animatedOffset },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isKeyboardOpen && styles.contentKeyboardOpen]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
      >
        <ScreenHeader showBack title={approval.snapshot.title} description={`${approval.subject.code} · Lần gửi ${approval.reviewRound.version}`} />
        <SectionCard title="Thông tin đề cuối kỳ">
          <Text style={styles.line}>Thời lượng: {approval.snapshot.defaultDurationMinutes} phút</Text>
          <Text style={styles.line}>{questions.length} câu · {approval.snapshot.totalPoints} điểm</Text>
          {approval.snapshot.description ? <Text style={styles.line}>{approval.snapshot.description}</Text> : null}
        </SectionCard>
        {questions.map((question, index) => (
          <ApprovalQuestionCard
            key={question.id}
            question={question}
            number={index + 1}
            note={notes[question.id] ?? ''}
            onNoteChange={(note) => setNotes((previous) => ({ ...previous, [question.id]: note }))}
          />
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={busy || approval.reviewRound.status !== 'PENDING'}
          style={[styles.button, styles.revision]}
          onPress={confirmRevision}
        >
          <Text style={styles.revisionText}>Yêu cầu sửa</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy || approval.reviewRound.status !== 'PENDING'}
          style={[styles.button, styles.approve]}
          onPress={confirmApprove}
        >
          <Text style={styles.approveText}>Duyệt đề</Text>
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  contentKeyboardOpen: { paddingBottom: 220 },
  line: { color: '#475569', fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, padding: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  button: { flex: 1, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  revision: { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3' },
  approve: { backgroundColor: '#059669' },
  revisionText: { color: '#be123c', fontWeight: '700' },
  approveText: { color: '#fff', fontWeight: '700' },
})
