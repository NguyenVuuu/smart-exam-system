import { BackToTopScrollView } from '../../components/ui/BackToTop'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { findAppealSubmission, getTeacherAppeal, gradeAppeal, updateTeacherAppeal } from '../../api/teacher-appeals.api'
import { getExam } from '../../api/teacher-exams.api'
import { AppealAnswerCard } from '../../components/teacher/appeals/AppealAnswerCard'
import { appealStatusLabels } from '../../components/teacher/appeals/AppealCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SectionCard } from '../../components/ui/SectionCard'
import type { TeacherAppeal, TeacherSubmission } from '../../types/teacher-appeals.types'
import type { ExamDetail } from '../../types/teacher-exams.types'

async function fetchAppealDetail(id: string) {
  const appeal = await getTeacherAppeal(id)
  const [exam, submission] = await Promise.all([getExam(appeal.exam.examId), findAppealSubmission(appeal)])
  return { appeal, exam, submission }
}

export function TeacherAppealDetailPage({ id }: { id: string }) {
  const [appeal, setAppeal] = useState<TeacherAppeal | null>(null)
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [submission, setSubmission] = useState<TeacherSubmission | null>(null)
  const [score, setScore] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchAppealDetail(id)
      setAppeal(result.appeal); setExam(result.exam); setSubmission(result.submission)
      setScore(String(result.submission.manualScoreOverride ?? result.submission.finalScore ?? result.submission.autoScore ?? 0))
      setReply(result.appeal.teacherReply ?? ''); setError(false)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => {
    let active = true
    fetchAppealDetail(id).then((result) => {
      if (!active) return
      setAppeal(result.appeal); setExam(result.exam); setSubmission(result.submission)
      setScore(String(result.submission.manualScoreOverride ?? result.submission.finalScore ?? result.submission.autoScore ?? 0))
      setReply(result.appeal.teacherReply ?? ''); setError(false)
    }).catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  async function act(action: 'review' | 'reject' | 'grade') {
    if (!appeal || busy) return
    const reason = reply.trim()
    const nextScore = Number(score.replace(',', '.'))
    if (action !== 'review' && reason.length < 5) {
      Alert.alert('Thiếu kết luận', 'Vui lòng nhập kết luận ít nhất 5 ký tự.'); return
    }
    if (action === 'grade' && (!Number.isFinite(nextScore) || score.trim() === '' || nextScore < 0 || nextScore > appeal.exam.maxScore)) {
      Alert.alert('Điểm không hợp lệ', `Điểm phải từ 0 đến ${appeal.exam.maxScore}.`); return
    }
    setBusy(true)
    try {
      if (action === 'grade') await gradeAppeal(appeal, nextScore, reason)
      else await updateTeacherAppeal(id, action === 'review' ? 'IN_REVIEW' : 'REJECTED', action === 'review' ? undefined : reason)
      Alert.alert('Đã lưu', action === 'grade' ? 'Kết quả phúc khảo đã được cập nhật.' : action === 'reject' ? 'Đã từ chối yêu cầu.' : 'Đã đánh dấu đang xem xét.')
      if (action === 'review') await load()
      else router.back()
    } catch { Alert.alert('Không thể xử lý', 'Yêu cầu có thể đã được xử lý hoặc quyền truy cập đã thay đổi.'); void load() }
    finally { setBusy(false) }
  }

  if (loading && !appeal) return <ScreenState kind="loading" />
  if (error && !appeal) return <ScreenState kind="error" onRetry={() => void load()} />
  if (!appeal || !exam || !submission) return <ScreenState kind="empty" />
  const editable = appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW'

  return <BackToTopScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
    automaticallyAdjustKeyboardInsets>
    <ScreenHeader showBack title="Phúc khảo điểm" description={`${appeal.student.fullName} · ${appeal.student.studentCode}`} />
    <SectionCard title={appeal.exam.title}>
      <Text style={styles.line}>{appeal.exam.scheduleTitle} · {appealStatusLabels[appeal.status]}</Text>
      <Text style={styles.line}>Điểm tự động: {submission.autoScore ?? '—'} · Điểm hiện tại: {submission.finalScore ?? '—'} / {appeal.exam.maxScore}</Text>
      <Text style={styles.label}>Lý do sinh viên</Text><Text style={styles.line}>{appeal.reason}</Text>
    </SectionCard>
    <Text style={styles.heading}>Bài làm đã nộp</Text>
    {[...exam.questions].sort((a, b) => a.orderIndex - b.orderIndex).map((question, index) =>
      <AppealAnswerCard key={question.id} question={question} number={index + 1} submission={submission} />)}
    <SectionCard title="Kết luận phúc khảo">
      <Text style={styles.label}>Điểm sau phúc khảo</Text>
      <TextInput accessibilityLabel="Điểm sau phúc khảo" editable={editable} keyboardType="decimal-pad" value={score}
        onChangeText={setScore} style={styles.input} />
      <Text style={styles.label}>Kết luận chấm lại</Text>
      <TextInput accessibilityLabel="Kết luận chấm lại" editable={editable} multiline value={reply} onChangeText={setReply}
        placeholder="Nêu kết quả kiểm tra và lý do điều chỉnh điểm" style={[styles.input, styles.textarea]} />
      {editable ? <>
        {appeal.status === 'PENDING' && <Action label="Đánh dấu đang xem xét" disabled={busy} onPress={() => void act('review')} />}
        <View style={styles.actions}>
          <Action label="Từ chối" disabled={busy} secondary onPress={() => Alert.alert('Từ chối phúc khảo', 'Xác nhận từ chối yêu cầu?', [
            { text: 'Hủy', style: 'cancel' }, { text: 'Từ chối', onPress: () => void act('reject') },
          ])} />
          <Action label="Lưu kết quả" disabled={busy} onPress={() => Alert.alert('Lưu kết quả phúc khảo', 'Xác nhận điểm và kết luận đã nhập?', [
            { text: 'Hủy', style: 'cancel' }, { text: 'Lưu', onPress: () => void act('grade') },
          ])} />
        </View>
      </> : <Text style={styles.line}>Yêu cầu đã hoàn tất và được lưu trong lịch sử.</Text>}
    </SectionCard>
  </BackToTopScrollView>
}

function Action({ label, disabled, secondary = false, onPress }: { label: string; disabled: boolean; secondary?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
  </Pressable>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 16, paddingBottom: 48 },
  line: { color: '#475569', fontSize: 13, lineHeight: 20, marginBottom: 5 },
  label: { color: '#334155', fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 7 },
  heading: { color: '#0f172a', fontSize: 17, fontWeight: '800', marginBottom: 12 },
  input: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', padding: 12, color: '#0f172a' },
  textarea: { minHeight: 100, textAlignVertical: 'top' }, actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#2563eb', marginTop: 12, paddingHorizontal: 10 },
  secondary: { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 }, secondaryText: { color: '#be123c' }, disabled: { opacity: 0.5 },
})
