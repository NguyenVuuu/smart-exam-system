import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  EvidenceImageModal,
  ExamPreviewModal,
  ScoreOverrideModal,
  StudentSubmissionReviewModal,
} from './components/exam-detail/ExamDetailModals'
import ExamSessionsTab from './components/exam-detail/ExamSessionsTab'
import AssignExamToCourseModal from './components/exam-detail/AssignExamToCourseModal'
import ExamSessionDetailModal from './components/exam-detail/session/ExamSessionDetailModal'
import { ExamDetailBackButton } from './components/exam-detail/ExamDetailBackButton'
import { ExamDetailHeader } from './components/exam-detail/ExamDetailHeader'
import { ExamDetailTabs, type ExamDetailTab } from './components/exam-detail/ExamDetailTabsNav'
import {
  CourseSubmissionHeader,
  CourseReviewTabs,
  CourseReviewUnavailable,
  CourseViolationLog,
  type CourseReviewTab,
} from './components/exam-detail/CourseExamReviewSection'
import { ExamOverviewTab } from './components/exam-detail/ExamOverviewTab'
import { ExamProctoringTab } from './components/exam-detail/ExamProctoringTab'
import { ExamSubmissionsTab } from './components/exam-detail/ExamSubmissionsTab'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import type {
  Exam,
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
} from './types/teacher-exam.types'
import { copyTeacherExam } from './api/teacher-exams.api'
import { toast } from 'sonner'
import { useTeacherExamDetail } from './hooks/useTeacherExamDetail'
import { useTeacherExamSchedules } from './hooks/useTeacherExamSchedules'
import CancelTeacherScheduleDialog from './components/exam-detail/CancelTeacherScheduleDialog'
import { useTeacherExamSubmissions } from './hooks/useTeacherExamSubmissions'
import { useTeacherExamViolations } from './hooks/useTeacherExamViolations'
import ExamDistributionLockDialog from './components/exam-detail/ExamDistributionLockDialog'
import { useExamDistributionLock } from './hooks/useExamDistributionLock'
import { useExamStudentVisibility } from './hooks/useExamStudentVisibility'
import { useTeacherExamDefaults } from './hooks/useTeacherExamDefaults'

const isClosedSession = (session?: ExamSchedule | null) =>
  Boolean(session && (session.status === 'CLOSED' || (session.endTime && new Date(session.endTime) <= new Date())))

export default function TeacherExamDetailPage({ mode = 'management' }: { mode?: 'management' | 'course-submissions' }) {
  const { examId, courseOfferingId } = useParams<{ examId: string; courseOfferingId?: string }>()
  const { exam, loading, error, retry } = useTeacherExamDetail(examId)

  if (loading) return <ExamDetailState message="Đang tải đề thi..." />
  if (!exam) return <ExamDetailState message={error ?? 'Không tìm thấy đề thi.'} onRetry={() => void retry()} />
  return <TeacherExamDetailContent key={`${mode}-${exam.id}-${courseOfferingId ?? ''}`} exam={exam} onRefresh={retry} mode={mode} courseOfferingId={courseOfferingId} />
}

function TeacherExamDetailContent({
  exam,
  onRefresh,
  mode,
  courseOfferingId,
}: {
  exam: Exam
  onRefresh: () => Promise<void>
  mode: 'management' | 'course-submissions'
  courseOfferingId?: string
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const examDefaults = useTeacherExamDefaults()
  const isCourseSubmissionView = mode === 'course-submissions'
  const initialTab = isCourseSubmissionView || searchParams.get('tab') === 'submissions' ? 'submissions' : 'sessions'
  const [activeTab, setActiveTab] = useState<ExamDetailTab>(initialTab)
  const [courseReviewTab, setCourseReviewTab] = useState<CourseReviewTab>('submissions')
  const {
    schedules: sessions,
    courses,
    loading: schedulesLoading,
    save: saveSchedule,
    cancel: cancelSchedule,
  } = useTeacherExamSchedules(exam.id, exam.subjectId)
  const [requestedSessionId, setSelectedSessionId] = useState(
    searchParams.get('scheduleId') ?? searchParams.get('scheduledId') ?? (exam.schedules ?? [])[0]?.id ?? '',
  )
  const isFinalManagementView = !isCourseSubmissionView && exam.category === 'FINAL'
  const visibleSessions = useMemo(
    () => isCourseSubmissionView && courseOfferingId
      ? sessions.filter((session) =>
          session.courseOfferingId === courseOfferingId ||
          session.courseOfferings?.some((course) => course.id === courseOfferingId),
        )
      : sessions,
    [courseOfferingId, isCourseSubmissionView, sessions],
  )
  const selectedSessionId = visibleSessions.some((session) => session.id === requestedSessionId)
    ? requestedSessionId
    : visibleSessions[0]?.id ?? ''
  const selectedSession = visibleSessions.find((session) => session.id === selectedSessionId)
  const selectedCourseCode = courseOfferingId
    ? selectedSession?.courseOfferings?.find((course) => course.id === courseOfferingId)?.code
    : selectedSession?.courseCode
  const selectedSessionClosed = isClosedSession(selectedSession)
  const submissionData = useTeacherExamSubmissions(exam.id, selectedSessionClosed ? selectedSessionId : '')
  const violationLogVisible = isCourseSubmissionView
    ? courseReviewTab === 'violations'
    : activeTab === 'proctoring'
  const violationData = useTeacherExamViolations(
    exam.id,
    selectedSessionClosed && violationLogVisible ? selectedSessionId : '',
  )
  const hasVisibleSession = visibleSessions.length > 0
  const reviewUnavailableTitle = schedulesLoading
    ? 'Đang tải ca thi'
    : hasVisibleSession
      ? 'Ca thi chưa kết thúc'
      : 'Không tìm thấy ca thi của lớp'
  const reviewUnavailableDescription = hasVisibleSession
    ? 'Bài nộp, phúc khảo và nhật ký vi phạm chỉ được mở sau khi ca thi kết thúc.'
    : 'Lớp học phần này chưa được gán vào ca thi hoặc bạn không phụ trách lớp.'
  const { mode: resultReleaseMode, releaseAt: resultReleaseAt, published: isResultsPublished } = submissionData.resultRelease
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
  const distributionLock = useExamDistributionLock(exam.id, onRefresh)
  const studentVisibility = useExamStudentVisibility(exam.id, onRefresh)

  const resultReleaseText =
    resultReleaseMode === 'IMMEDIATE'
      ? 'Sinh viên thấy điểm ngay sau khi nộp bài'
      : resultReleaseMode === 'SCHEDULED'
      ? `Tự động công bố điểm lúc ${resultReleaseAt}`
      : isResultsPublished
      ? 'Đã công bố điểm thủ công cho sinh viên'
      : 'Đang ẩn điểm, giảng viên sẽ công bố sau'

  const openScoreOverride = (submission: ExamSubmission) => {
    setSelectedSubmission(submission)
    setOverrideScoreInput(submission.finalScore ?? submission.autoScore ?? 0)
    setOverrideReason(submission.overrideReason ?? '')
  }

  const applyScoreOverride = async () => {
    if (!selectedSubmission || overrideReason.trim().length < 5) return
    try {
      await submissionData.grade(selectedSubmission.attemptId, overrideScoreInput, overrideReason.trim())
      setSelectedSubmission(null)
      setOverrideReason('')
      toast.success('Đã cập nhật điểm và lưu lịch sử điều chỉnh.')
    } catch { toast.error('Không thể cập nhật điểm bài nộp.') }
  }

  const changeResultReleaseMode = (mode: ResultReleaseMode) => {
    void submissionData.release({
      mode, releaseAt: mode === 'SCHEDULED' ? resultReleaseAt : '', published: mode === 'IMMEDIATE',
    }).catch(() => toast.error('Không thể cập nhật cấu hình công bố điểm.'))
  }

  const selectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
  }

  const handleCopyExam = async () => {
    try {
      const copied = await copyTeacherExam(exam.id)
      toast.success('Đã sao chép đề thi thành công')
      navigate(`/teacher/exams/${copied.id}/edit`)
    } catch {
      toast.error('Không thể sao chép đề thi')
    }
  }

  const renderActiveTab = () => {
    if (isFinalManagementView) return null

    if (isCourseSubmissionView && courseReviewTab === 'violations') {
      return selectedSessionClosed ? (
        <CourseViolationLog
          violations={violationData.items}
          pagination={violationData.pagination}
          loading={violationData.loading}
          error={violationData.error}
          onPageChange={violationData.setPage}
          onRefresh={violationData.reload}
          onViewEvidence={setSelectedEvidenceUrl}
        />
      ) : (
        <CourseReviewUnavailable
          title={reviewUnavailableTitle}
          description={reviewUnavailableDescription}
        />
      )
    }

    switch (activeTab) {
      case 'sessions': {
        const isFinalExam = exam.category === 'FINAL'
        const canManageSchedules = !isFinalExam && Boolean(exam.capabilities?.canSchedule)
        return (
          <ExamSessionsTab
            sessions={sessions}
            onCreateSession={() => {
              setEditingSession(null)
              setIsAssignModalOpen(true)
            }}
            onViewSession={(session) => setViewingSession(session)}
            onEditSession={(session) => {
              setEditingSession(session)
              setIsAssignModalOpen(true)
            }}
            onDeleteSession={(sessionId) => {
              const targetSession = sessions.find((s) => s.id === sessionId)
              if (targetSession) setCancellingSession(targetSession)
            }}
            canCreate={canManageSchedules}
          />
        )
      }
      case 'overview':
        return <ExamOverviewTab exam={exam} resultReleaseText={resultReleaseText} />
      case 'proctoring':
        return (
          <ExamProctoringTab
            violations={violationData.items}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSessionChange={selectSession}
            onViewEvidence={setSelectedEvidenceUrl}
            pagination={violationData.pagination}
            loading={violationData.loading}
            error={violationData.error}
            onPageChange={violationData.setPage}
            onRefresh={violationData.reload}
          />
        )
      case 'submissions':
      default:
        return (
          <ExamSubmissionsTab
            submissions={submissionData.items}
            sessions={visibleSessions}
            selectedSessionId={selectedSessionId}
            onSessionChange={selectSession}
            resultReleaseText={resultReleaseText}
            resultReleaseMode={resultReleaseMode}
            resultReleaseAt={resultReleaseAt}
            isResultsPublished={isResultsPublished}
            onResultReleaseModeChange={changeResultReleaseMode}
            onResultReleaseAtChange={(at) => void submissionData.release({ mode: resultReleaseMode, releaseAt: at, published: isResultsPublished })}
            onResultsPublishedChange={(pub) => void submissionData.release({ mode: resultReleaseMode, releaseAt: resultReleaseAt, published: pub })}
            loading={submissionData.loading}
            pagination={submissionData.pagination}
            onPageChange={submissionData.setPage}
            canReview={selectedSessionClosed}
            showSessionSelector={!isCourseSubmissionView}
            unavailableTitle={reviewUnavailableTitle}
            unavailableDescription={reviewUnavailableDescription}
          />
        )
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <ExamDetailBackButton
              onBack={() => navigate('/teacher/exams')}
              label={isCourseSubmissionView ? 'Quay lại danh sách bài thi' : 'Quay lại quản lý đề thi'}
            />

            {isCourseSubmissionView ? (
              <CourseSubmissionHeader exam={exam} courseCode={selectedCourseCode} />
            ) : (
              <ExamDetailHeader
                exam={exam}
                onEdit={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                onPublish={() => void 0}
                onPreview={() => setIsPreviewOpen(true)}
                onCopy={() => void handleCopyExam()}
                onToggleStudentVisibility={() => void studentVisibility.update(exam.studentVisibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE')}
                onLockDistribution={distributionLock.requestLock}
                onUnlockDistribution={distributionLock.requestUnlock}
                visibilitySaving={studentVisibility.saving}
              />
            )}

            {isCourseSubmissionView ? (
              <CourseReviewTabs
                activeTab={courseReviewTab}
                onChange={setCourseReviewTab}
              />
            ) : (
              <ExamDetailTabs
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            )}

            {renderActiveTab()}
          </div>
        </main>
      </div>

      <ScoreOverrideModal
        submission={selectedSubmission}
        maxScore={exam.totalPoints}
        overrideScoreInput={overrideScoreInput}
        overrideReason={overrideReason}
        onScoreChange={setOverrideScoreInput}
        onReasonChange={setOverrideReason}
        onClose={() => setSelectedSubmission(null)}
        onApply={() => void applyScoreOverride()}
      />
      <EvidenceImageModal
        imageUrl={selectedEvidenceUrl}
        onClose={() => setSelectedEvidenceUrl(null)}
      />
      <StudentSubmissionReviewModal
        exam={exam}
        submission={viewingSubmission}
        onClose={() => setViewingSubmission(null)}
        onEditScore={(submission) => {
          setViewingSubmission(null)
          openScoreOverride(submission)
        }}
      />
      <ExamPreviewModal
        exam={exam}
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
          enableTabLock: editingSession?.enableTabLock ?? examDefaults.enableTabLock,
          requireFullscreen: editingSession?.requireFullscreen ?? examDefaults.requireFullscreen,
          enableWebcam: editingSession?.enableWebcam ?? examDefaults.enableWebcam,
          enableScreenMonitoring: editingSession?.enableScreenMonitoring ?? examDefaults.enableScreenMonitoring,
          blockCopyPaste: editingSession?.blockCopyPaste ?? examDefaults.blockCopyPaste,
          blockRightClick: editingSession?.blockRightClick ?? examDefaults.blockRightClick,
          ipMode: editingSession?.ipMode ?? 'HOME',
          allowedIpRange: editingSession?.allowedIpRange,
          distributionMode:
            editingSession?.distributionMode ??
            'SHUFFLE_QUESTIONS_AND_OPTIONS',
        }}
        initialSessions={editingSession ? [editingSession] : undefined}
        initialEditingSessionId={editingSession?.id}
        onCreateSessions={async (newSessions) => {
          const saved = await Promise.all(newSessions.map((session) => saveSchedule(session, editingSession?.id)))
          await onRefresh()
          setSelectedSessionId((current) => current || saved[0]?.id || '')
          setActiveTab('sessions')
          toast.success(editingSession ? 'Đã cập nhật ca thi.' : 'Đã tạo ca thi.')
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
          await onRefresh()
          setCancellingSession(null)
          toast.success('Đã hủy ca thi.')
        }}
      />
      <ExamDistributionLockDialog
        action={distributionLock.action}
        saving={distributionLock.saving}
        onClose={distributionLock.close}
        onConfirm={() => void distributionLock.confirm()}
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
