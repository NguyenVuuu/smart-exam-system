import { BackToTopScrollView } from '../../components/ui/BackToTop'
import { ChoicePicker } from '../../components/ui/ChoicePicker'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { approveExam, getExamApproval, getExamReviewHistory, requestExamRevision } from '../../api/teacher-approvals.api'
import { ApprovalQuestionCard } from '../../components/teacher/approvals/ApprovalQuestionCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SectionCard } from '../../components/ui/SectionCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { ApprovalSnapshot, ExamApprovalDetail, QuestionRevisionNote, ReviewHistoryItem } from '../../types/teacher-approvals.types'
import { formatDateTime } from '../../utils/date'

type Tab = 'current' | 'history'
type DiffFilter = 'ALL' | 'ADDED' | 'REMOVED' | 'MODIFIED'
type SnapshotQuestion = ApprovalSnapshot['examQuestions'][number]
type DiffRow = { kind: DiffFilter | 'UNCHANGED'; before?: SnapshotQuestion; after?: SnapshotQuestion }

function questionSignature(question: SnapshotQuestion) {
  return JSON.stringify({ title: question.title, content: question.content, type: question.type, options: question.options?.map((item) => ({ content: item.content, isCorrect: item.isCorrect })), programmingTests: question.programmingTests?.map((item) => ({ input: item.input, expectedOutput: item.expectedOutput, isHidden: item.isHidden })) })
}

function getQuestionDiff(previous: ApprovalSnapshot['examQuestions'], current: ApprovalSnapshot['examQuestions']) {
  const previousByKey = new Map(previous.map((question) => [question.id, question]))
  const currentByKey = new Map(current.map((question) => [question.id, question]))
  const rows: DiffRow[] = current.map((question) => {
    const before = previousByKey.get(question.id)
    return { kind: before ? (questionSignature(before) === questionSignature(question) ? 'UNCHANGED' : 'MODIFIED') : 'ADDED', before, after: question }
  })
  previous.forEach((question) => { if (!currentByKey.has(question.id)) rows.push({ kind: 'REMOVED', before: question, after: undefined }) })
  return rows.filter((row) => row.kind !== 'UNCHANGED')
}

export function TeacherApprovalDetailPage({ id }: { id: string }) {
  const [approval, setApproval] = useState<ExamApprovalDetail | null>(null)
  const [history, setHistory] = useState<ReviewHistoryItem[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('ALL')
  const [tab, setTab] = useState<Tab>('current')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [detail, rounds] = await Promise.all([getExamApproval(id), getExamReviewHistory(id)])
      setApproval(detail); setHistory(rounds); setSelectedVersion(rounds[0]?.version ?? null); setError(false)
    } catch { setError(true) } finally { setLoading(false) }
  }, [id])
  useEffect(() => { void reload() }, [reload])

  async function decide(kind: 'approve' | 'revision') {
    if (!approval || busy) return
    const questionNotes: QuestionRevisionNote[] = Object.entries(notes).map(([questionId, note]) => ({ questionId, note: note.trim() })).filter((item) => item.note)
    if (kind === 'revision' && !reason.trim() && !questionNotes.length) { Alert.alert('Thiếu góp ý', 'Hãy nhập góp ý tổng hoặc góp ý cho ít nhất một câu hỏi.'); return }
    setBusy(true)
    try {
      if (kind === 'approve') await approveExam(id); else await requestExamRevision(id, reason, questionNotes)
      Alert.alert('Thành công', kind === 'approve' ? 'Đề thi đã được duyệt.' : 'Đã gửi yêu cầu sửa đề.')
      router.replace('/(app)/(teacher)/approvals' as never)
    } catch { Alert.alert('Không thể xử lý', 'Đề có thể đã được thành viên khác xử lý. Vui lòng tải lại.'); void reload() }
    finally { setBusy(false) }
  }

  if (loading && !approval) return <ScreenState kind="loading" />
  if (error && !approval) return <ScreenState kind="error" onRetry={() => void reload()} />
  if (!approval) return <ScreenState kind="empty" />

  const readOnly = approval.approvalStatus === 'APPROVED' || approval.reviewRound.status === 'APPROVED'
  const currentQuestions = [...approval.snapshot.examQuestions].sort((a, b) => a.orderIndex - b.orderIndex)
  const selectedRound = history.find((round) => round.version === selectedVersion) ?? history[0]
  const previousRound = selectedRound ? history.find((round) => round.version === selectedRound.version - 1) : undefined
  const shownSnapshot: ApprovalSnapshot = tab === 'history' && selectedRound ? selectedRound.snapshot : approval.snapshot
  const shownQuestions = [...shownSnapshot.examQuestions].sort((a, b) => a.orderIndex - b.orderIndex)
  const versionOptions = history.map((round) => ({ value: String(round.version), label: `Lần gửi ${round.version} · ${round.status === 'APPROVED' ? 'Đã duyệt' : round.status === 'REVISION_REQUESTED' ? 'Yêu cầu sửa' : 'Đang xử lý'}`, description: `${round.submittedBy.fullName} · ${formatDateTime(round.submittedAt)}` }))

  const diffRows = previousRound && selectedRound ? getQuestionDiff(previousRound.snapshot.examQuestions, selectedRound.snapshot.examQuestions) : []
  const visibleDiffRows = diffRows.filter((row) => diffFilter === 'ALL' || row.kind === diffFilter)

  return <View style={styles.root}>
    <BackToTopScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader showBack title={readOnly ? 'Lịch sử duyệt đề' : 'Duyệt đề thi'} description={`${approval.subject.code} · ${approval.snapshot.title}`} />
      <SectionCard title={approval.snapshot.title}>
        <View style={styles.row}><StatusBadge label={readOnly ? 'Đã duyệt' : 'Đang chờ xử lý'} tone={readOnly ? 'success' : 'warning'} /><Text style={styles.muted}>Lần gửi {approval.reviewRound.version}</Text></View>
        <Text style={styles.line}>Người ra đề: {approval.creator?.fullName ?? '—'}</Text>
        {readOnly && <Text style={styles.reviewer}>Được duyệt bởi: {approval.reviewRound.reviewerName ?? approval.reviewer?.fullName ?? '—'}</Text>}
        <Text style={styles.line}>{currentQuestions.length} câu · {approval.snapshot.totalPoints} điểm · {approval.snapshot.defaultDurationMinutes} phút</Text>
      </SectionCard>
      <View style={styles.tabs}><Pressable onPress={() => setTab('current')} style={[styles.tab, tab === 'current' && styles.activeTab]}><Text style={[styles.tabText, tab === 'current' && styles.activeText]}>Đề hiện tại</Text></Pressable><Pressable onPress={() => setTab('history')} style={[styles.tab, tab === 'history' && styles.activeTab]}><Text style={[styles.tabText, tab === 'history' && styles.activeText]}>Lịch sử ({history.length})</Text></Pressable></View>
      {tab === 'history' && <SectionCard title="Các lần gửi và xử lý">
        <ChoicePicker label="Chọn phiên bản cần xem" placeholder="Chọn phiên bản" options={versionOptions} selectedValues={selectedVersion == null ? [] : [String(selectedVersion)]} onToggle={(value) => setSelectedVersion(Number(value))} />
        {selectedRound?.decision?.reviewer && <Text style={styles.reviewer}>Xử lý bởi: {selectedRound.decision.reviewer.fullName}</Text>}
        {selectedRound?.decision?.reason && <View style={styles.feedback}><Text style={styles.feedbackTitle}>Góp ý tổng</Text><Text style={styles.feedbackText}>{selectedRound.decision.reason}</Text></View>}
        {selectedRound?.decision?.questionFeedback?.map((item) => <View key={`${selectedRound.id}-${item.questionId}`} style={styles.feedback}><Text style={styles.feedbackTitle}>Câu {item.order}: {item.title}</Text><Text style={styles.feedbackText}>{item.note}</Text></View>)}
        <Text style={styles.hint}>Đang xem nội dung của lần gửi {selectedRound?.version ?? '—'}.</Text>
      </SectionCard>}
      {tab === 'current' && !readOnly && <SectionCard title="Góp ý tổng" headerRight={<Text style={styles.optional}>Không bắt buộc</Text>}><TextInput value={reason} onChangeText={setReason} multiline placeholder="Nhập góp ý cho toàn bộ đề..." placeholderTextColor="#94a3b8" style={styles.generalInput} textAlignVertical="top" /></SectionCard>}
      {shownQuestions.map((question, index) => <ApprovalQuestionCard key={`${selectedRound?.id ?? 'current'}-${question.id}`} question={question} number={index + 1} note={notes[question.id] ?? ''} {...(tab === 'current' && !readOnly ? { onNoteChange: (note: string) => setNotes((prev) => ({ ...prev, [question.id]: note })) } : {})} />)}
      {tab === 'history' && previousRound && <SectionCard title={`So sánh lần gửi ${selectedRound?.version} với lần gửi ${previousRound.version}`}>
        <View style={styles.summary}><Text style={styles.summaryText}>Thêm {diffRows.filter((row) => row.kind === 'ADDED').length}</Text><Text style={styles.summaryText}>Xóa {diffRows.filter((row) => row.kind === 'REMOVED').length}</Text><Text style={styles.summaryText}>Sửa {diffRows.filter((row) => row.kind === 'MODIFIED').length}</Text></View>
        <View style={styles.filterRow}>{([['ALL', 'Tất cả'], ['ADDED', 'Thêm'], ['REMOVED', 'Xóa'], ['MODIFIED', 'Sửa']] as const).map(([key, label]) => <Pressable key={key} onPress={() => setDiffFilter(key)} style={[styles.filter, diffFilter === key && styles.filterActive]}><Text style={[styles.filterText, diffFilter === key && styles.filterActiveText]}>{label}</Text></Pressable>)}</View>
        {visibleDiffRows.map((row, index) => <View key={`${row.kind}-${row.after?.id ?? row.before?.id ?? index}`} style={styles.diffBlock}><StatusBadge label={row.kind === 'ADDED' ? 'Câu thêm mới' : row.kind === 'REMOVED' ? 'Câu đã xóa' : 'Câu đã chỉnh sửa'} tone={row.kind === 'ADDED' ? 'success' : row.kind === 'REMOVED' ? 'danger' : 'warning'} />{row.before && <><Text style={styles.versionLabel}>Bản trước · lần gửi {previousRound.version}</Text><ApprovalQuestionCard question={row.before} number={row.before.orderIndex + 1} /></>}{row.after && <><Text style={styles.versionLabel}>Bản đang xem · lần gửi {selectedRound?.version}</Text><ApprovalQuestionCard question={row.after} number={row.after.orderIndex + 1} /></>}</View>)}
        {!visibleDiffRows.length && <Text style={styles.hint}>Không có thay đổi thuộc bộ lọc này.</Text>}
      </SectionCard>}
    </BackToTopScrollView>
    {!readOnly && tab === 'current' && <View style={styles.actions}><Pressable disabled={busy} onPress={() => Alert.alert('Yêu cầu sửa đề', 'Gửi các góp ý hiện tại?', [{ text: 'Hủy', style: 'cancel' }, { text: 'Gửi yêu cầu', onPress: () => void decide('revision') }])} style={[styles.button, styles.revision]}><Text style={styles.revisionText}>Yêu cầu sửa</Text></Pressable><Pressable disabled={busy} onPress={() => Alert.alert('Duyệt đề thi', 'Xác nhận duyệt đề này?', [{ text: 'Hủy', style: 'cancel' }, { text: 'Duyệt đề', onPress: () => void decide('approve') }])} style={[styles.button, styles.approve]}><Text style={styles.approveText}>Duyệt chuyên môn</Text></Pressable></View>}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, scroll: { flex: 1 }, content: { padding: 16, paddingBottom: 48 }, line: { color: '#475569', fontSize: 13, lineHeight: 21 }, muted: { color: '#64748b', fontSize: 12 }, reviewer: { color: '#047857', fontWeight: '700', fontSize: 13, marginTop: 5 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }, tabs: { flexDirection: 'row', padding: 3, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 }, tab: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, activeTab: { backgroundColor: '#2563eb' }, tabText: { color: '#475569', fontWeight: '700' }, activeText: { color: '#fff' }, feedback: { marginTop: 10, padding: 12, borderRadius: 10, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d' }, feedbackTitle: { color: '#92400e', fontWeight: '700', fontSize: 12 }, feedbackText: { color: '#78350f', marginTop: 4, lineHeight: 19 }, hint: { color: '#64748b', fontSize: 12, marginTop: 10 }, optional: { color: '#64748b', fontSize: 11 }, generalInput: { minHeight: 90, borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, backgroundColor: '#fffbeb', padding: 10, color: '#0f172a' }, actions: { flexDirection: 'row', gap: 10, padding: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' }, button: { flex: 1, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, revision: { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3' }, approve: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' }, revisionText: { color: '#be123c', fontWeight: '700' }, approveText: { color: '#047857', fontWeight: '700' },
  summary: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 8 }, summaryText: { flex: 1, textAlign: 'center', color: '#1e40af', backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 8, fontSize: 12, fontWeight: '700' }, filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }, filter: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }, filterActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, filterText: { color: '#475569', fontSize: 12, fontWeight: '700' }, filterActiveText: { color: '#fff' }, diffBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0' }, versionLabel: { color: '#334155', fontWeight: '700', fontSize: 12, marginTop: 8, marginBottom: 4 },
})
