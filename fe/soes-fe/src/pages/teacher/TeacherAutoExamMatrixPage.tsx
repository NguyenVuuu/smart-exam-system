import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { TeacherTwoColumnLayout, TeacherTwoColumnMain } from './components/TeacherTwoColumnLayout'
import AutoExamConfigPanel from './components/auto-exam/AutoExamConfigPanel'
import AutoExamPageHeader from './components/auto-exam/AutoExamPageHeader'
import AutoExamSummarySidebar from './components/auto-exam/AutoExamSummarySidebar'
import GeneratedExamPreviewModal from './components/auto-exam/results/GeneratedExamPreviewModal'
import GeneratedExamResults from './components/auto-exam/results/GeneratedExamResults'
import AssignExamToCourseModal from './components/exam-detail/AssignExamToCourseModal'
import { MOCK_QUESTION_BANK } from './mock/teacher-question-bank.mock'
import type {
  AutoExamDraftStatus,
  AutoExamPickMode,
  GeneratedExamCode,
} from './types/teacher-auto-exam.types'
import type { ExamCategory } from './types/teacher-exam.types'

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
  const [generatedExams, setGeneratedExams] = useState<GeneratedExamCode[]>([])
  const [draftStatus, setDraftStatus] = useState<AutoExamDraftStatus>('NOT_GENERATED')
  const [previewExamCode, setPreviewExamCode] = useState<GeneratedExamCode | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  const configuredQuestionCount = easyCount + mediumCount + hardCount
  const eligibleQuestions = MOCK_QUESTION_BANK.filter(
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
      const pointsPerQuestion = generatedQuestionIds.length
        ? Number((targetTotalPoints / generatedQuestionIds.length).toFixed(2))
        : 0
      const mockCodes: GeneratedExamCode[] = [
        {
          code: 'ĐỀ THI',
          easyCount,
          mediumCount,
          hardCount,
          totalPoints: targetTotalPoints,
          pointsPerQuestion,
          questionIds: generatedQuestionIds,
        },
      ]
      setGeneratedExams(mockCodes)
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

    setDraftStatus('SAVED_DRAFT')
    alert('Đã lưu nháp đề thi tự động. Trong bản BE thật, đề này sẽ nằm trong Quản lý đề thi để xem lại, chỉnh sửa hoặc tạo ca thi cho quiz/giữa kỳ sau.')
  }

  const handleOpenPublishModal = () => {
    if (draftStatus !== 'SAVED_DRAFT') {
      alert('Vui lòng lưu nháp đề trước khi tạo ca thi.')
      return
    }

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
        onClose={() => setIsAssignModalOpen(false)}
        examTitle={examTitle}
        defaultConfig={{
          durationMinutes,
          ...DEFAULT_SESSION_CONFIG,
          distributionMode: 'RANDOM_ONLINE',
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
