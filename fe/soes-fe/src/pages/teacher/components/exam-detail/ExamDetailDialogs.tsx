import { useEffect, useState } from 'react'
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
import { createTeacherMakeupSchedule, getTeacherExamsBySubject } from '../../api/teacher-exams.api'
import type { TeacherExamDto } from '../../types/teacher-exam-api.types'
import type {
  Exam,
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
  ViolationRecord,
} from '../../types/teacher-exam.types'
import type { TeacherExamDefaultsDto } from '../../types/teacher-exam-api.types'
import type { CourseOffering } from '../../types/teacher-course.types'
import type { ExamDetailTab } from './ExamDetailTabsNav'

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
  /** Violations ca gốc — chỉ có khi SV đang xem là ca dự phòng */
  sourceViolations?: ViolationRecord[]
  isPreviewOpen: boolean
  onClosePreview: () => void
  isMakeupModalOpen: boolean
  onCloseMakeupModal: () => void
  submissions: ExamSubmission[]
  selectedSession?: ExamSchedule | null
  examDefaults: TeacherExamDefaultsDto
  onRefresh: () => Promise<void>
  onReloadSubmissions: () => Promise<void>
  isAssignModalOpen: boolean
  onCloseAssignModal: () => void
  editingSession: ExamSchedule | null
  courses: CourseOffering[]
  resultReleaseMode: ResultReleaseMode
  resultReleaseAt: string
  saveSchedule: (session: ExamSchedule, editingSessionId?: string) => Promise<ExamSchedule>
  setSelectedSessionId: (idOrFn: (curr: string) => string) => void
  setActiveTab: (tab: ExamDetailTab) => void
  viewingSession: ExamSchedule | null
  onCloseViewingSession: () => void
  cancellingSession: ExamSchedule | null
  onCloseCancellingSession: () => void
  cancelSchedule: (id: string, reason: string) => Promise<void>
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
  sourceViolations,
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
  const [availableExams, setAvailableExams] = useState<TeacherExamDto[]>([])

  // Load đề cùng môn khi mở modal dự phòng
  useEffect(() => {
    if (!isMakeupModalOpen) return
    getTeacherExamsBySubject(exam.subjectId)
      .then((items) =>
        // Lọc bỏ đề hiện tại và chỉ lấy PUBLISHED/LOCKED
        setAvailableExams(
          items.filter(
            (e) => e.id !== exam.id && (e.status === 'READY' || e.status === 'LOCKED'),
          ),
        ),
      )
      .catch(() => setAvailableExams([]))
  }, [isMakeupModalOpen, exam.id, exam.subjectId])

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
        sourceViolations={sourceViolations}
        onClose={onCloseViolationSubmission}
        onViewEvidence={onViewEvidence}
      />
      <ExamPreviewModal
        exam={exam}
        isOpen={isPreviewOpen}
        onClose={onClosePreview}
      />
      {selectedSession && (
        <MakeupScheduleModal
          isOpen={isMakeupModalOpen}
          examId={exam.id}
          scheduleId={selectedSession.id}
          sourceSchedule={selectedSession}
          subjectId={exam.subjectId}
          submissions={submissions}
          availableExams={availableExams}
          onClose={onCloseMakeupModal}
          onCreate={async (input) => {
            await createTeacherMakeupSchedule(exam.id, selectedSession.id, {
              studentIds: input.studentIds,
              makeupExamId: input.makeupExamId,
              startTime: input.startTime,
              endTime: input.endTime,
              durationMinutes: input.durationMinutes,
              password: input.password,
              enableTabLock: input.enableTabLock,
              requireFullscreen: input.requireFullscreen,
              enableWebcam: input.enableWebcam,
              enableScreenMonitoring: input.enableScreenMonitoring,
              blockCopyPaste: input.blockCopyPaste,
              blockRightClick: input.blockRightClick,
            })
            await onRefresh()
            await onReloadSubmissions()
            onCloseMakeupModal()
            toast.success('Đã tạo ca thi dự phòng.')
          }}
        />
      )}
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
