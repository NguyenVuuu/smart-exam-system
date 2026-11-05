import * as DocumentPicker from 'expo-document-picker'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { generateAiQuestions, listAiMaterials, saveAiQuestions, uploadAiSource } from '../api/teacher-ai.api'
import { listQuestionSubjects } from '../api/teacher-questions.api'
import type { AiGenerationResult, AiMaterial, AiSourceFile, GeneratedQuestion } from '../types/teacher-ai.types'
import type { Difficulty, QuestionSubject } from '../types/teacher-questions.types'

export function useTeacherAiGenerator() {
  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [materials, setMaterials] = useState<AiMaterial[]>([])
  const [materialIds, setMaterialIds] = useState<string[]>([])
  const [sourceType, setSourceType] = useState<'COURSE_MATERIAL' | 'UPLOAD_FILE'>('COURSE_MATERIAL')
  const [sourceFile, setSourceFile] = useState<AiSourceFile | null>(null)
  const [count, setCount] = useState('5')
  const [difficulty, setDifficulty] = useState<'AUTO' | Difficulty>('AUTO')
  const [prompt, setPrompt] = useState('')
  const [generation, setGeneration] = useState<AiGenerationResult | null>(null)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  async function reload() {
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
  async function chooseSubject(id: string) {
    setSubjectId(id); setMaterialIds([]); setMaterials([]); setSourceFile(null); setGeneration(null)
    try { setMaterials(await listAiMaterials(id)) }
    catch { Alert.alert('Không thể tải tài liệu', 'Vui lòng thử chọn lại môn học.') }
  }
  async function pickFile() {
    if (!subjectId || busy) return
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true,
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg', 'image/webp'] })
    if (result.canceled || !result.assets[0]) return
    setBusy(true)
    try { setSourceFile(await uploadAiSource(result.assets[0], subjectId)) }
    catch { Alert.alert('Không thể tải tệp', 'Chỉ dùng PDF, DOCX, TXT, PNG, JPEG hoặc WebP trong giới hạn máy chủ.') }
    finally { setBusy(false) }
  }
  function setSource(next: 'COURSE_MATERIAL' | 'UPLOAD_FILE') {
    setSourceType(next); setMaterialIds([]); setSourceFile(null)
  }
  function toggleMaterial(id: string) {
    setMaterialIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 10 ? [...current, id] : current)
  }
  async function generate() {
    const questionCount = Number(count)
    if (!subjectId || (sourceType === 'COURSE_MATERIAL' ? !materialIds.length : !sourceFile)) return Alert.alert('Thiếu nguồn', 'Chọn môn học và ít nhất một nguồn tài liệu.')
    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 10) return Alert.alert('Số câu chưa hợp lệ', 'Nhập từ 1 đến 10 câu cho mỗi lần sinh trên điện thoại.')
    if (busy) return
    setBusy(true)
    try {
      const result = await generateAiQuestions({ subjectId, sourceType, mode: 'GENERATE_FROM_MATERIAL',
        materialIds: sourceType === 'COURSE_MATERIAL' ? materialIds : [], sourceFiles: sourceType === 'UPLOAD_FILE' && sourceFile ? [sourceFile] : [],
        prompt: prompt.trim(), questionCount, difficulty, targetQuestionType: 'MULTIPLE_CHOICE' })
      const objective = result.questions.filter((question) => question.type !== 'PROGRAMMING')
      setGeneration(result); setQuestions(objective); setSelected([])
      if (objective.length !== result.questions.length) Alert.alert('Lưu ý', 'Một số câu lập trình đã được loại khỏi kết quả trên mobile.')
    } catch { Alert.alert('Sinh câu hỏi thất bại', 'Kiểm tra nguồn tài liệu hoặc thử lại sau.') }
    finally { setBusy(false) }
  }
  async function save() {
    const chosen = questions.filter((question) => selected.includes(question.id))
    if (!generation || !chosen.length || busy) return
    if (chosen.some((question) => question.title.trim().length < 3 || question.options.length < 2 || question.options.some((option) => !option.content.trim()) || !question.options.some((option) => option.isCorrect))) {
      Alert.alert('Câu hỏi chưa hợp lệ', 'Kiểm tra nội dung, phương án và đáp án đúng của các câu được chọn.'); return
    }
    setBusy(true)
    try {
      const result = await saveAiQuestions(generation.historyId, subjectId, chosen)
      Alert.alert('Đã lưu', `${result.count} câu hỏi đã được thêm vào ngân hàng cá nhân.`)
      clearResult()
    } catch { Alert.alert('Không thể lưu', 'Các câu được chọn có thể đã lưu hoặc dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.') }
    finally { setBusy(false) }
  }
  function clearResult() { setGeneration(null); setQuestions([]); setSelected([]) }
  function toggleSelected(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }
  function updateQuestion(next: GeneratedQuestion) { setQuestions((current) => current.map((item) => item.id === next.id ? next : item)) }
  return { subjects, subjectId, materials, materialIds, sourceType, sourceFile, count, difficulty, prompt,
    generation, questions, selected, loading, busy, error, reload, chooseSubject, pickFile, setSource,
    toggleMaterial, setCount, setDifficulty, setPrompt, generate, save, clearResult, toggleSelected, updateQuestion }
}
