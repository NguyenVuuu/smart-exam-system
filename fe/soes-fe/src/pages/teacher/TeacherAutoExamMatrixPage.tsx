import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { splitPointsPrecisely } from './utils/ExamEditorUtils'
import type { Exam, ExamCategory } from './types/teacher-exam.types'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'
import { useAuthStore } from '../../store/authStore'
import { MOCK_TEACHER_COURSES } from './mock/teacher-course.mock'

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
  const questions = useTeacherWorkspaceStore((state) => state.questions)
  const upsertExam = useTeacherWorkspaceStore((state) => state.upsertExam)
  const replaceExamSchedules = useTeacherWorkspaceStore((state) => state.replaceExamSchedules)
  const exams = useTeacherWorkspaceStore((state) => state.exams)
  const currentUser = useAuthStore((state) => state.user)
  const [selectedSubject, setSelectedSubject] = useState('sub-01')
  const [examTitle, setExamTitle] = useState('Đề thi Giữa Kỳ 1 • 2026')
  const [examCategory, setExamCategory] = useState<ExamCategory>('QUIZ')
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

  const configuredQuestionCount = easyCount + mediumCount + hardCount
  const eligibleQuestions = questions.filter(
    (question) =>
      question.subjectId === selectedSubject &&
      ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type),
  )
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
    setSelectedSubject(value)
    setSelectedQuestionIds([])
    setGeneratedExams([])
    setDraftStatus('NOT_GENERATED')
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  const pickAutoQuestionIds = () => {
    const easyIds = eligibleQuestions.filter((q) => q.difficulty === 'EASY').slice(0, easyCount).map((q) => q.id)
    const mediumIds = eligibleQuestions.filter((q) => q.difficulty === 'MEDIUM').slice(0, mediumCount).map((q) => q.id)
    const hardIds = eligibleQuestions.filter((q) => q.difficulty === 'HARD').slice(0, hardCount).map((q) => q.id)

    return [...easyIds, ...mediumIds, ...hardIds]
  }

  const handleGenerateExams = () => {
    if (!examTitle.trim()) {
      alert('Vui lòng nhập tên bài thi trước khi sinh đề.')
      return
    }

    if (durationMinutes <= 0) {
      alert('Thời lượng làm bài phải lớn hơn 0.')
      return
    }

    if (targetTotalPoints <= 0) {
      alert('Tổng điểm mục tiêu phải lớn hơn 0.')
      return
    }

    if (pickMode === 'MANUAL' && selectedQuestionIds.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi từ ngân hàng trước khi sinh đề.')
      return
    }

    if (pickMode === 'AUTO' && !validateAutoQuestionCount()) return

    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      const generatedQuestionIds = pickMode === 'MANUAL' ? selectedQuestionIds : pickAutoQuestionIds()
      const questionPoints = splitPointsPrecisely(targetTotalPoints, generatedQuestionIds.length)
      const generatedDrafts: GeneratedExamDraft[] = [
        {
          id: `generated-exam-${Date.now()}`,
          easyCount,
          mediumCount,
          hardCount,
          totalPoints: targetTotalPoints,
          questionPoints,
          questionIds: generatedQuestionIds,
        },
      ]
      setGeneratedExams(generatedDrafts)
      setDraftStatus('GENERATED')
    }, 1000)
  }

  const validateAutoQuestionCount = () => {
    if (configuredQuestionCount === 0) {
      alert('Vui lòng cấu hình số lượng câu hỏi theo độ khó trước khi sinh đề tự động.')
      return false
    }

    const availableEasy = eligibleQuestions.filter((q) => q.difficulty === 'EASY').length
    const availableMedium = eligibleQuestions.filter((q) => q.difficulty === 'MEDIUM').length
    const availableHard = eligibleQuestions.filter((q) => q.difficulty === 'HARD').length

    if (availableEasy < easyCount || availableMedium < mediumCount || availableHard < hardCount) {
      alert('Ngân hàng câu hỏi chưa đủ số câu trắc nghiệm theo từng độ khó đã cấu hình. Vui lòng giảm số lượng hoặc bổ sung câu hỏi.')
      return false
    }

    return true
  }

  const handleSaveDraft = () => {
    if (generatedExams.length === 0) {
      alert('Vui lòng sinh đề trước khi lưu nháp.')
      return
    }

    const generated = generatedExams[0]
    const selectedQuestions = generated.questionIds
      .map((questionId) => questions.find((question) => question.id === questionId))
      .filter((question): question is NonNullable<typeof question> => Boolean(question))
    const subject = selectedQuestions[0] ?? questions.find((question) => question.subjectId === selectedSubject)
    if (!subject) return
    const subjectCourse = MOCK_TEACHER_COURSES.find((course) => course.subjectId === subject.subjectId)

    const exam: Exam = {
      id: generated.id,
      authorId: currentUser?.profileId ?? 'gv-01',
      authorName: currentUser?.fullName ?? 'Nguyễn Văn An',
      subjectId: subject.subjectId,
      subjectCode: subjectCourse?.subjectCode ?? subject.subjectId.toUpperCase(),
      subjectName: subject.subjectName,
      title: examTitle.trim(),
      description: 'Đề trắc nghiệm được sinh tự động từ ngân hàng câu hỏi và đã được giảng viên xem lại.',
      category: examCategory,
      type: 'MULTIPLE_CHOICE',
      creationMethod: 'QUESTION_BANK',
      status: 'DRAFT',
      studentVisibility: 'HIDDEN',
      defaultDurationMinutes: durationMinutes,
      sections: [{ id: 'sec-objective', title: 'Phần 1: Trắc nghiệm', type: 'OBJECTIVE', targetPoints: targetTotalPoints, order: 1 }],
      schedules: [],
      questions: selectedQuestions.map((question, index) => ({
        questionId: question.id,
        question,
        points: generated.questionPoints[index] ?? 0,
        order: index + 1,
        sectionId: 'sec-objective',
      })),
      totalPoints: targetTotalPoints,
      createdAt: new Date().toISOString(),
    }
    upsertExam(exam)
    setDraftStatus('SAVED_DRAFT')
    toast.success('Đã lưu đề nháp vào Quản lý đề thi.')
  }

  const handleOpenPublishModal = () => {
    if (draftStatus !== 'SAVED_DRAFT') {
      alert('Vui lòng lưu nháp đề trước khi tạo ca thi.')
      return
    }

    if (examCategory === 'FINAL') {
      toast.info('Đề cuối kỳ cần được gửi Trưởng bộ môn duyệt trước khi Admin tạo ca thi.')
      navigate(`/teacher/exams/${generatedExams[0].id}/edit`)
      return
    }

    const savedExam = exams.find((exam) => exam.id === generatedExams[0].id)
    if (savedExam) upsertExam({ ...savedExam, status: 'PUBLISHED', studentVisibility: 'VISIBLE' })
    setIsAssignModalOpen(true)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <AutoExamPageHeader onBackToExams={() => navigate('/teacher/exams')} />

          <TeacherTwoColumnLayout>
            <TeacherTwoColumnMain>
              <AutoExamConfigPanel
                examTitle={examTitle}
                setExamTitle={setExamTitle}
                examCategory={examCategory}
                setExamCategory={setExamCategory}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
                targetTotalPoints={targetTotalPoints}
                setTargetTotalPoints={setTargetTotalPoints}
                selectedSubject={selectedSubject}
                onSubjectChange={handleSubjectChange}
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
            />
          </TeacherTwoColumnLayout>

          <GeneratedExamResults
            generatedExams={generatedExams}
            draftStatus={draftStatus}
            onSaveDraft={handleSaveDraft}
            onPublish={handleOpenPublishModal}
            onPreview={setPreviewExamCode}
          />
        </main>
      </div>

      <AssignExamToCourseModal
        isOpen={isAssignModalOpen}
        examId={generatedExams[0]?.id ?? 'generated-exam-draft'}
        subjectName={eligibleQuestions[0]?.subjectName ?? ''}
        onClose={() => setIsAssignModalOpen(false)}
        examTitle={examTitle}
        defaultConfig={{
          durationMinutes,
          ...DEFAULT_SESSION_CONFIG,
          distributionMode: 'SHUFFLE_QUESTIONS_AND_OPTIONS',
        }}
        onCreateSessions={(schedules) => replaceExamSchedules(generatedExams[0].id, schedules)}
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
