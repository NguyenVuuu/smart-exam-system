import {
  distributionOptions,
  examModeOptions,
  releaseOptions,
} from '../../constants/finalExamScheduleOptions'
import { useFinalExamScheduleForm } from '../../hooks/useFinalExamScheduleForm'
import type { AdminExam, AdminExamSchedule } from '../../types/admin.types'
import type { AdminSubject, AdminUser, CourseOfferingAdmin, Department } from '../../types/admin.types'
import CourseProctorPicker from './CourseProctorPicker'
import FinalExamScheduleFields from './FinalExamScheduleFields'

export default function FinalExamScheduleForm({
  exams,
  schedules,
  departments,
  subjects,
  courses,
  users,
  editingSchedule,
  onClose,
  onSubmit,
}: {
  exams: AdminExam[]
  schedules: AdminExamSchedule[]
  departments: Department[]
  subjects: AdminSubject[]
  courses: CourseOfferingAdmin[]
  users: AdminUser[]
  editingSchedule?: AdminExamSchedule | null
  onClose: () => void
  onSubmit: (schedule: AdminExamSchedule) => void | Promise<void>
}) {
  const { formState, options, actions } = useFinalExamScheduleForm({
    exams,
    schedules,
    departments,
    subjects,
    courses,
    users,
    editingSchedule,
    onClose,
    onSubmit,
  })

  return (
    <form
      id="final-exam-schedule-form"
      onSubmit={(e) => {
        e.preventDefault()
        actions.submitSchedule()
      }}
      className="space-y-6"
    >
      <FinalExamScheduleFields
        departmentId={formState.departmentId}
        subjectCode={formState.subjectCode}
        examId={formState.examId}
        examDate={formState.examDate}
        startTime={formState.startTime}
        endTime={formState.endTime}
        examMode={formState.examMode}
        ipRange={formState.ipRange}
        password={formState.password}
        distributionMode={formState.distributionMode}
        releaseMode={formState.releaseMode}
        releaseAt={formState.releaseAt}
        allowStudentReview={formState.allowStudentReview}
        requireFullscreen={formState.requireFullscreen}
        enableWebcam={formState.enableWebcam}
        blockCopyPaste={formState.blockCopyPaste}
        blockRightClick={formState.blockRightClick}
        departmentOptions={options.departmentOptions}
        subjectOptions={options.subjectOptions}
        examOptions={options.examOptions}
        examModeOptions={examModeOptions}
        distributionOptions={distributionOptions}
        releaseOptions={releaseOptions}
        onDepartmentChange={actions.changeDepartment}
        onSubjectChange={actions.changeSubject}
        onExamChange={actions.changeExam}
        onExamDateChange={actions.setExamDate}
        onStartTimeChange={actions.setStartTime}
        onEndTimeChange={actions.setEndTime}
        onExamModeChange={(val) => actions.setExamMode(val as 'ONLINE' | 'SCHOOL_IP')}
        onIpRangeChange={actions.setIpRange}
        onPasswordChange={actions.setPassword}
        onDistributionModeChange={actions.setDistributionMode}
        onReleaseModeChange={actions.setReleaseMode}
        onReleaseAtChange={actions.setReleaseAt}
        onAllowStudentReviewChange={actions.setAllowStudentReview}
        onRequireFullscreenChange={actions.setRequireFullscreen}
        onEnableWebcamChange={actions.setEnableWebcam}
        onBlockCopyPasteChange={actions.setBlockCopyPaste}
        onBlockRightClickChange={actions.setBlockRightClick}
      />

      <CourseProctorPicker
        courses={options.eligibleCourses}
        selectedCourseIds={formState.selectedCourseIds}
        proctorsByCourse={formState.proctorsByCourse}
        teachers={options.teachers}
        selectedExam={options.selectedExam}
        getAssignmentIssue={actions.getAssignmentIssue}
        getTeacherUnavailableReason={actions.getTeacherUnavailableReason}
        onToggleCourse={actions.toggleCourse}
        onChangeProctors={actions.setProctorsByCourse}
      />
    </form>
  )
}
