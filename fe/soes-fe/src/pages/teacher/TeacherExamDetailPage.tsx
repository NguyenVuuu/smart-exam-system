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
import { MOCK_EXAM_SUBMISSIONS, MOCK_EXAMS, MOCK_VIOLATIONS } from './mock/teacher-exam.mock'
import type { ExamAssignment, ExamSubmission, ExamStudentVisibility, ResultReleaseMode } from './types/teacher-exam.types'

export default function TeacherExamDetailPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const exam = MOCK_EXAMS.find((item) => item.id === examId) || MOCK_EXAMS[0]

  const [activeTab, setActiveTab] = useState<ExamDetailTab>('sessions')
  const [sessions, setSessions] = useState<ExamAssignment[]>(exam.assignments ?? [])
  const [studentVisibility, setStudentVisibility] = useState<ExamStudentVisibility>(exam.studentVisibility)
  const [selectedSessionId, setSelectedSessionId] = useState((exam.assignments ?? [])[0]?.id ?? '')
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(MOCK_EXAM_SUBMISSIONS)
  const [violations] = useState(MOCK_VIOLATIONS)
  const [isResultsPublished, setIsResultsPublished] = useState(exam.resultPublished)
  const [resultReleaseMode, setResultReleaseMode] = useState<ResultReleaseMode>(
    exam.resultReleaseMode || (exam.resultPublished ? 'IMMEDIATE' : 'MANUAL'),
  )
  const [resultReleaseAt, setResultReleaseAt] = useState(exam.resultReleaseAt || '2026-08-25 18:00')
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null)
  const [viewingSubmission, setViewingSubmission] = useState<ExamSubmission | null>(null)
  const [overrideScoreInput, setOverrideScoreInput] = useState(0)
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<ExamAssignment | null>(null)
  const [viewingSession, setViewingSession] = useState<ExamAssignment | null>(null)

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
  }

  const applyScoreOverride = () => {
    if (!selectedSubmission) return

    setSubmissions((prev) =>
      prev.map((submission) =>
        submission.id === selectedSubmission.id
          ? {
              ...submission,
              manualScoreOverride: overrideScoreInput,
              finalScore: overrideScoreInput,
            }
          : submission,
      ),
    )
    setSelectedSubmission(null)
  }

  const changeResultReleaseMode = (mode: ResultReleaseMode) => {
    setResultReleaseMode(mode)
    setIsResultsPublished(mode === 'IMMEDIATE')
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
              setSessions((prev) => prev.filter((session) => session.id !== sessionId))
              setSelectedSessionId((prev) => (prev === sessionId ? sessions.find((session) => session.id !== sessionId)?.id ?? '' : prev))
            }}
          />
        )
      case 'proctoring':
        return (
          <ExamProctoringTab
            violations={violations}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSessionChange={setSelectedSessionId}
            onViewEvidence={setSelectedEvidenceUrl}
          />
        )
      case 'submissions':
        return (
          <ExamSubmissionsTab
            submissions={submissions}
            resultReleaseText={resultReleaseText}
            resultReleaseMode={resultReleaseMode}
            resultReleaseAt={resultReleaseAt}
            isResultsPublished={isResultsPublished}
            onResultReleaseModeChange={changeResultReleaseMode}
            onResultReleaseAtChange={setResultReleaseAt}
            onResultsPublishedChange={setIsResultsPublished}
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
        onScoreChange={setOverrideScoreInput}
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
        onClose={() => {
          setIsAssignModalOpen(false)
          setEditingSession(null)
        }}
        examTitle={exam.title}
        defaultConfig={{
          durationMinutes: editingSession?.durationMinutes ?? exam.durationMinutes,
          maxAttempts: editingSession?.maxAttempts ?? exam.maxAttempts,
          password: editingSession?.password ?? exam.password ?? '',
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
            'RANDOM_ONLINE',
        }}
        initialSessions={editingSession ? [editingSession] : undefined}
        initialEditingSessionId={editingSession?.id}
        onCreateSessions={(newSessions) => {
          setSessions((prev) =>
            editingSession
              ? prev.map((session) => (session.id === editingSession.id ? newSessions[0] ?? session : session))
              : [...prev, ...newSessions],
          )
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
