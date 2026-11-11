import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Modal, Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Eye, FileText, Hourglass, Lightbulb, LockKeyhole, Ban, X } from 'lucide-react-native'
import { useRequireAuth } from '../../../../../../../src/hooks/useRequireAuth'
import {
  getAttemptStatus, getAttemptResult, listGradeAppeals, createGradeAppeal,
  type AttemptStatus, type AttemptResult, type GradeAppeal, type AttemptReviewItem,
} from '../../../../../../../src/api/student-take-exam.api'
import StudentLayout from '../../../../../../../src/components/student/StudentLayout'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDT(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function fmtDuration(start: string | null, end: string | null) {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (isNaN(ms) || ms < 0) return '—'
  return `${Math.floor(ms / 60000)} phút ${Math.floor((ms % 60000) / 1000)} giây`
}

function fmtScore(s: number) { return Number.isInteger(s) ? String(s) : s.toFixed(1) }

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'Đang làm', SUBMITTED: 'Đã nộp', AUTO_SUBMITTED: 'Tự động nộp',
  GRADING: 'Đang chấm', GRADED: 'Đã chấm', PUBLISHED: 'Đã công bố',
  EXPIRED: 'Hết thời gian', INVALIDATED: 'Bị hủy',
}
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  PUBLISHED: { bg: '#dcfce7', color: '#16a34a' },
  GRADED:    { bg: '#dcfce7', color: '#16a34a' },
  GRADING:   { bg: '#fef9c3', color: '#92400e' },
  SUBMITTED: { bg: '#eff6ff', color: '#1d4ed8' },
  AUTO_SUBMITTED: { bg: '#eff6ff', color: '#1d4ed8' },
  EXPIRED:   { bg: '#fef2f2', color: '#dc2626' },
  INVALIDATED: { bg: '#fef2f2', color: '#dc2626' },
}

const APPEAL_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý', IN_REVIEW: 'Đang xem xét', RESOLVED: 'Đã giải quyết', REJECTED: 'Bị từ chối',
}
const APPEAL_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: '#fef9c3', color: '#92400e' },
  IN_REVIEW: { bg: '#eff6ff', color: '#1d4ed8' },
  RESOLVED:  { bg: '#dcfce7', color: '#16a34a' },
  REJECTED:  { bg: '#fef2f2', color: '#dc2626' },
}

const ADJ_LABEL: Record<string, string> = {
  SYSTEM_ERROR: 'Hệ thống chấm sai', VIOLATION: 'Gian lận', MANUAL_REVIEW: 'Chấm tay',
  GRADE_APPEAL: 'Phúc khảo', OTHER: 'Lý do khác',
}

function scoreColor(s: number) {
  if (s >= 8) return '#16a34a'
  if (s >= 5) return '#ca8a04'
  return '#dc2626'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flex: 1, minWidth: 140, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
      <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={2}>{value}</Text>
      {sub ? <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</Text> : null}
    </View>
  )
}

function ReviewQuestion({ item }: { item: AttemptReviewItem }) {
  const isCorrect = item.isCorrect
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {isCorrect === true ? <CircleCheck size={14} color="#16a34a" /> : isCorrect === false ? <CircleX size={14} color="#dc2626" /> : <FileText size={14} color="#64748b" />}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Câu {item.orderIndex}</Text>
        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{item.points} điểm</Text>
        {item.score !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><ArrowRight size={11} color={scoreColor(item.score)} /><Text style={{ fontSize: 11, color: scoreColor(item.score) }}>{fmtScore(item.score)} đ</Text></View>
        )}
      </View>
      <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 20, marginBottom: 10 }}>{item.content}</Text>

      {item.type === 'PROGRAMMING' ? (
        <View style={{ backgroundColor: '#0f172a', borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: '600' }}>Mã nguồn đã nộp</Text>
          <Text style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'monospace', lineHeight: 18 }}>
            {item.draftSourceCode?.trim() || 'Chưa nộp mã nguồn.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {(item.options ?? []).map(opt => {
            const selected = item.selectedOptionIds?.includes(opt.id) ?? false
            const isCorrectOpt = opt.isCorrect
            let bg = '#f8fafc', border = '#e2e8f0', color = '#475569'
            if (isCorrectOpt) { bg = '#f0fdf4'; border = '#86efac'; color = '#166534' }
            else if (selected) { bg = '#eff6ff'; border = '#93c5fd'; color = '#1d4ed8' }
            return (
              <View key={opt.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, color, flex: 1 }}>{opt.content}</Text>
                {isCorrectOpt && <Text style={{ fontSize: 11, color: '#166534', fontWeight: '700' }}>Đúng</Text>}
                {!isCorrectOpt && selected && <Text style={{ fontSize: 11, color: '#1d4ed8', fontWeight: '700' }}>Đã chọn</Text>}
              </View>
            )
          })}
        </View>
      )}
      {item.explanation && (
        <View style={{ flexDirection: 'row', gap: 6, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <Lightbulb size={13} color="#92400e" />
          <Text style={{ flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 }}>{item.explanation}</Text>
        </View>
      )}
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ExamResultScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const { courseOfferingId, scheduleId, attemptId: qAttemptId } = useLocalSearchParams<{
    courseOfferingId: string; scheduleId: string; attemptId?: string
  }>()

  const [status, setStatus] = useState<AttemptStatus | null>(null)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [appeals, setAppeals] = useState<GradeAppeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Appeal form
  const [appealReason, setAppealReason] = useState('')
  const [submittingAppeal, setSubmittingAppeal] = useState(false)

  // Score adjustments modal
  const [showAdjModal, setShowAdjModal] = useState(false)

  const attemptId = qAttemptId ?? ''

  const loadData = useCallback(async () => {
    if (!scheduleId || !attemptId) return
    setLoading(true); setError(null)
    try {
      const [s, r, a] = await Promise.all([
        getAttemptStatus(scheduleId, attemptId),
        getAttemptResult(scheduleId, attemptId),
        listGradeAppeals(scheduleId, attemptId),
      ])
      setStatus(s); setResult(r); setAppeals(a)
    } catch {
      setError('Không thể tải kết quả bài thi.')
    } finally {
      setLoading(false)
    }
  }, [scheduleId, attemptId])

  useEffect(() => { void loadData() }, [loadData])

  const hasAnyAppeal = appeals.length > 0
  const hasOpenAppeal = useMemo(() => appeals.some(a => a.status === 'PENDING' || a.status === 'IN_REVIEW'), [appeals])

  const handleSubmitAppeal = async () => {
    if (hasAnyAppeal) { Alert.alert('Lưu ý', 'Mỗi bài thi chỉ được gửi phúc khảo một lần.'); return }
    if (appealReason.trim().length < 10) { Alert.alert('Lưu ý', 'Vui lòng nhập lý do phúc khảo ít nhất 10 ký tự.'); return }
    setSubmittingAppeal(true)
    try {
      const created = await createGradeAppeal(scheduleId, attemptId, appealReason.trim())
      setAppeals(prev => [created, ...prev])
      setAppealReason('')
      Alert.alert('Thành công', 'Đã gửi yêu cầu phúc khảo.')
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        await listGradeAppeals(scheduleId, attemptId).then(setAppeals).catch(() => {})
        Alert.alert('Thông báo', 'Yêu cầu phúc khảo đã được ghi nhận trước đó.')
      } else {
        Alert.alert('Lỗi', 'Không thể gửi phúc khảo. Vui lòng thử lại.')
      }
    } finally {
      setSubmittingAppeal(false)
    }
  }

  if (!isInitialized || !isAuthenticated) return null

  const statusCfg = status ? (STATUS_COLOR[status.status] ?? { bg: '#f1f5f9', color: '#475569' }) : null

  return (
    <StudentLayout activeRoute="scores">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <ArrowLeft size={16} color="#64748b" />
            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>Quay lại</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 60 }} />}
          {error && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: '#ef4444', marginBottom: 12 }}>{error}</Text>
              <TouchableOpacity onPress={loadData} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2563eb', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && status && result && (
            <>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Kết quả bài thi</Text>
                {statusCfg && (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: statusCfg.bg }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: statusCfg.color }}>{STATUS_LABEL[status.status] ?? status.status}</Text>
                  </View>
                )}
              </View>

              {/* Score card */}
              {result.available ? (
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#d1fae5', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }}>
                  <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 }}>Điểm bài thi</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 40, fontWeight: '900', color: result.score !== null ? scoreColor(result.score) : '#94a3b8' }}>
                      {result.score !== null ? fmtScore(result.score) : '—'}
                      <Text style={{ fontSize: 20, color: '#94a3b8', fontWeight: '400' }}>/{result.maxScore}</Text>
                    </Text>
                    {result.scoreAdjustments.length > 0 && (
                      <TouchableOpacity onPress={() => setShowAdjModal(true)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eff6ff', borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#2563eb' }}>Lịch sử điểm ({result.scoreAdjustments.length})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#bfdbfe' }}>
                  {result.reason === 'GRADING' ? <Hourglass size={15} color="#1d4ed8" /> : result.reason === 'PENDING_RELEASE' ? <LockKeyhole size={15} color="#1d4ed8" /> : <Ban size={15} color="#1d4ed8" />}
                  <Text style={{ fontSize: 13, color: '#1d4ed8', lineHeight: 20 }}>
                    {result.reason === 'GRADING' && 'Bài làm đang được chấm điểm...'}
                    {result.reason === 'PENDING_RELEASE' && `Điểm chưa được công bố${result.releaseAt ? ` - dự kiến ${fmtDT(result.releaseAt)}` : ''}.`}
                    {result.reason === 'NEVER' && 'Ca thi này không công bố điểm cho sinh viên.'}
                  </Text>
                </View>
              )}

              {/* Summary cards */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <SummaryCard label="Số câu đã làm" value={`${status.answeredCount}/${status.totalQuestionCount}`} />
                <SummaryCard label="Thời gian làm" value={fmtDuration(status.startedAt, status.submittedAt)} />
                <SummaryCard label="Nộp lúc" value={fmtDT(status.submittedAt)} />
                <SummaryCard label="Kết thúc bởi" value={status.endedBy === 'STUDENT' ? 'Sinh viên' : status.endedBy === 'TIMEOUT' ? 'Hết giờ' : status.endedBy === 'SYSTEM' ? 'Hệ thống' : '—'} />
              </View>

              {/* Review section */}
              {result.available && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>Chi tiết bài làm</Text>
                  {(result.reviewPolicy === 'NONE' || result.reviewPolicy === 'SCORE_ONLY') && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      {result.reviewPolicy === 'SCORE_ONLY' ? <Eye size={14} color="#64748b" /> : <LockKeyhole size={14} color="#64748b" />}
                      <Text style={{ fontSize: 13, color: '#64748b' }}>
                        {result.reviewPolicy === 'SCORE_ONLY' ? 'Ca thi chỉ cho phép xem điểm tổng.' : 'Ca thi không cho phép xem lại bài làm.'}
                      </Text>
                    </View>
                  )}
                  {!result.reviewAvailable && result.reviewAvailableAt && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fef9c3', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a' }}>
                      <Hourglass size={14} color="#92400e" />
                      <Text style={{ fontSize: 13, color: '#92400e' }}>Xem lại bài mở lúc {fmtDT(result.reviewAvailableAt)}</Text>
                    </View>
                  )}
                  {result.reviewAvailable && result.reviewItems.length > 0 && (
                    result.reviewItems.map(item => <ReviewQuestion key={item.questionId} item={item} />)
                  )}
                </View>
              )}

              {/* Grade Appeal section */}
              {result.available && (
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>Phúc khảo điểm</Text>
                    {hasOpenAppeal && (
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#fef9c3' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e' }}>⏳ Đang xử lý</Text>
                      </View>
                    )}
                  </View>

                  {/* Existing appeals */}
                  {appeals.map(appeal => {
                    const cfg = APPEAL_STATUS_COLOR[appeal.status] ?? { bg: '#f1f5f9', color: '#475569' }
                    return (
                      <View key={appeal.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: cfg.bg }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{APPEAL_STATUS_LABEL[appeal.status]}</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDT(appeal.createdAt)}</Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 3 }}>Lý do:</Text>
                        <Text style={{ fontSize: 13, color: '#1e293b', lineHeight: 20 }}>{appeal.reason}</Text>
                        {appeal.teacherReply && (
                          <View style={{ marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#86efac' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534', marginBottom: 3 }}>Phản hồi từ giảng viên:</Text>
                            <Text style={{ fontSize: 13, color: '#166534', lineHeight: 20 }}>{appeal.teacherReply}</Text>
                          </View>
                        )}
                      </View>
                    )
                  })}

                  {/* Submit form */}
                  {!hasAnyAppeal && (
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
                      <Text style={{ fontSize: 13, color: '#475569', marginBottom: 10 }}>
                        Nếu bạn không đồng ý với điểm số, hãy gửi yêu cầu phúc khảo. Mỗi bài thi chỉ được gửi một lần.
                      </Text>
                      <TextInput
                        style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 13, color: '#0f172a', minHeight: 100, textAlignVertical: 'top', marginBottom: 10 }}
                        placeholder="Nhập lý do phúc khảo (tối thiểu 10 ký tự)..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        value={appealReason}
                        onChangeText={setAppealReason}
                      />
                      <TouchableOpacity
                        onPress={handleSubmitAppeal}
                        disabled={submittingAppeal || appealReason.trim().length < 10}
                        style={{ paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: submittingAppeal || appealReason.trim().length < 10 ? '#93c5fd' : '#2563eb' }}
                      >
                        {submittingAppeal
                          ? <ActivityIndicator color="#fff" />
                          : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Gửi yêu cầu phúc khảo</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>

      {/* Score Adjustments Modal */}
      <Modal visible={showAdjModal} animationType="slide" transparent onRequestClose={() => setShowAdjModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Lịch sử điều chỉnh điểm</Text>
              <TouchableOpacity onPress={() => setShowAdjModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {result?.scoreAdjustments.map(adj => (
                <View key={adj.id} style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>{ADJ_LABEL[adj.adjustmentType] ?? adj.adjustmentType}</Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDT(adj.adjustedAt)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: '700' }}>{fmtScore(adj.previousScore)}</Text>
                    <ArrowRight size={13} color="#94a3b8" />
                    <Text style={{ fontSize: 13, color: '#16a34a', fontWeight: '700' }}>{fmtScore(adj.newScore)}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>{adj.reason}</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Bởi: {adj.adjustedBy}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </StudentLayout>
  )
}
