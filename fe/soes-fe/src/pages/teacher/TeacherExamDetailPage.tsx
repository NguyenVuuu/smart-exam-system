import { useState } from 'react'
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
import type { ExamSchedule, ExamSubmission, ExamStudentVisibility, ResultReleaseMode } from './types/teacher-exam.types'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

export default function TeacherExamDetailPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const exams = useTeacherWorkspaceStore((state) => state.exams)
  const setExamVisibility = useTeacherWorkspaceStore((state) => state.setExamVisibility)
  const replaceExamSchedules = useTeacherWorkspaceStore((state) => state.replaceExamSchedules)
  const matchedExam = exams.find((item) => item.id === examId)
  const exam = matchedExam ?? exams[0]

  const [activeTab, setActiveTab] = useState<ExamDetailTab>('sessions')
  const [sessions, setSessions] = useState<ExamSchedule[]>(exam.schedules ?? [])
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
    setSessions((current) => {
      const next = current.map((schedule) => schedule.id === selectedSessionId ? { ...schedule, ...updates } : schedule)
      replaceExamSchedules(exam.id, next)
      return next
    })
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
      case 'sessions':
        return (
          <ExamSessionsTab
            sessions={sessions}
            onCreateSession={() => {
              setEditingSession(null)
              setIsAssignModalOpen(true)
            }}
            onViewSession={setViewingSession}
            onEditSession={(session) => {
              setEditingSession(session)
              setIsAssignModalOpen(true)
            }}
            onDeleteSession={(sessionId) => {
              if (!window.confirm('Xác nhận hủy ca thi này? Lịch đã thông báo cho sinh viên sẽ được lưu vết.')) return
              setSessions((prev) => {
                const next = prev.map((session) => session.id === sessionId ? { ...session, status: 'CANCELLED' as const } : session)
                replaceExamSchedules(exam.id, next)
                return next
              })
            }}
          />
        )
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

  if (!matchedExam) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        <TeacherSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TeacherTopBar />
          <main className="flex-1 grid place-items-center p-6">
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">Không tìm thấy đề thi</h1>
              <p className="mt-1 text-xs text-gray-500">Đề thi không tồn tại hoặc bạn không có quyền truy cập.</p>
              <button onClick={() => navigate('/teacher/exams')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                Quay lại quản lý đề thi
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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
            onToggleStudentVisibility={() => setStudentVisibility((current) => {
              const next = current === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN'
              setExamVisibility(exam.id, next)
              return next
            })}
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
        onCreateSessions={(newSessions) => {
          setSessions((prev) => {
            const next = editingSession
              ? prev.map((session) => (session.id === editingSession.id ? newSessions[0] ?? session : session))
              : [...prev, ...newSessions]
            replaceExamSchedules(exam.id, next)
            return next
          })
          setSelectedSessionId((prev) => prev || newSessions[0]?.id || '')
          setActiveTab('sessions')
        }}
      />
      <ExamSessionDetailModal
        session={viewingSession}
        onClose={() => setViewingSession(null)}
      />
    </div>
  )
}
