import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { TeacherTwoColumnLayout, TeacherTwoColumnMain } from './components/TeacherTwoColumnLayout'
import AutoExamConfigPanel from './components/auto-exam/AutoExamConfigPanel'
import AutoExamPageHeader from './components/auto-exam/AutoExamPageHeader'
import AutoExamSummarySidebar from './components/auto-exam/AutoExamSummarySidebar'
import GeneratedExamPreviewModal from './components/auto-exam/results/GeneratedExamPreviewModal'
import GeneratedExamResults from './components/auto-exam/results/GeneratedExamResults'
import AssignExamToCourseModal from './components/exam-detail/AssignExamToCourseModal'
import type {
  AutoExamDraftStatus,
  AutoExamPickMode,
  GeneratedExamDraft,
} from './types/teacher-auto-exam.types'
import type { ExamCategory } from './types/teacher-exam.types'
import { useTeacherCourses } from './hooks/useTeacherCourses'
import { useTeacherQuestions } from './hooks/useTeacherQuestions'
import { autoGenerateTeacherExam, createTeacherExamSchedule, deleteTeacherExam, submitTeacherExam } from './api/teacher-exams.api'
import { toTeacherSchedulePayload } from './mappers/teacher-exam.mapper'

const DEFAULT_SESSION_CONFIG = {
  maxAttempts: 1,
  password: '',
  resultReleaseMode: 'MANUAL' as const,
  resultReleaseAt: '2026-08-25T18:00',
  allowStudentReview: false,
  requireFullscreen: true,
  enableWebcam: true,
  blockCopyPaste: true,
  blockRightClick: true,
  ipMode: 'HOME' as const,
  allowedIpRange: '192.168.1.1 - 192.168.1.254',
}

export default function TeacherAutoExamMatrixPage() {
  const navigate = useNavigate()
  const { questions, subjects } = useTeacherQuestions()
  const { courses } = useTeacherCourses()
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [examTitle, setExamTitle] = useState('Đề thi Giữa Kỳ 1 • 2026')
  const [examCategory, setExamCategory] = useState<ExamCategory>('QUIZ')
  const [examFormat, setExamFormat] = useState<'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'>('OBJECTIVE')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [targetTotalPoints, setTargetTotalPoints] = useState(10)
  const [easyCount, setEasyCount] = useState(0)
  const [mediumCount, setMediumCount] = useState(0)
  const [hardCount, setHardCount] = useState(0)
  const [pickMode, setPickMode] = useState<AutoExamPickMode>('AUTO')
  const [questionSearch, setQuestionSearch] = useState('')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedExams, setGeneratedExams] = useState<GeneratedExamDraft[]>([])
  const [draftStatus, setDraftStatus] = useState<AutoExamDraftStatus>('NOT_GENERATED')
  const [previewExamCode, setPreviewExamCode] = useState<GeneratedExamDraft | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  const subjectOptions = useMemo(() => {
    const subjectsFromCourses = courses.map((course) => ({ id: course.subjectId, name: `${course.subjectName} (${course.subjectCode})` }))
    const combined = subjectsFromCourses.length ? subjectsFromCourses : subjects
    return Array.from(new Map(combined.map((subject) => [subject.id, subject])).values())
  }, [courses, subjects])

  const selectedSubject = selectedSubjectId || subjectOptions[0]?.id || ''

  const configuredQuestionCount = easyCount + mediumCount + hardCount
  const eligibleQuestions = questions.filter((question) => {
    if (question.subjectId !== selectedSubject || question.archivedAt) return false
    if (examFormat === 'OBJECTIVE') {
      return ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type)
    }
    if (examFormat === 'PROGRAMMING') {
      return question.type === 'PROGRAMMING'
    }
    return ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'PROGRAMMING'].includes(question.type)
  })

  const selectedQuestions = eligibleQuestions.filter((question) =>
    selectedQuestionIds.includes(question.id),
  )
  const totalQuestions = pickMode === 'MANUAL' ? selectedQuestions.length : configuredQuestionCount
  const filteredEligibleQuestions = eligibleQuestions.filter(
    (question) =>
      question.content.toLowerCase().includes(questionSearch.toLowerCase()) ||
      question.subjectName.toLowerCase().includes(questionSearch.toLowerCase()),
  )

  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value)
    setSelectedQuestionIds([])
    setGeneratedExams([])
    setDraftStatus('NOT_GENERATED')
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  const validateAutoQuestionCount = () => {
    if (configuredQuestionCount === 0) {
      toast.error('Vui lòng cấu hình số lượng câu hỏi theo độ khó trước khi sinh đề tự động.')
      return false
    }

    const availableEasy = eligibleQuestions.filter((q) => q.difficulty === 'EASY').length
    const availableMedium = eligibleQuestions.filter((q) => q.difficulty === 'MEDIUM').length
    const availableHard = eligibleQuestions.filter((q) => q.difficulty === 'HARD').length

    if (availableEasy < easyCount || availableMedium < mediumCount || availableHard < hardCount) {
      toast.error('Ngân hàng câu hỏi chưa đủ số câu trắc nghiệm/lập trình theo từng độ khó đã cấu hình. Vui lòng giảm số lượng hoặc bổ sung câu hỏi.')
      return false
    }

    return true
  }

  const handleGenerateExams = async () => {
    if (!examTitle.trim()) {
      toast.error('Vui lòng nhập tên bài thi trước khi sinh đề.')
      return
    }

    if (durationMinutes <= 0) {
      toast.error('Thời lượng làm bài phải lớn hơn 0.')
      return
    }

    if (targetTotalPoints <= 0) {
      toast.error('Tổng điểm mục tiêu phải lớn hơn 0.')
      return
    }

    const subjectCourse = courses.find((course) => course.subjectId === selectedSubject && course.semesterStatus === 'ACTIVE')
      ?? courses.find((course) => course.subjectId === selectedSubject)
    if (!selectedSubject || !subjectCourse?.semesterId) {
      toast.error('Không tìm thấy học kỳ/lớp học phần cho môn đã chọn.')
      return
    }

    if (pickMode === 'MANUAL' && selectedQuestionIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một câu hỏi từ ngân hàng trước khi sinh đề.')
      return
    }

    if (pickMode === 'AUTO' && !validateAutoQuestionCount()) return

    setIsGenerating(true)
    try {
      const exam = await autoGenerateTeacherExam({
        title: examTitle.trim(),
        description:
          examFormat === 'PROGRAMMING'
            ? 'Đề bài lập trình được sinh tự động từ ngân hàng câu hỏi.'
            : examFormat === 'MIXED'
            ? 'Đề thi hỗn hợp (trắc nghiệm và lập trình) được sinh tự động từ ngân hàng câu hỏi.'
            : 'Đề trắc nghiệm được sinh tự động từ ngân hàng câu hỏi và đã được giảng viên xem lại.',
        subjectId: selectedSubject,
        semesterId: subjectCourse.semesterId,
        type: examCategory,
        format: examFormat,
        defaultDurationMinutes: durationMinutes,
        totalPoints: targetTotalPoints,
        pickMode,
        sourceScope: 'BOTH',
        matrix: { easy: easyCount, medium: mediumCount, hard: hardCount },
        selectedQuestionIds: pickMode === 'MANUAL' ? selectedQuestionIds : [],
      })
      setGeneratedExams([{
        id: exam.id,
        easyCount: exam.questions.filter((question) => question.difficulty === 'EASY').length,
        mediumCount: exam.questions.filter((question) => question.difficulty === 'MEDIUM').length,
        hardCount: exam.questions.filter((question) => question.difficulty === 'HARD').length,
        totalPoints: exam.totalPoints,
        questionPoints: exam.questions.map((question) => question.points),
        questionIds: exam.questions.map((question) => question.sourceQuestionId ?? question.id),
        exam,
      }])
      setDraftStatus('SAVED_DRAFT')
      toast.success('Đã sinh và lưu đề nháp vào Quản lý đề thi.')
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message || error.message
        : error instanceof Error ? error.message : 'Không thể sinh đề tự động. Vui lòng thử lại.'
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = () => {
    if (generatedExams.length === 0) {
      toast.error('Vui lòng sinh đề trước khi mở bản nháp.')
      return
    }
    navigate(`/teacher/exams/${generatedExams[0].id}/edit`)
  }

  const handleOpenPublishModal = async () => {
    if (draftStatus !== 'SAVED_DRAFT') {
      toast.error('Vui lòng sinh đề nháp trước khi tạo ca thi.')
      return
    }

    if (examCategory === 'FINAL') {
      toast.info('Đề cuối kỳ cần được gửi Trưởng bộ môn duyệt trước khi Admin tạo ca thi.')
      navigate(`/teacher/exams/${generatedExams[0].id}/edit`)
      return
    }

    try {
      await submitTeacherExam(generatedExams[0].id)
      setIsAssignModalOpen(true)
    } catch {
      toast.error('Không thể công bố đề. Vui lòng mở bản nháp để kiểm tra lại.')
    }
  }

  const handleDeleteDraft = async () => {
    if (generatedExams.length === 0) return
    const draftId = generatedExams[0].id
    try {
      await deleteTeacherExam(draftId)
      setGeneratedExams([])
      setDraftStatus('NOT_GENERATED')
      toast.success('Đã xóa đề nháp vừa sinh.')
    } catch {
      toast.error('Không thể xóa đề nháp. Vui lòng thử lại.')
    }
  }

  const handleRegenerateExams = async () => {
    if (generatedExams.length > 0) {
      try {
        await deleteTeacherExam(generatedExams[0].id)
      } catch {
        toast.error('Không thể xóa đề nháp hiện tại để sinh lại. Vui lòng thử lại.')
        return
      }
    }
    await handleGenerateExams()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <AutoExamPageHeader onBackToExams={() => navigate('/teacher/exams')} />

          <TeacherTwoColumnLayout>
            <TeacherTwoColumnMain>
              <AutoExamConfigPanel
                examTitle={examTitle}
                setExamTitle={setExamTitle}
                examCategory={examCategory}
                setExamCategory={setExamCategory}
                examFormat={examFormat}
                setExamFormat={setExamFormat}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
                targetTotalPoints={targetTotalPoints}
                setTargetTotalPoints={setTargetTotalPoints}
                selectedSubject={selectedSubject}
                onSubjectChange={handleSubjectChange}
                subjectOptions={subjectOptions}
                draftStatus={draftStatus}
                eligibleQuestions={eligibleQuestions}
                filteredEligibleQuestions={filteredEligibleQuestions}
                selectedQuestionIds={selectedQuestionIds}
                selectedQuestions={selectedQuestions}
                pickMode={pickMode}
                setPickMode={setPickMode}
                questionSearch={questionSearch}
                setQuestionSearch={setQuestionSearch}
                toggleQuestionSelection={toggleQuestionSelection}
                easyCount={easyCount}
                setEasyCount={setEasyCount}
                mediumCount={mediumCount}
                setMediumCount={setMediumCount}
                hardCount={hardCount}
                setHardCount={setHardCount}
                isGenerating={isGenerating}
                totalQuestions={totalQuestions}
                onGenerate={handleGenerateExams}
              />
            </TeacherTwoColumnMain>

            <AutoExamSummarySidebar
              totalQuestions={totalQuestions}
              pickMode={pickMode}
              easyCount={easyCount}
              mediumCount={mediumCount}
              hardCount={hardCount}
              selectedQuestionCount={selectedQuestions.length}
              targetTotalPoints={targetTotalPoints}
              examFormat={examFormat}
            />
          </TeacherTwoColumnLayout>

          <GeneratedExamResults
            generatedExams={generatedExams}
            draftStatus={draftStatus}
            isGenerating={isGenerating}
            onSaveDraft={handleSaveDraft}
            onPublish={handleOpenPublishModal}
            onPreview={setPreviewExamCode}
            onRegenerate={handleRegenerateExams}
            onDeleteDraft={handleDeleteDraft}
          />
        </main>
      </div>

      <AssignExamToCourseModal
        isOpen={isAssignModalOpen}
        examId={generatedExams[0]?.id ?? 'generated-exam-draft'}
        subjectName={generatedExams[0]?.exam.subject.name ?? eligibleQuestions[0]?.subjectName ?? ''}
        courses={courses.filter(({ subjectId }) => subjectId === selectedSubject)}
        onClose={() => setIsAssignModalOpen(false)}
        examTitle={examTitle}
        defaultConfig={{
          durationMinutes,
          ...DEFAULT_SESSION_CONFIG,
          distributionMode: 'SHUFFLE_QUESTIONS_AND_OPTIONS',
        }}
        onCreateSessions={async (sessions) => {
          try {
            await Promise.all(sessions.map((session) =>
              createTeacherExamSchedule(generatedExams[0].id, toTeacherSchedulePayload(session)),
            ))
            toast.success('Đã tạo ca thi cho đề vừa sinh.')
            navigate(`/teacher/exams/${generatedExams[0].id}`)
          } catch {
            toast.error('Không thể tạo ca thi. Vui lòng kiểm tra thời gian, lớp và trạng thái đề.')
            throw new Error('Schedule save failed')
          }
        }}
      />

      <GeneratedExamPreviewModal
        examCode={previewExamCode}
        examTitle={examTitle}
        examCategory={examCategory}
        draftStatus={draftStatus}
        durationMinutes={durationMinutes}
        onClose={() => setPreviewExamCode(null)}
      />
    </div>
  )
}
