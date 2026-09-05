import {
  CourseOffering,
  Exam,
  ExamSchedule,
  ExamScheduleStatus,
  ExamType,
  PrismaClient,
  Teacher,
} from '@prisma/client'
import { QUIZ_BASE_OFFSET, QUIZ_SPACING_DAYS, SEED_MODE } from './seed.config'

interface ExamScheduleSeedInput {
  exams: Exam[]
  courseOfferings: CourseOffering[]
  teachers: Teacher[]
}

function offsetDate(days: number, hour = 8): Date {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date
}

function getScheduleStatus(exam: Exam): ExamScheduleStatus {
  if (SEED_MODE === 'demo' || exam.type === ExamType.QUIZ) {
    return ExamScheduleStatus.CLOSED
  }
  return exam.type === ExamType.MIDTERM
    ? ExamScheduleStatus.SCHEDULED
    : ExamScheduleStatus.DRAFT
}

function getStartOffset(exam: Exam): number {
  if (exam.type === ExamType.QUIZ) {
    const quizNumber = Number(exam.id.match(/quiz-(\d+)$/)?.[1] ?? 1)
    return QUIZ_BASE_OFFSET + (quizNumber - 1) * QUIZ_SPACING_DAYS
  }
  return exam.type === ExamType.MIDTERM ? 16 : 60
}

function safePathPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildProctoringStoragePath(exam: Exam, scheduleId: string, startTime: Date): string {
  const academicYear = safePathPart(exam.semesterId)
  const subject = safePathPart(exam.subjectId)
  const timestamp = startTime.toISOString().slice(0, 16).replace(/[-:T]/g, '')
  return `proctoring/${academicYear}/${subject}/ca-${timestamp}/${safePathPart(scheduleId)}`
}

export async function seedExamSchedules(
  prisma: PrismaClient,
  { exams, courseOfferings, teachers }: ExamScheduleSeedInput,
): Promise<ExamSchedule[]> {
  console.log('Seeding Exam Schedules...')

  const schedules: ExamSchedule[] = []
  for (const exam of exams) {
    const applicableOfferings = courseOfferings.filter(
      (offering) => offering.subjectId === exam.subjectId,
    )
    if (applicableOfferings.length === 0) continue

    const startTime = offsetDate(getStartOffset(exam))
    const endTime = new Date(startTime.getTime() + exam.defaultDurationMinutes * 60_000)
    const status = getScheduleStatus(exam)
    const creator = teachers.find((teacher) => teacher.id === exam.createdById) ?? teachers[0]
    const scheduleId = `schedule-${exam.id}`
    const enableWebcam = exam.type === ExamType.FINAL
    const enableScreenMonitoring = exam.type === ExamType.FINAL || exam.type === ExamType.MIDTERM
    const proctoringStoragePath = buildProctoringStoragePath(exam, scheduleId, startTime)
    const schedule = await prisma.examSchedule.upsert({
      where: { id: scheduleId },
      update: {
        title: `Ca thi ${exam.title}`,
        startTime,
        endTime,
        durationMinutes: exam.defaultDurationMinutes,
        enableWebcam,
        enableScreenMonitoring,
        proctoringStoragePath,
        status,
      },
      create: {
        id: scheduleId,
        title: `Ca thi ${exam.title}`,
        examId: exam.id,
        startTime,
        endTime,
        durationMinutes: exam.defaultDurationMinutes,
        maxAttempts: 1,
        enableTabLock: true,
        maxTabSwitches: 3,
        requireFullscreen: true,
        enableWebcam,
        enableScreenMonitoring,
        blockCopyPaste: true,
        blockRightClick: true,
        proctoringStoragePath,
        distributionMode: 'SHUFFLE_QUESTIONS_AND_OPTIONS',
        resultReleaseMode: status === ExamScheduleStatus.CLOSED ? 'IMMEDIATE' : 'MANUAL',
        reviewPolicy: status === ExamScheduleStatus.CLOSED ? 'SCORE_ONLY' : 'NONE',
        status,
        publishedAt: status === ExamScheduleStatus.DRAFT ? null : offsetDate(getStartOffset(exam) - 1),
        createdById: creator.userId,
      },
    })

    for (const [offeringIndex, offering] of applicableOfferings.entries()) {
      const scheduleCourse = await prisma.examScheduleCourse.upsert({
        where: {
          examScheduleId_courseOfferingId: {
            examScheduleId: schedule.id,
            courseOfferingId: offering.id,
          },
        },
        update: {},
        create: {
          id: `schedule-course-${exam.id}-${offering.id}`,
          examScheduleId: schedule.id,
          courseOfferingId: offering.id,
        },
      })
      const proctor = teachers[offeringIndex % teachers.length]
      await prisma.examScheduleProctor.upsert({
        where: {
          examScheduleCourseId_teacherId: {
            examScheduleCourseId: scheduleCourse.id,
            teacherId: proctor.id,
          },
        },
        update: {},
        create: {
          id: `schedule-proctor-${exam.id}-${offering.id}-${proctor.id}`,
          examScheduleCourseId: scheduleCourse.id,
          teacherId: proctor.id,
        },
      })
    }

    schedules.push(schedule)
  }

  console.log(`✓ Exam Schedules completed (${schedules.length})`)
  return schedules
}
