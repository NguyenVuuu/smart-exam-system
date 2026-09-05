import type { TeacherExamDetailDto, TeacherExamDto, TeacherExamScheduleDto, TeacherExamSchedulePayload } from '../types/teacher-exam-api.types'
import type { Exam, ExamSchedule, ExamStatus, ExamType } from '../types/teacher-exam.types'

const statusOf = (dto: TeacherExamDto): ExamStatus => {
  if (dto.approvalStatus === 'PENDING') return 'PENDING_APPROVAL'
  if (dto.approvalStatus === 'REJECTED') return 'REJECTED'
  if (dto.status === 'READY') return 'PUBLISHED'
  return dto.status
}

const formatOf = (format: TeacherExamDto['format']): ExamType =>
  format === 'OBJECTIVE' ? 'MULTIPLE_CHOICE' : format

export const toExam = (dto: TeacherExamDto): Exam => ({
  id: dto.id,
  authorId: dto.creator.id,
  authorName: dto.creator.fullName,
  subjectId: dto.subject.id,
  subjectCode: dto.subject.code,
  subjectName: dto.subject.name,
  semesterId: dto.semester.id,
  semesterCode: dto.semester.code,
  semesterName: dto.semester.name,
  title: dto.title,
  description: dto.description ?? '',
  category: dto.type,
  type: formatOf(dto.format),
  creationMethod: dto.creationMethod,
  status: statusOf(dto),
  studentVisibility: dto.studentVisibility,
  defaultDurationMinutes: dto.defaultDurationMinutes,
  sections: dto.sections.map((section) => ({
    id: section.id, title: section.title, description: section.description ?? undefined,
    type: section.type, targetPoints: section.targetPoints, order: section.orderIndex,
  })),
  questions: [],
  questionCount: dto.questionCount,
  scheduleCount: dto.scheduleCount,
  totalPoints: dto.totalPoints,
  createdAt: dto.createdAt,
  rejectionReason: dto.rejectionReason ?? undefined,
  capabilities: dto.capabilities,
})

export const toExamDetail = (dto: TeacherExamDetailDto): Exam => ({
  ...toExam(dto),
  questions: dto.questions.map((item) => ({
    questionId: item.sourceQuestionId ?? item.id,
    snapshotQuestionId: item.id,
    sourceQuestionId: item.sourceQuestionId,
    sectionId: item.sectionId ?? undefined,
    points: item.points,
    order: item.orderIndex,
    question: {
      id: item.sourceQuestionId ?? item.id,
      subjectId: dto.subject.id,
      subjectName: dto.subject.name,
      teacherId: dto.creator.id,
      teacherName: dto.creator.fullName,
      type: item.type,
      difficulty: item.difficulty,
      title: item.title,
      content: item.content,
      explanation: item.explanation ?? undefined,
      options: item.options,
      programmingLanguage: item.language ?? undefined,
      timeLimitMs: item.programmingConfig?.timeLimitMs,
      memoryLimitMb: item.programmingConfig?.memoryLimitMb,
      maxCodeSizeKb: item.programmingConfig?.maxCodeSizeKb,
      testCases: item.testCases,
      createdAt: dto.createdAt,
    },
  })),
})

export const toExamSchedule = (dto: TeacherExamScheduleDto): ExamSchedule => {
  const course = dto.courses[0]
  return {
    id: dto.id, examId: dto.exam.id, courseOfferingId: course?.id ?? '', courseCode: course?.code ?? '',
    courseOfferings: dto.courses.map(({ id, code }) => ({ id, code })),
    subjectName: dto.exam.subject.name, startTime: dto.startTime, endTime: dto.endTime,
    durationMinutes: dto.durationMinutes, maxAttempts: dto.maxAttempts, password: '',
    participantCount: dto.participantCount, submissionCount: dto.submissionCount,
    resultReleaseMode: dto.resultReleaseMode === 'NEVER' ? 'MANUAL' : dto.resultReleaseMode,
    resultReleaseAt: dto.resultReleaseAt ?? undefined,
    allowStudentReview: dto.reviewPolicy !== 'NONE', requireFullscreen: dto.requireFullscreen,
    enableWebcam: dto.enableWebcam, blockCopyPaste: dto.blockCopyPaste,
    blockRightClick: dto.blockRightClick, ipMode: dto.locationMode === 'CAMPUS' ? 'CAMPUS' : 'HOME',
    allowedIpRange: dto.allowedIpRanges.join(', '),
    distributionMode: dto.distributionMode === 'SHUFFLE_QUESTIONS' ? 'SHUFFLE_ORDER' : dto.distributionMode,
    randomQuestionCount: dto.randomQuestionCount,
    proctorIds: course?.proctors.map(({ id }) => id) ?? [], status: dto.status,
  }
}

export const toTeacherSchedulePayload = (schedule: ExamSchedule): TeacherExamSchedulePayload => ({
  courseOfferingId: schedule.courseOfferingId,
  startTime: schedule.startTime, endTime: schedule.endTime,
  durationMinutes: schedule.durationMinutes, maxAttempts: schedule.maxAttempts ?? 1,
  ...(schedule.password && { password: schedule.password }),
  requireFullscreen: schedule.requireFullscreen ?? false, enableWebcam: schedule.enableWebcam ?? false,
  blockCopyPaste: schedule.blockCopyPaste ?? true, blockRightClick: schedule.blockRightClick ?? true,
  locationMode: schedule.ipMode === 'CAMPUS' ? 'CAMPUS' : 'ONLINE',
  allowedIpRanges: schedule.ipMode === 'CAMPUS' && schedule.allowedIpRange ? [schedule.allowedIpRange] : [],
  distributionMode: schedule.distributionMode === 'SHUFFLE_ORDER' ? 'SHUFFLE_QUESTIONS' : schedule.distributionMode ?? 'FIXED_ORDER',
  randomQuestionCount: schedule.distributionMode === 'RANDOM_SUBSET' ? schedule.randomQuestionCount : null,
  resultReleaseMode: schedule.resultReleaseMode ?? 'MANUAL',
  resultReleaseAt: schedule.resultReleaseMode === 'SCHEDULED' ? schedule.resultReleaseAt : null,
  allowStudentReview: schedule.allowStudentReview ?? false,
})
