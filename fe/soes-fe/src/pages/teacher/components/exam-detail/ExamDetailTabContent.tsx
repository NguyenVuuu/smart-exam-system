import type { CourseReviewTab } from './CourseExamReviewSection'
import {
  CourseReviewUnavailable,
  CourseViolationLog,
} from './CourseExamReviewSection'
import type { ExamDetailTab } from './ExamDetailTabsNav'
import { ExamOverviewTab } from './ExamOverviewTab'
import { ExamProctoringTab } from './ExamProctoringTab'
import ExamSessionsTab from './ExamSessionsTab'
import { ExamSubmissionsTab } from './ExamSubmissionsTab'
import type {
  Exam,
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
} from '../../types/teacher-exam.types'
import type { useTeacherExamSubmissions } from '../../hooks/useTeacherExamSubmissions'
import type { useTeacherExamViolations } from '../../hooks/useTeacherExamViolations'

interface ExamDetailTabContentProps {
  isFinalManagementView: boolean
  isCourseSubmissionView: boolean
  courseReviewTab: CourseReviewTab
  activeTab: ExamDetailTab
  exam: Exam
  sessions: ExamSchedule[]
  visibleSessions: ExamSchedule[]
  selectedSession?: ExamSchedule | null
  selectedSessionId: string
  selectedSessionClosed: boolean
  reviewUnavailableTitle: string
  reviewUnavailableDescription: string
  resultReleaseText: string
  resultReleaseMode: ResultReleaseMode
  resultReleaseAt: string
  isResultsPublished: boolean
  violationData: ReturnType<typeof useTeacherExamViolations>
  submissionData: ReturnType<typeof useTeacherExamSubmissions>
  onSelectSession: (sessionId: string) => void
  onViewEvidence: (url: string | null) => void
  onCreateSession: () => void
  onViewSession: (session: ExamSchedule) => void
  onEditSession: (session: ExamSchedule) => void
  onDeleteSession: (sessionId: string) => void
  onChangeResultReleaseMode: (mode: ResultReleaseMode) => void
  onOpenMakeupModal: () => void
  onViewSubmission: (submission: ExamSubmission) => void
  onViewViolations: (submission: ExamSubmission) => void
}

export default function ExamDetailTabContent({
  isFinalManagementView,
  isCourseSubmissionView,
  courseReviewTab,
  activeTab,
  exam,
  sessions,
  visibleSessions,
  selectedSession,
  selectedSessionId,
  selectedSessionClosed,
  reviewUnavailableTitle,
  reviewUnavailableDescription,
  resultReleaseText,
  resultReleaseMode,
  resultReleaseAt,
  isResultsPublished,
  violationData,
  submissionData,
  onSelectSession,
  onViewEvidence,
  onCreateSession,
  onViewSession,
  onEditSession,
  onDeleteSession,
  onChangeResultReleaseMode,
  onOpenMakeupModal,
  onViewSubmission,
  onViewViolations,
}: ExamDetailTabContentProps) {
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
        onViewEvidence={onViewEvidence}
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
          onCreateSession={onCreateSession}
          onViewSession={onViewSession}
          onEditSession={onEditSession}
          onDeleteSession={onDeleteSession}
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
          onSessionChange={onSelectSession}
          onViewEvidence={onViewEvidence}
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
        <>
          {selectedSessionClosed && !isCourseSubmissionView && selectedSession && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={onOpenMakeupModal}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Tạo ca dự phòng
              </button>
            </div>
          )}
          <ExamSubmissionsTab
            submissions={submissionData.items}
            sessions={visibleSessions}
            selectedSessionId={selectedSessionId}
            onSessionChange={onSelectSession}
            resultReleaseText={resultReleaseText}
            resultReleaseMode={resultReleaseMode}
            resultReleaseAt={resultReleaseAt}
            isResultsPublished={isResultsPublished}
            onResultReleaseModeChange={onChangeResultReleaseMode}
            onResultReleaseAtChange={(at) =>
              void submissionData.release({
                mode: resultReleaseMode,
                releaseAt: at,
                published: isResultsPublished,
              })
            }
            onResultsPublishedChange={(pub) =>
              void submissionData.release({
                mode: resultReleaseMode,
                releaseAt: resultReleaseAt,
                published: pub,
              })
            }
            onViewSubmission={onViewSubmission}
            onViewViolations={onViewViolations}
            onFinalizeOne={async (submission, score) => {
              await submissionData.finalizeOne(submission.attemptId, score)
            }}
            onFinalizeAll={submissionData.finalizeMany}
            pendingFinalizeCount={submissionData.pendingFinalizeCount}
            loading={submissionData.loading}
            pagination={submissionData.pagination}
            onPageChange={submissionData.setPage}
            canReview={selectedSessionClosed}
            showSessionSelector={!isCourseSubmissionView}
            unavailableTitle={reviewUnavailableTitle}
            unavailableDescription={reviewUnavailableDescription}
          />
        </>
      )
  }
}
