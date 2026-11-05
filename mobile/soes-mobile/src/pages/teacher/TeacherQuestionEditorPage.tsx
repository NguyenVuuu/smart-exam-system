import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { createQuestion, listQuestionSubjects, updateQuestion } from '../../api/teacher-questions.api'
import { QuestionForm } from '../../components/teacher/question-bank/QuestionForm'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import type { ObjectiveQuestionPayload, QuestionSubject, TeacherQuestion } from '../../types/teacher-questions.types'

interface Props { initial: TeacherQuestion | null; onDone: () => void; onCancel: () => void }

export function TeacherQuestionEditorPage({ initial, onDone, onCancel }: Props) {
  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  async function reload() {
    setLoading(true)
    try { setSubjects(await listQuestionSubjects()); setError(false) }
    catch { setError(true) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    let active = true
    listQuestionSubjects().then((items) => { if (active) setSubjects(items) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function save(payload: ObjectiveQuestionPayload) {
    if (busy) return
    setBusy(true)
    try {
      if (initial) await updateQuestion(initial.id, payload)
      else await createQuestion(payload)
      Alert.alert('Thành công', initial ? 'Đã cập nhật câu hỏi.' : 'Đã tạo câu hỏi.')
      onDone()
    } catch { Alert.alert('Không thể lưu', 'Dữ liệu có thể đã thay đổi hoặc chưa đạt yêu cầu. Vui lòng kiểm tra lại.') }
    finally { setBusy(false) }
  }
  if (loading) return <ScreenState kind="loading" />
  if (error) return <ScreenState kind="error" onRetry={() => void reload()} />
  return <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenHeader title={initial ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi trắc nghiệm'} description="Câu hỏi được lưu trong ngân hàng cá nhân" />
    <QuestionForm key={initial?.id ?? 'new'} initial={initial} subjects={subjects} busy={busy}
      onSave={(payload) => { void save(payload) }} onCancel={onCancel} />
  </ScrollView>
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { padding: 16, paddingBottom: 32 } })
