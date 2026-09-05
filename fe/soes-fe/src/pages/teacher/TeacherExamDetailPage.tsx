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
import { ExamOverviewTab } from './components/exam-detail/ExamOverviewTab'
import { ExamProctoringTab } from './components/exam-detail/ExamProctoringTab'
import { ExamSubmissionsTab } from './components/exam-detail/ExamSubmissionsTab'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import type {
  Exam,
  ExamSchedule,
  ExamSubmission,
  ExamStudentVisibility,
  ResultReleaseMode,
  ViolationRecord,
} from './types/teacher-exam.types'
import { toast } from 'sonner'
import { useTeacherExamDetail } from './hooks/useTeacherExamDetail'
import { useTeacherExamSchedules } from './hooks/useTeacherExamSchedules'
import CancelTeacherScheduleDialog from './components/exam-detail/CancelTeacherScheduleDialog'
import { useTeacherExamSubmissions } from './hooks/useTeacherExamSubmissions'
import { useTeacherProctoringSessions } from './hooks/useTeacherProctoringSessions'
import ExamDistributionLockDialog from './components/exam-detail/ExamDistributionLockDialog'
import { useExamDistributionLock } from './hooks/useExamDistributionLock'
import { Eye, FileCheck, ShieldAlert } from 'lucide-react'

type CourseReviewTab = 'submissions' | 'violations'

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
  const [studentVisibility, setStudentVisibility] = useState<ExamStudentVisibility>(exam.studentVisibility)
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
  const proctoringData = useTeacherProctoringSessions(exam.id, selectedSessionId)
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

  const renderActiveTab = () => {
    if (isFinalManagementView) return null

    if (isCourseSubmissionView && courseReviewTab === 'violations') {
      return selectedSessionClosed ? (
        <CourseViolationLog
          violations={submissionData.violations}
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
            violations={submissionData.violations}
            proctoringSessions={proctoringData.items}
            isLoadingProctoringSessions={proctoringData.loading}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSessionChange={selectSession}
            onViewEvidence={setSelectedEvidenceUrl}
          />
        )
      case 'submissions':
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
            onResultReleaseAtChange={(value) => void submissionData.release({ mode: 'SCHEDULED', releaseAt: value, published: false })}
            onResultsPublishedChange={(value) => void submissionData.release({ mode: 'MANUAL', releaseAt: '', published: value })}
            onViewSubmission={setViewingSubmission}
            onEditSubmission={openScoreOverride}
            loading={submissionData.loading}
            pagination={submissionData.pagination}
            onPageChange={submissionData.setPage}
            canReview={selectedSessionClosed}
            showSessionSelector={!isCourseSubmissionView}
            unavailableTitle={reviewUnavailableTitle}
            unavailableDescription={reviewUnavailableDescription}
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
          <ExamDetailBackButton
            onBack={() => navigate(isCourseSubmissionView && courseOfferingId ? `/teacher/courses/${courseOfferingId}` : '/teacher/exams')}
            label={isCourseSubmissionView ? 'Quay lại lớp học phần' : 'Quay lại quản lý đề thi'}
          />
          {isCourseSubmissionView ? (
            <>
              <CourseSubmissionHeader
                exam={displayExam}
                courseCode={selectedCourseCode ?? selectedSession?.courseCode}
              />
              <CourseReviewTabs activeTab={courseReviewTab} onChange={setCourseReviewTab} />
            </>
          ) : (
            <>
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
                onLockDistribution={distributionLock.requestLock}
                onUnlockDistribution={distributionLock.requestUnlock}
                contentOnly={isFinalManagementView}
              />
              {!isFinalManagementView && <ExamDetailTabs activeTab={activeTab} onChange={setActiveTab} />}
            </>
          )}
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
        onApply={() => void applyScoreOverride()}
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
            await onRefresh()
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

function CourseSubmissionHeader({ exam, courseCode }: { exam: Exam; courseCode?: string }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase text-blue-600">Kết quả ca thi</p>
      <div className="mt-2 min-w-0">
        <h1 className="truncate text-xl font-semibold leading-7 text-gray-950" title={exam.title}>
          {exam.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {courseCode ? `${courseCode} • ` : ''}{exam.subjectName} • {exam.totalPoints} điểm
        </p>
      </div>
    </section>
  )
}

function CourseReviewTabs({
  activeTab,
  onChange,
}: {
  activeTab: CourseReviewTab
  onChange: (tab: CourseReviewTab) => void
}) {
  const tabs = [
    { id: 'submissions' as const, label: 'Bài nộp & Phúc khảo', icon: FileCheck },
    { id: 'violations' as const, label: 'Nhật ký vi phạm', icon: ShieldAlert },
  ]

  return (
    <nav className="flex gap-1 border-b border-gray-200" aria-label="Nội dung bài thi của lớp">
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

function CourseReviewUnavailable({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  )
}

const violationTypeLabels: Record<ViolationRecord['type'], string> = {
  TAB_SWITCH: 'Chuyển tab',
  FULLSCREEN_EXIT: 'Thoát toàn màn hình',
  COPY_PASTE: 'Sao chép hoặc dán',
  NO_FACE: 'Không nhận diện khuôn mặt',
  MULTIPLE_FACES: 'Phát hiện nhiều khuôn mặt',
  CAMERA_BLOCKED: 'Camera bị che hoặc chặn',
  CAMERA_DISCONNECTED: 'Camera tắt hoặc mất kết nối',
  CAMERA_PERMISSION_DENIED: 'Quyền camera bị từ chối',
  SCREEN_SHARE_STOPPED: 'Dừng chia sẻ màn hình',
  SCREEN_PERMISSION_DENIED: 'Từ chối chia sẻ màn hình',
  PROCTOR_WEBCAM_CAPTURE: 'Giám thị chụp webcam',
  PROCTOR_SCREEN_CAPTURE: 'Giám thị chụp màn hình',
  IP_CHANGED: 'Thay đổi địa chỉ IP',
  HEARTBEAT_MISSED: 'Mất kết nối giám sát',
  MULTIPLE_ACTIVE_SESSIONS: 'Nhiều phiên thi hoạt động',
  INACTIVITY: 'Không hoạt động',
}

const violationSeverityLabels: Record<ViolationRecord['severity'], string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
}

const violationSeverityClasses: Record<ViolationRecord['severity'], string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-rose-50 text-rose-700',
}

function CourseViolationLog({
  violations,
  onViewEvidence,
}: {
  violations: ViolationRecord[]
  onViewEvidence: (url: string) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <ShieldAlert size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Nhật ký vi phạm của lớp</h2>
          <p className="text-sm text-gray-500">Chỉ hiển thị sự kiện của sinh viên trong ca thi đang xem.</p>
        </div>
      </div>

      {violations.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-gray-500">
          Chưa ghi nhận vi phạm trong ca thi này.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {violations.map((violation) => (
            <div key={violation.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(180px,1fr)_minmax(220px,1.3fr)_150px_130px_110px_44px] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{violation.studentName}</p>
                <p className="text-xs text-gray-500">{violation.studentCode}</p>
              </div>
              <p className="text-sm text-gray-700">{violationTypeLabels[violation.type]}</p>
              <p className="text-sm text-gray-500">{formatViolationTime(violation.timestamp)}</p>
              <p className="text-sm text-gray-500">{formatViolationDuration(violation)}</p>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${violationSeverityClasses[violation.severity]}`}>
                {violationSeverityLabels[violation.severity]}
              </span>
              {violation.evidenceImageUrl ? (
                <button
                  type="button"
                  title="Xem bằng chứng"
                  onClick={() => onViewEvidence(violation.evidenceImageUrl!)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <Eye size={17} />
                </button>
              ) : <span />}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function formatViolationTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatViolationDuration(violation: ViolationRecord) {
  if (violation.durationSeconds === null && violation.endedAt === null) return 'Đang diễn ra'
  if (violation.durationSeconds === undefined || violation.durationSeconds === null) return '-'

  if (violation.durationSeconds < 60) return `${violation.durationSeconds}s`

  const minutes = Math.floor(violation.durationSeconds / 60)
  const seconds = violation.durationSeconds % 60
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

function isClosedSession(session?: ExamSchedule) {
  if (!session || session.status === 'DRAFT' || session.status === 'CANCELLED') return false
  return session.status === 'CLOSED' || new Date(session.endTime).getTime() <= Date.now()
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
