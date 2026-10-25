import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getApiErrorMessage, getApiFieldErrors, type ApiFieldErrors } from '../../../api/errors'
import type { WizardStepId } from '../constants/ExamEditorConfig'
import { examTypeLabel } from '../constants/ExamEditorConfig'
import type {
  Exam,
  ExamCategory,
  ExamQuestionItem,
  ExamSection,
  ExamType,
} from '../types/teacher-exam.types'
import type { CourseOffering } from '../types/teacher-course.types'
import type { Question } from '../types/teacher-question-bank.types'
import {
  arePointTotalsEqual,
  balanceQuestionPointsBySection,
  buildInitialSections,
  inferSectionId,
  isQuestionAllowedForExam,
  normalizePoint,
  orderQuestionsBySection,
  splitPointsPrecisely,
  sumPointsPrecisely,
} from '../utils/ExamEditorUtils'
import { POSITIVE_INTEGER_REGEX } from '../utils/teacherValidation.utils'
import * as examApi from '../api/teacher-exams.api'
import type { TeacherExamQuestionInput } from '../api/teacher-exams.api'

const toExamQuestionInput = (item: ExamQuestionItem): TeacherExamQuestionInput => {
  const placement = { points: normalizePoint(item.points), sectionId: item.sectionId }
  if (item.sourceQuestionId) {
    return { ...placement, source: 'QUESTION_BANK', questionId: item.sourceQuestionId }
  }

  const question = item.question
  return {
    ...placement,
    source: 'INLINE',
    question: {
      title: question.title,
      content: question.content || question.title,
      explanation: question.explanation ?? null,
      type: question.type,
      difficulty: question.difficulty,
      language: question.programmingLanguage ?? null,
      options: (question.options ?? []).map(({ content, isCorrect }) => ({ content, isCorrect })),
      programmingConfig:
        question.type === 'PROGRAMMING'
          ? {
              timeLimitMs: question.timeLimitMs ?? 2000,
              memoryLimitMb: question.memoryLimitMb ?? 256,
              maxCodeSizeKb: question.maxCodeSizeKb ?? 256,
            }
          : null,
      testCases: (question.testCases ?? []).map(({ input, expectedOutput, isHidden }) => ({
        input,
        expectedOutput,
        isHidden,
      })),
    },
  }
}

interface UseTeacherExamEditorFormParams {
  sourceExam?: Exam | null
  isCopy: boolean
  openQuestions: boolean
  initialTypeFromUrl: ExamType
  courses: CourseOffering[]
  currentSemesterId?: string | null
}

export function useTeacherExamEditorForm({
  sourceExam,
  isCopy,
  openQuestions,
  initialTypeFromUrl,
  courses,
  currentSemesterId,
}: UseTeacherExamEditorFormParams) {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const initializedSourceId = useRef<string | null>(null)
  const persistedExamId = useRef<string | null>(null)
  const isSavingExam = useRef(false)

  const initialSections = buildInitialSections(initialTypeFromUrl)

  const [activeStep, setActiveStep] = useState<WizardStepId>(openQuestions ? 'QUESTIONS' : 'INFO')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [examCategory, setExamCategory] = useState<ExamCategory>('QUIZ')
  const [examType, setExamType] = useState<ExamType>(initialTypeFromUrl)
  const [subjectId, setSubjectId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [sections, setSections] = useState<ExamSection[]>(initialSections)
  const [activeSectionId, setActiveSectionId] = useState(initialSections[0].id)
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')
  const [targetTotalPoints, setTargetTotalPoints] = useState(10)
  const [questions, setQuestions] = useState<ExamQuestionItem[]>([])
  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<string[]>([])
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false)
  const [isAiPdfOpen, setIsAiPdfOpen] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      const entries = Object.entries(current).filter(([key]) => key !== field && !key.startsWith(`${field}.`))
      return entries.length === Object.keys(current).length ? current : Object.fromEntries(entries)
    })
  }

  useEffect(() => {
    if (!sourceExam || initializedSourceId.current === sourceExam.id) return
    const nextSections =
      sourceExam.sections?.map((section) => ({ ...section })) ?? buildInitialSections(sourceExam.type)
    initializedSourceId.current = sourceExam.id
    setTitle(`${isCopy ? 'Bản sao - ' : ''}${sourceExam.title}`)
    setDescription(sourceExam.description)
    setExamCategory(sourceExam.category ?? 'QUIZ')
    setExamType(sourceExam.type)
    setSubjectId(sourceExam.subjectId)
    setSemesterId(sourceExam.semesterId)
    setSections(nextSections)
    const firstFlaggedQuestion = sourceExam.questions.find((item) =>
      sourceExam.revisionFeedback?.some((feedback) => feedback.questionId === item.snapshotQuestionId),
    )
    setActiveSectionId(
      openQuestions && firstFlaggedQuestion?.sectionId ? firstFlaggedQuestion.sectionId : nextSections[0].id,
    )
    setDurationMinutes(sourceExam.defaultDurationMinutes)
    setTargetTotalPoints(sourceExam.totalPoints)
    setQuestions(
      sourceExam.questions.map((item) => ({
        ...item,
        question: { ...item.question },
      })),
    )
  }, [isCopy, openQuestions, sourceExam])

  const selectedSemesterId = semesterId || currentSemesterId || ''
  const semesterCourses = courses.filter((course) => course.semesterId === selectedSemesterId)
  const selectedSubjectId = semesterCourses.some((course) => course.subjectId === subjectId)
    ? subjectId
    : semesterCourses[0]?.subjectId ?? ''
  const selectedCourse = semesterCourses.find((course) => course.subjectId === selectedSubjectId)
  const selectedSubject = {
    subjectCode: selectedCourse?.subjectCode ?? '',
    subjectName: selectedCourse?.subjectName ?? 'Chưa chọn môn học',
  }
  const subjectOptions = Array.from(
    new Map(
      semesterCourses.map((course) => [
        course.subjectId,
        {
          value: course.subjectId,
          label: `${course.subjectCode} - ${course.subjectName}`,
        },
      ]),
    ).values(),
  )
  const totalPoints = sumPointsPrecisely(questions.map((item) => item.points))
  const visibleQuestions = questions.filter((item) => item.sectionId === activeSectionId)
  const revisionNotes = useMemo(
    () =>
      new Map(
        !isCopy && sourceExam?.status === 'REJECTED'
          ? sourceExam.revisionFeedback?.map(({ questionId, note }) => [questionId, note] as const) ?? []
          : [],
      ),
    [isCopy, sourceExam],
  )

  const sectionStats = useMemo(
    () =>
      sections.map((section) => {
        const sectionQuestions = questions.filter((item) => item.sectionId === section.id)
        return {
          ...section,
          questionCount: sectionQuestions.length,
          points: sumPointsPrecisely(sectionQuestions.map((item) => item.points)),
        }
      }),
    [questions, sections],
  )

  const updateTargetTotalPoints = (points: number) => {
    const normalizedPoints = normalizePoint(points)
    setTargetTotalPoints(normalizedPoints)
    const sectionPointList = splitPointsPrecisely(normalizedPoints, sections.length)
    const nextSections = sections.map((section, index) => ({
      ...section,
      targetPoints: sectionPointList[index],
    }))
    setSections(nextSections)
    setQuestions((prev) => balanceQuestionPointsBySection(prev, nextSections))
  }

  const updateExamType = (nextType: ExamType) => {
    const nextSections = buildInitialSections(nextType)
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('type', nextType)
        return nextParams
      },
      { replace: true },
    )
    setExamType(nextType)
    setSections(nextSections)
    setActiveSectionId(nextSections[0].id)
    setQuestions((prev) => {
      const nextQuestions = prev
        .filter((item) => isQuestionAllowedForExam(item.question, nextType))
        .map((item, idx) => ({
          ...item,
          order: idx + 1,
          sectionId: inferSectionId(item.question, nextSections),
        }))

      return balanceQuestionPointsBySection(nextQuestions, nextSections)
    })
  }

  const addQuestions = (selectedList: Question[], source: 'QUESTION_BANK' | 'INLINE') => {
    const allowedQuestions = selectedList.filter((q) => isQuestionAllowedForExam(q, examType))
    setQuestions((prev) => {
      const newItems: ExamQuestionItem[] = allowedQuestions.map((q, idx) => ({
        questionId: q.id,
        sourceQuestionId: source === 'QUESTION_BANK' ? q.id : null,
        question: q,
        points: 0,
        order: prev.length + idx + 1,
        sectionId: inferSectionId(q, sections),
      }))

      return balanceQuestionPointsBySection([...prev, ...newItems], sections)
    })
  }

  const toggleQuestionCollapse = (questionId: string) => {
    setCollapsedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  const handleSaveQuestion = (savedQ: Partial<Question>) => {
    if (editingQuestion) {
      setQuestions((prev) => {
        const nextQuestions = prev.map((item) =>
          item.questionId === editingQuestion.id
            ? {
                ...item,
                sourceQuestionId: null,
                question: { ...item.question, ...savedQ } as Question,
                sectionId: inferSectionId({ ...item.question, ...savedQ } as Question, sections),
              }
            : item,
        )

        return balanceQuestionPointsBySection(nextQuestions, sections)
      })
      setEditingQuestion(null)
      return
    }

    const newQuestion: Question = {
      id: `q-manual-${Date.now()}`,
      subjectId: savedQ.subjectId || 'sub-01',
      subjectName: savedQ.subjectName || 'Lập trình Java căn bản',
      teacherId: 'gv-01',
      teacherName: 'TS. Nguyễn Văn Giảng',
      bankScope: 'PERSONAL',
      reviewStatus: 'PRIVATE',
      type: savedQ.type || (examType === 'PROGRAMMING' ? 'PROGRAMMING' : 'SINGLE_CHOICE'),
      difficulty: savedQ.difficulty || 'EASY',
      title: savedQ.title || '',
      content: savedQ.content || '',
      explanation: savedQ.explanation,
      options: savedQ.options,
      programmingLanguage: savedQ.programmingLanguage,
      timeLimitMs: savedQ.timeLimitMs,
      memoryLimitMb: savedQ.memoryLimitMb,
      testCases: savedQ.testCases,
      createdAt: 'Vừa xong',
    }
    addQuestions([newQuestion], 'INLINE')
  }

  const handleAutoBalancePoints = () => {
    if (questions.length === 0) return
    setQuestions((prev) => balanceQuestionPointsBySection(prev, sections))
  }

  const validateExam = () => {
    if (title.trim().length < 5) {
      setFieldErrors({ title: 'Tên đề thi phải có ít nhất 5 ký tự.' })
      toast.error('Tên đề thi phải có ít nhất 5 ký tự.')
      setActiveStep('INFO')
      return false
    }
    if (!selectedSemesterId) {
      setFieldErrors({ semesterId: 'Vui lòng chọn học kỳ của đề thi.' })
      toast.error('Vui lòng chọn học kỳ của đề thi.')
      setActiveStep('INFO')
      return false
    }
    if (questions.length === 0) {
      setFieldErrors({ items: 'Đề thi phải có ít nhất một câu hỏi.' })
      toast.error('Bài thi cần có ít nhất một câu hỏi.')
      setActiveStep('QUESTIONS')
      return false
    }
    const normalizedTargetTotalPoints = normalizePoint(targetTotalPoints)
    const sectionTargetTotal = sumPointsPrecisely(sections.map((section) => section.targetPoints ?? 0))
    if (!arePointTotalsEqual(sectionTargetTotal, normalizedTargetTotalPoints)) {
      setFieldErrors({ sections: 'Tổng điểm các phần phải bằng tổng điểm mục tiêu.' })
      toast.error(
        `Tổng điểm các phần là ${sectionTargetTotal.toFixed(2)}, phải bằng ${normalizedTargetTotalPoints.toFixed(2)} điểm.`,
      )
      setActiveStep('SECTIONS')
      return false
    }
    if (!arePointTotalsEqual(totalPoints, normalizedTargetTotalPoints)) {
      setFieldErrors({ items: 'Tổng điểm câu hỏi phải bằng tổng điểm mục tiêu.' })
      toast.error(
        `Tổng điểm hiện tại là ${totalPoints.toFixed(2)}, phải bằng tổng điểm mục tiêu ${normalizedTargetTotalPoints.toFixed(2)}.`,
      )
      setActiveStep('QUESTIONS')
      return false
    }
    const durationStr = String(durationMinutes).trim()
    if (!durationStr || !POSITIVE_INTEGER_REGEX.test(durationStr) || Number(durationMinutes) <= 0) {
      setFieldErrors({ defaultDurationMinutes: 'Thời lượng làm bài phải là số nguyên dương lớn hơn 0 (phút).' })
      toast.error('Thời lượng làm bài phải là số nguyên dương lớn hơn 0.')
      setActiveStep('CONFIG')
      return false
    }
    if (!normalizedTargetTotalPoints || normalizedTargetTotalPoints <= 0) {
      setFieldErrors({ totalPoints: 'Tổng điểm mục tiêu phải lớn hơn 0.' })
      toast.error('Tổng điểm mục tiêu phải lớn hơn 0.')
      setActiveStep('CONFIG')
      return false
    }
    return true
  }

  const persistExam = async (submit: boolean) => {
    if (!validateExam()) return
    if (!selectedSubjectId) {
      setFieldErrors({ subjectId: 'Vui lòng chọn môn học.' })
      toast.error('Vui lòng chọn môn học.')
      setActiveStep('INFO')
      return
    }
    if (isSavingExam.current) return
    isSavingExam.current = true

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      subjectId: selectedSubjectId,
      semesterId: selectedSemesterId,
      type: examCategory,
      format: examType === 'MULTIPLE_CHOICE' ? ('OBJECTIVE' as const) : examType,
      creationMethod: sourceExam?.creationMethod ?? ('MANUAL' as const),
      defaultDurationMinutes: Number(durationMinutes),
      totalPoints: normalizePoint(targetTotalPoints),
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        type: section.type,
        targetPoints: normalizePoint(section.targetPoints ?? 0),
        orderIndex: section.order,
      })),
    }
    try {
      const editableExamId = !isCopy && sourceExam ? sourceExam.id : persistedExamId.current
      const saved = editableExamId
        ? await examApi.updateTeacherExam(editableExamId, payload)
        : await examApi.createTeacherExam(payload)
      persistedExamId.current = saved.id

      const orderedQuestions = orderQuestionsBySection(questions, sections)
      await examApi.replaceTeacherExamQuestions(saved.id, orderedQuestions.map(toExamQuestionInput))
      if (submit) await examApi.submitTeacherExam(saved.id)
      toast.success(
        submit
          ? examCategory === 'FINAL'
            ? 'Đã gửi đề thi cuối kỳ để duyệt.'
            : 'Đã hoàn tất đề thi.'
          : `Đã lưu nháp ${examTypeLabel[examType]} với ${questions.length} câu hỏi.`,
      )
      navigate('/teacher/exams')
    } catch (error) {
      const apiFieldErrors = getApiFieldErrors(error)
      setFieldErrors(apiFieldErrors)
      const firstField = Object.keys(apiFieldErrors)[0] ?? ''
      if (/^(title|description|subjectId|semesterId|type|format)/.test(firstField)) setActiveStep('INFO')
      else if (firstField.startsWith('sections')) setActiveStep('SECTIONS')
      else if (firstField.startsWith('items')) setActiveStep('QUESTIONS')
      else if (/^(defaultDurationMinutes|totalPoints)/.test(firstField)) setActiveStep('CONFIG')
      toast.error(
        Object.keys(apiFieldErrors).length
          ? 'Vui lòng kiểm tra các trường đang báo lỗi.'
          : getApiErrorMessage(error, 'Không thể lưu đề thi. Dữ liệu của bạn vẫn được giữ để thử lại.'),
      )
    } finally {
      isSavingExam.current = false
    }
  }

  return {
    // state
    activeStep,
    setActiveStep,
    title,
    setTitle,
    description,
    setDescription,
    examCategory,
    setExamCategory,
    examType,
    subjectId,
    setSubjectId,
    semesterId,
    setSemesterId,
    sections,
    setSections,
    activeSectionId,
    setActiveSectionId,
    durationMinutes,
    setDurationMinutes,
    targetTotalPoints,
    questions,
    setQuestions,
    collapsedQuestionIds,
    isBankPickerOpen,
    setIsBankPickerOpen,
    isAiPdfOpen,
    setIsAiPdfOpen,
    isEditorOpen,
    setIsEditorOpen,
    editingQuestion,
    setEditingQuestion,
    fieldErrors,
    // computed
    selectedSemesterId,
    selectedSubjectId,
    selectedSubject,
    subjectOptions,
    totalPoints,
    visibleQuestions,
    revisionNotes,
    sectionStats,
    // handlers
    clearFieldError,
    updateTargetTotalPoints,
    updateExamType,
    addQuestions,
    toggleQuestionCollapse,
    handleSaveQuestion,
    handleAutoBalancePoints,
    handleSaveDraft: () => {
      void persistExam(false)
    },
    handlePublishExam: () => {
      void persistExam(true)
    },
  }
}
