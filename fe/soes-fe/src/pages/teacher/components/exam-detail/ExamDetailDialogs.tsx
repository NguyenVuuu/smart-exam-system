import { toast } from 'sonner'
import {
  EvidenceImageModal,
  ExamPreviewModal,
  StudentSubmissionReviewModal,
} from './ExamDetailModals'
import AssignExamToCourseModal from './AssignExamToCourseModal'
import CancelTeacherScheduleDialog from './CancelTeacherScheduleDialog'
import ExamDistributionLockDialog from './ExamDistributionLockDialog'
import ExamSessionDetailModal from './session/ExamSessionDetailModal'
import MakeupScheduleModal from './MakeupScheduleModal'
import SubmissionViolationsModal from './SubmissionViolationsModal'
import { createTeacherMakeupSchedule } from '../../api/teacher-exams.api'
import type {
  Exam,
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
  ViolationRecord,
} from '../../types/teacher-exam.types'
import type { CourseOffering } from '../../types/teacher-course.types'

interface ExamDetailDialogsProps {
  exam: Exam
  selectedEvidenceUrl: string | null
  onCloseEvidence: () => void
  onViewEvidence: (url: string) => void
  viewingSubmission: ExamSubmission | null
  onCloseViewingSubmission: () => void
  viewingViolationSubmission: ExamSubmission | null
  onCloseViolationSubmission: () => void
  violations: ViolationRecord[]
  isPreviewOpen: boolean
  onClosePreview: () => void
  isMakeupModalOpen: boolean
  onCloseMakeupModal: () => void
  submissions: ExamSubmission[]
  selectedSession?: ExamSchedule | null
  examDefaults: any
  onRefresh: () => Promise<void>
  onReloadSubmissions: () => Promise<void>
  isAssignModalOpen: boolean
  onCloseAssignModal: () => void
  editingSession: ExamSchedule | null
  courses: CourseOffering[]
  resultReleaseMode: ResultReleaseMode
  resultReleaseAt: string
  saveSchedule: (session: any, editingSessionId?: string) => Promise<any>
  setSelectedSessionId: (idOrFn: (curr: string) => string) => void
  setActiveTab: (tab: any) => void
  viewingSession: ExamSchedule | null
  onCloseViewingSession: () => void
  cancellingSession: ExamSchedule | null
  onCloseCancellingSession: () => void
  cancelSchedule: (id: string, reason: string) => Promise<any>
  distributionLock: {
    action: 'LOCK' | 'UNLOCK' | null
    saving: boolean
    close: () => void
    confirm: () => Promise<void>
  }
}

export default function ExamDetailDialogs({
  exam,
  selectedEvidenceUrl,
  onCloseEvidence,
  onViewEvidence,
  viewingSubmission,
  onCloseViewingSubmission,
  viewingViolationSubmission,
  onCloseViolationSubmission,
  violations,
  isPreviewOpen,
  onClosePreview,
  isMakeupModalOpen,
  onCloseMakeupModal,
  submissions,
  selectedSession,
  examDefaults,
  onRefresh,
  onReloadSubmissions,
  isAssignModalOpen,
  onCloseAssignModal,
  editingSession,
  courses,
  resultReleaseMode,
  resultReleaseAt,
  saveSchedule,
  setSelectedSessionId,
  setActiveTab,
  viewingSession,
  onCloseViewingSession,
  cancellingSession,
  onCloseCancellingSession,
  cancelSchedule,
  distributionLock,
}: ExamDetailDialogsProps) {
  return (
    <>
      <EvidenceImageModal
        imageUrl={selectedEvidenceUrl}
        onClose={onCloseEvidence}
      />
      <StudentSubmissionReviewModal
        exam={exam}
        submission={viewingSubmission}
        onClose={onCloseViewingSubmission}
      />
      <SubmissionViolationsModal
        submission={viewingViolationSubmission}
        violations={violations.filter(
          (violation) => violation.attemptId === viewingViolationSubmission?.attemptId,
        )}
        onClose={onCloseViolationSubmission}
        onViewEvidence={onViewEvidence}
      />
      <ExamPreviewModal
        exam={exam}
        isOpen={isPreviewOpen}
        onClose={onClosePreview}
      />
      <MakeupScheduleModal
        isOpen={isMakeupModalOpen}
        submissions={submissions}
        defaultDurationMinutes={selectedSession?.durationMinutes ?? exam.defaultDurationMinutes}
        onClose={onCloseMakeupModal}
        onCreate={async (input) => {
          if (!selectedSession) return
          await createTeacherMakeupSchedule(exam.id, selectedSession.id, {
            courseOfferingId:
              selectedSession.courseOfferingId ||
              selectedSession.courseOfferings?.[0]?.id ||
              '',
            startTime: input.startTime,
            endTime: input.endTime,
            durationMinutes: input.durationMinutes,
            maxAttempts: 1,
            password: input.password,
            resultReleaseMode: 'MANUAL',
            resultReleaseAt: null,
            allowStudentReview: false,
            enableTabLock: selectedSession.enableTabLock ?? examDefaults.enableTabLock,
            requireFullscreen: selectedSession.requireFullscreen ?? examDefaults.requireFullscreen,
            enableWebcam: selectedSession.enableWebcam ?? examDefaults.enableWebcam,
            enableScreenMonitoring:
              selectedSession.enableScreenMonitoring ?? examDefaults.enableScreenMonitoring,
            blockCopyPaste: selectedSession.blockCopyPaste ?? examDefaults.blockCopyPaste,
            blockRightClick: selectedSession.blockRightClick ?? examDefaults.blockRightClick,
            locationMode: 'ONLINE',
            allowedIpRanges: [],
            distributionMode: 'SHUFFLE_QUESTIONS_AND_OPTIONS',
            randomQuestionCount: null,
            studentIds: input.studentIds,
          })
          await onRefresh()
          await onReloadSubmissions()
          onCloseMakeupModal()
          toast.success('Đã tạo ca thi dự phòng.')
        }}
      />
      <AssignExamToCourseModal
        isOpen={isAssignModalOpen}
        examId={exam.id}
        subjectName={exam.subjectName}
        courses={courses}
        onClose={onCloseAssignModal}
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
          enableScreenMonitoring:
            editingSession?.enableScreenMonitoring ?? examDefaults.enableScreenMonitoring,
          blockCopyPaste: editingSession?.blockCopyPaste ?? examDefaults.blockCopyPaste,
          blockRightClick: editingSession?.blockRightClick ?? examDefaults.blockRightClick,
          ipMode: editingSession?.ipMode ?? 'HOME',
          allowedIpRange: editingSession?.allowedIpRange,
          distributionMode: editingSession?.distributionMode ?? 'SHUFFLE_QUESTIONS_AND_OPTIONS',
        }}
        initialSessions={editingSession ? [editingSession] : undefined}
        initialEditingSessionId={editingSession?.id}
        onCreateSessions={async (newSessions) => {
          const saved = await Promise.all(
            newSessions.map((session) => saveSchedule(session, editingSession?.id)),
          )
          await onRefresh()
          setSelectedSessionId((current) => current || saved[0]?.id || '')
          setActiveTab('sessions')
          toast.success(editingSession ? 'Đã cập nhật ca thi.' : 'Đã tạo ca thi.')
        }}
      />
      <ExamSessionDetailModal
        session={viewingSession}
        onClose={onCloseViewingSession}
      />
      <CancelTeacherScheduleDialog
        key={cancellingSession?.id ?? 'closed-schedule-dialog'}
        schedule={cancellingSession}
        onClose={onCloseCancellingSession}
        onConfirm={async (reason) => {
          if (!cancellingSession) return
          await cancelSchedule(cancellingSession.id, reason)
          await onRefresh()
          onCloseCancellingSession()
          toast.success('Đã hủy ca thi.')
        }}
      />
      <ExamDistributionLockDialog
        action={distributionLock.action}
        saving={distributionLock.saving}
        onClose={distributionLock.close}
        onConfirm={() => void distributionLock.confirm()}
      />
    </>
  )
}
