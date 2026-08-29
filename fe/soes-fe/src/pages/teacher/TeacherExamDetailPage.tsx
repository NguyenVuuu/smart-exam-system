import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  EvidenceImageModal,
  ExamPreviewModal,
  ScoreOverrideModal,
  StudentSubmissionReviewModal,
} from './components/exam-detail/ExamDetailModals'
import ExamSessionsTab from './components/exam-detail/ExamSessionsTab'
import AssignExamToCourseModal from './components/exam-detail/AssignExamToCourseModal'
import ExamSessionDetailModal from './components/exam-detail/session/ExamSessionDetailModal'
import {
  ExamDetailBackButton,
  ExamDetailHeader,
  ExamDetailTabs,
  ExamOverviewTab,
  ExamProctoringTab,
  ExamSubmissionsTab,
  type ExamDetailTab,
} from './components/exam-detail/ExamDetailSections'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { MOCK_EXAM_SUBMISSIONS, MOCK_VIOLATIONS } from './mock/teacher-exam.mock'
import type { Exam, ExamSchedule, ExamSubmission, ExamStudentVisibility, ResultReleaseMode } from './types/teacher-exam.types'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'
import { useTeacherExamDetail } from './hooks/useTeacherExamDetail'
import { useTeacherExamSchedules } from './hooks/useTeacherExamSchedules'
import CancelTeacherScheduleDialog from './components/exam-detail/CancelTeacherScheduleDialog'

export default function TeacherExamDetailPage() {
  const { examId } = useParams<{ examId: string }>()
  const { exam, loading, error, retry } = useTeacherExamDetail(examId)

  if (loading) return <ExamDetailState message="Đang tải đề thi..." />
  if (!exam) return <ExamDetailState message={error ?? 'Không tìm thấy đề thi.'} onRetry={() => void retry()} />
  return <TeacherExamDetailContent key={exam.id} exam={exam} />
}

function TeacherExamDetailContent({ exam }: { exam: Exam }) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)

  const [activeTab, setActiveTab] = useState<ExamDetailTab>('sessions')
  const { schedules: sessions, courses, save: saveSchedule, cancel: cancelSchedule } = useTeacherExamSchedules(exam.id, exam.subjectId)
  const [studentVisibility, setStudentVisibility] = useState<ExamStudentVisibility>(exam.studentVisibility)
  const [selectedSessionId, setSelectedSessionId] = useState((exam.schedules ?? [])[0]?.id ?? '')
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(MOCK_EXAM_SUBMISSIONS.filter((item) => item.examId === exam.id))
  const [violations] = useState(MOCK_VIOLATIONS.filter((item) => exam.schedules?.some((schedule) => schedule.id === item.scheduleId)))
  const initialSchedule = exam.schedules?.[0]
  const [isResultsPublished, setIsResultsPublished] = useState(Boolean(initialSchedule?.resultsPublished))
  const [resultReleaseMode, setResultReleaseMode] = useState<ResultReleaseMode>(initialSchedule?.resultReleaseMode ?? 'MANUAL')
  const [resultReleaseAt, setResultReleaseAt] = useState(initialSchedule?.resultReleaseAt || '2026-08-25 18:00')
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null)
  const [viewingSubmission, setViewingSubmission] = useState<ExamSubmission | null>(null)
  const [overrideScoreInput, setOverrideScoreInput] = useState(0)
  const [overrideReason, setOverrideReason] = useState('')
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<ExamSchedule | null>(null)
  const [viewingSession, setViewingSession] = useState<ExamSchedule | null>(null)
  const [cancellingSession, setCancellingSession] = useState<ExamSchedule | null>(null)

  useEffect(() => {
    if (!selectedSessionId && sessions[0]) setSelectedSessionId(sessions[0].id)
  }, [selectedSessionId, sessions])

  const resultReleaseText =
    resultReleaseMode === 'IMMEDIATE'
      ? 'Sinh viên thấy điểm ngay sau khi nộp bài'
      : resultReleaseMode === 'SCHEDULED'
      ? `Tự động công bố điểm lúc ${resultReleaseAt}`
      : isResultsPublished
      ? 'Đã công bố điểm thủ công cho sinh viên'
      : 'Đang ẩn điểm, giảng viên sẽ công bố sau'

  const displayExam = { ...exam, studentVisibility }

  const openScoreOverride = (submission: ExamSubmission) => {
    setSelectedSubmission(submission)
    setOverrideScoreInput(submission.finalScore)
    setOverrideReason(submission.overrideReason ?? '')
  }

  const applyScoreOverride = () => {
    if (!selectedSubmission || overrideReason.trim().length < 5) return

    setSubmissions((prev) =>
      prev.map((submission) =>
        submission.id === selectedSubmission.id
          ? {
              ...submission,
              manualScoreOverride: overrideScoreInput,


              overrideReason: overrideReason.trim(),
              finalScore: overrideScoreInput,
              scoreAdjustments: [
                ...(submission.scoreAdjustments ?? []),
                {
                  id: `adjustment-${Date.now()}`,
                  oldScore: submission.finalScore,
                  newScore: overrideScoreInput,
                  reason: overrideReason.trim(),
                  adjustedBy: currentUser?.fullName ?? 'Giảng viên phụ trách',
                  adjustedAt: new Date().toISOString(),
                },
              ],
              regradeRequest: submission.regradeRequest
                ? {
                    ...submission.regradeRequest,
                    status: 'ACCEPTED',
                    resolution: overrideReason.trim(),
                    resolvedAt: new Date().toISOString(),
                  }
                : undefined,
            }
          : submission,
      ),
    )
    setSelectedSubmission(null)
    setOverrideReason('')
    toast.success('Đã cập nhật điểm và lưu lịch sử điều chỉnh.')
  }

  const changeResultReleaseMode = (mode: ResultReleaseMode) => {
    setResultReleaseMode(mode)
    setIsResultsPublished(mode === 'IMMEDIATE')
    updateSelectedSchedule({ resultReleaseMode: mode, resultsPublished: mode === 'IMMEDIATE' })
  }

  const updateSelectedSchedule = (updates: Partial<ExamSchedule>) => {
    const current = sessions.find((schedule) => schedule.id === selectedSessionId)
    if (current) void saveSchedule({ ...current, ...updates }, current.id)
  }

  const selectSession = (sessionId: string) => {
    const schedule = sessions.find((item) => item.id === sessionId)
    setSelectedSessionId(sessionId)
    setResultReleaseMode(schedule?.resultReleaseMode ?? 'MANUAL')
    setResultReleaseAt(schedule?.resultReleaseAt ?? '')
    setIsResultsPublished(Boolean(schedule?.resultsPublished))
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'sessions': {
        const isFinalExam = exam.category === 'FINAL'
        return (
          <ExamSessionsTab
            sessions={sessions}
            canCreate={!isFinalExam && Boolean(exam.capabilities?.canSchedule)}
            onCreateSession={() => {
              setEditingSession(null)
              setIsAssignModalOpen(true)
            }}
            onViewSession={setViewingSession}
            onEditSession={
              !isFinalExam
                ? (session) => {
                    setEditingSession(session)
                    setIsAssignModalOpen(true)
                  }
                : undefined
            }
            onDeleteSession={
              !isFinalExam
                ? (sessionId) => setCancellingSession(sessions.find(({ id }) => id === sessionId) ?? null)
                : undefined
            }
          />
        )
      }
      case 'proctoring':
        return (
          <ExamProctoringTab
            violations={violations}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSessionChange={selectSession}
            onViewEvidence={setSelectedEvidenceUrl}
          />
        )
      case 'submissions':
        return (
          <ExamSubmissionsTab
            submissions={submissions.filter((submission) => submission.scheduleId === selectedSessionId)}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSessionChange={selectSession}
            resultReleaseText={resultReleaseText}
            resultReleaseMode={resultReleaseMode}
            resultReleaseAt={resultReleaseAt}
            isResultsPublished={isResultsPublished}
            onResultReleaseModeChange={changeResultReleaseMode}
            onResultReleaseAtChange={(value) => { setResultReleaseAt(value); updateSelectedSchedule({ resultReleaseAt: value }) }}
            onResultsPublishedChange={(value) => { setIsResultsPublished(value); updateSelectedSchedule({ resultsPublished: value }) }}
            onViewSubmission={setViewingSubmission}
            onEditSubmission={openScoreOverride}
          />
        )
      case 'overview':
        return <ExamOverviewTab exam={displayExam} resultReleaseText={resultReleaseText} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <ExamDetailBackButton onBack={() => navigate('/teacher/exams')} />
          <ExamDetailHeader
            exam={displayExam}
            onEdit={() => navigate(`/teacher/exams/${exam.id}/edit`)}
            onPublish={() => {
              setEditingSession(null)
              setIsAssignModalOpen(true)
            }}
            onPreview={() => setIsPreviewOpen(true)}
            onCopy={() => navigate(`/teacher/exams/create?copyFrom=${exam.id}`)}
            onToggleStudentVisibility={() =>
              setStudentVisibility((current) => (current === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN'))
            }
          />
          <ExamDetailTabs activeTab={activeTab} onChange={setActiveTab} />
          {renderActiveTab()}
        </main>
      </div>

      <ScoreOverrideModal
        submission={selectedSubmission}
        overrideScoreInput={overrideScoreInput}
        overrideReason={overrideReason}
        maxScore={exam.totalPoints}
        onScoreChange={setOverrideScoreInput}
        onReasonChange={setOverrideReason}
        onClose={() => setSelectedSubmission(null)}
        onApply={applyScoreOverride}
      />
      <EvidenceImageModal imageUrl={selectedEvidenceUrl} onClose={() => setSelectedEvidenceUrl(null)} />
      <StudentSubmissionReviewModal
        exam={displayExam}
        submission={viewingSubmission}
        onClose={() => setViewingSubmission(null)}
        onEditScore={(submission) => {
          setViewingSubmission(null)
          openScoreOverride(submission)
        }}
      />
      <ExamPreviewModal
        exam={displayExam}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
      <AssignExamToCourseModal
        isOpen={isAssignModalOpen}
        examId={exam.id}
        subjectName={exam.subjectName}
        courses={courses}
        onClose={() => {
          setIsAssignModalOpen(false)
          setEditingSession(null)
        }}
        examTitle={exam.title}
        defaultConfig={{
          durationMinutes: editingSession?.durationMinutes ?? exam.defaultDurationMinutes,
          maxAttempts: editingSession?.maxAttempts ?? 1,
          password: editingSession?.password ?? '',
          resultReleaseMode: editingSession?.resultReleaseMode ?? resultReleaseMode,
          resultReleaseAt: (editingSession?.resultReleaseAt ?? resultReleaseAt).replace(' ', 'T'),
          allowStudentReview: editingSession?.allowStudentReview ?? false,
          requireFullscreen: editingSession?.requireFullscreen ?? true,
          enableWebcam: editingSession?.enableWebcam ?? true,
          blockCopyPaste: editingSession?.blockCopyPaste ?? true,
          blockRightClick: editingSession?.blockRightClick ?? true,
          ipMode: editingSession?.ipMode ?? 'HOME',
          allowedIpRange: editingSession?.allowedIpRange,
          distributionMode:
            editingSession?.distributionMode ??
            'SHUFFLE_QUESTIONS_AND_OPTIONS',
        }}
        initialSessions={editingSession ? [editingSession] : undefined}
        initialEditingSessionId={editingSession?.id}
        onCreateSessions={async (newSessions) => {
          try {
            const saved = await Promise.all(newSessions.map((session) => saveSchedule(session, editingSession?.id)))
            setSelectedSessionId((current) => current || saved[0]?.id || '')
            setActiveTab('sessions')
            toast.success(editingSession ? 'Đã cập nhật ca thi.' : 'Đã tạo ca thi.')
          } catch {
            toast.error('Không thể lưu ca thi. Vui lòng kiểm tra thời gian, lớp và trạng thái đề.')
            throw new Error('Schedule save failed')
          }
        }}
      />
      <ExamSessionDetailModal
        session={viewingSession}
        onClose={() => setViewingSession(null)}
      />
      <CancelTeacherScheduleDialog
        key={cancellingSession?.id ?? 'closed-schedule-dialog'}
        schedule={cancellingSession}
        onClose={() => setCancellingSession(null)}
        onConfirm={async (reason) => {
          if (!cancellingSession) return
          await cancelSchedule(cancellingSession.id, reason)
          setCancellingSession(null)
          toast.success('Đã hủy ca thi.')
        }}
      />
    </div>
  )
}

function ExamDetailState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="grid flex-1 place-items-center p-6">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">{message}</h1>
            {onRetry && <button onClick={onRetry} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Thử lại</button>}
          </div>
        </main>
      </div>
    </div>
  )
}
