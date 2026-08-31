import { distributionOptions, releaseOptions } from '../constants/finalExamScheduleOptions'
import type { AdminExam, AdminExamSchedule, AdminSubject, AdminUser, CourseOfferingAdmin, Department } from '../types/admin.types'
import type {
  CourseOfferingApiDto, DepartmentApiDto, ExamScheduleApiDto, ReadyFinalExamApiDto,
  SchedulePayload, SubjectApiDto, UserApiDto,
} from '../types/admin-api.types'

const dateFormatter = new Intl.DateTimeFormat('vi-VN')
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
const optionLabel = (options: Array<{ value: string; label: string }>, value: string) => options.find((item) => item.value === value)?.label ?? value

const computeScheduleStatus = (
  status: string,
  startTime: string | Date,
  endTime: string | Date,
): AdminExamSchedule['status'] => {
  if (status === 'CANCELLED' || status === 'DRAFT') {
    return status as AdminExamSchedule['status']
  }
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  if (now < start) return 'SCHEDULED'
  if (now >= start && now < end) return 'OPEN'
  return 'CLOSED'
}

export const toAdminSchedule = (row: ExamScheduleApiDto): AdminExamSchedule => ({
  id: row.id, examId: row.exam.id, examTitle: row.title, subjectName: row.exam.subject.name,
  courseCodes: row.courses.map(({ code }) => code), date: dateFormatter.format(new Date(row.startTime)),
  time: `${timeFormatter.format(new Date(row.startTime))} - ${timeFormatter.format(new Date(row.endTime))}`,
  location: row.locationMode === 'CAMPUS' ? 'Mạng trường' : 'Trực tuyến',
  ipPolicy: row.allowedIpRanges.length ? row.allowedIpRanges.join(', ') : 'Không giới hạn IP',
  hasPassword: row.hasPassword,
  distributionMode: optionLabel(distributionOptions, row.distributionMode),
  releaseMode: optionLabel(releaseOptions, row.resultReleaseMode), resultReleaseAt: row.resultReleaseAt ?? undefined,
  allowStudentReview: row.reviewPolicy !== 'NONE', requireFullscreen: row.requireFullscreen,
  enableWebcam: row.enableWebcam, blockCopyPaste: row.blockCopyPaste, blockRightClick: row.blockRightClick,
  proctors: [...new Set(row.courses.flatMap(({ proctors }) => proctors.map(({ fullName }) => fullName)))],
  proctorAssignments: row.courses.flatMap((course) => course.proctors.map((teacher) => ({
    courseOfferingId: course.id, courseCode: course.code, teacherId: teacher.id, teacherName: teacher.fullName,
  }))),
  status: computeScheduleStatus(row.status, row.startTime, row.endTime),
})

export function toAdminExam(row: ReadyFinalExamApiDto): AdminExam {
  return {
    id: row.id, title: row.title, semesterCode: row.semester.code, departmentId: row.subject.departmentId,
    subjectCode: row.subject.code, subjectName: row.subject.name, authorName: row.createdBy.user.fullName,
    category: 'FINAL', structure: row.format as AdminExam['structure'], totalPoints: Number(row.totalPoints),
    questionCount: row._count.examQuestions, durationMinutes: row.defaultDurationMinutes, status: 'APPROVED',
  }
}

export const toDepartment = (row: DepartmentApiDto): Department => ({ id: row.id, name: row.name, subjectCount: 0 })
export const toSubject = (row: SubjectApiDto): AdminSubject => ({
  id: row.id, code: row.code, name: row.name, departmentId: row.department.id,
  credits: row.credits, courseCount: 0, status: row.status as AdminSubject['status'],
})
export const toCourse = (row: CourseOfferingApiDto): CourseOfferingAdmin => ({
  id: row.id, code: row.code, subjectCode: row.subject.code, subjectName: row.subject.name,
  semesterCode: row.semester.code, teacherId: row.teacher.id, teacherName: row.teacher.fullName,
  enrolled: row.enrollmentCount,
  capacity: row.maxCapacity, status: row.status === 'ACTIVE' ? 'OPEN' : 'CLOSED',
})
export const toTeacher = (row: UserApiDto): AdminUser => ({
  id: row.profileId, code: row.code, fullName: row.fullName, email: '', role: 'TEACHER',
  status: row.status === 'ACTIVE' ? 'ACTIVE' : 'LOCKED',
})

const parseDate = (value: string) => {
  const [day, month, year] = value.split('/')
  return `${year}-${month}-${day}`
}

export function toSchedulePayload(schedule: AdminExamSchedule, existing: boolean): SchedulePayload {
  const date = parseDate(schedule.date)
  const [start, end] = schedule.time.split(' - ')
  const startTime = new Date(`${date}T${start}:00`)
  const endTime = new Date(`${date}T${end}:00`)
  const grouped = new Map<string, string[]>()
  schedule.proctorAssignments?.forEach(({ courseOfferingId, teacherId }) => {
    grouped.set(courseOfferingId, [...(grouped.get(courseOfferingId) ?? []), teacherId])
  })
  return {
    title: schedule.examTitle, examId: schedule.examId!, startTime: startTime.toISOString(), endTime: endTime.toISOString(),
    durationMinutes: Math.round((endTime.getTime() - startTime.getTime()) / 60000), maxAttempts: 1,
    ...(!existing && schedule.password ? { password: schedule.password } : {}),
    ...(existing && schedule.password ? { password: schedule.password } : {}),
    enableTabLock: true, maxTabSwitches: 3, requireFullscreen: schedule.requireFullscreen ?? true,
    enableWebcam: schedule.enableWebcam ?? true, blockCopyPaste: schedule.blockCopyPaste ?? true,
    blockRightClick: schedule.blockRightClick ?? true,
    locationMode: schedule.ipPolicy === 'Không giới hạn IP' ? 'ONLINE' : 'CAMPUS',
    allowedIpRanges: schedule.ipPolicy === 'Không giới hạn IP' ? [] : [schedule.ipPolicy],
    distributionMode: distributionOptions.find(({ label }) => label === schedule.distributionMode)?.value ?? 'FIXED_ORDER',
    randomQuestionCount: null,
    resultReleaseMode: releaseOptions.find(({ label }) => label === schedule.releaseMode)?.value ?? 'MANUAL',
    resultReleaseAt: schedule.resultReleaseAt ? new Date(schedule.resultReleaseAt).toISOString() : null,
    reviewPolicy: schedule.allowStudentReview ? 'FULL_AFTER_RELEASE' : 'NONE', reviewStartAt: null, reviewEndAt: null,
    status: schedule.status === 'DRAFT' ? 'DRAFT' : 'SCHEDULED',
    courses: [...grouped].map(([courseOfferingId, teacherIds]) => ({ courseOfferingId, teacherIds })),
  }
}
