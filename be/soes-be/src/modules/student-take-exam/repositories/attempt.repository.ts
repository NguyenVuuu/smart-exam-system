import prisma from '../../../lib/prisma'

export async function countAttemptsForSchedule(scheduleId: string, studentId: string) {
  return prisma.examAttempt.count({ where: { examScheduleId: scheduleId, studentId } })
}

export async function findActiveAttempt(scheduleId: string, studentId: string) {
  return prisma.examAttempt.findFirst({
    where: { examScheduleId: scheduleId, studentId, status: 'IN_PROGRESS' },
    orderBy: { attemptNo: 'desc' },
    select: { id: true, startedAt: true, deadlineAt: true },
  })
}

export async function findAttemptWithContent(
  attemptId: string,
  scheduleId: string,
  studentId: string,
) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      examScheduleId: true,
      studentId: true,
      startedAt: true,
      deadlineAt: true,
      status: true,
      examSchedule: {
        select: {
          title: true,
          durationMinutes: true,
          endTime: true,
          exam: { select: { id: true } },
        },
      },
      attemptQuestions: {
        orderBy: { displayOrder: 'asc' },
        select: {
          displayOrder: true,
          examQuestionId: true,
          shuffledOptionIds: true,
          examQuestion: {
            select: {
              id: true,
              content: true,
              type: true,
              language: true,
              points: true,
              options: {
                orderBy: { orderIndex: 'asc' },
                select: { id: true, content: true },
              },
            },
          },
        },
      },
      studentAnswers: {
        select: { examQuestionId: true, selectedOptionIds: true, draftSourceCode: true },
      },
    },
  })
  if (!attempt || attempt.examScheduleId !== scheduleId || attempt.studentId !== studentId) {
    return null
  }
  return {
    attempt,
    pointsMap: new Map(
      attempt.attemptQuestions.map(({ examQuestion }) => [examQuestion.id, Number(examQuestion.points)]),
    ),
    answerMap: new Map(
      attempt.studentAnswers.map((answer) => [answer.examQuestionId, answer]),
    ),
  }
}

export interface CreateAttemptInput {
  scheduleId: string
  examId: string
  courseOfferingId: string
  studentId: string
  startedAt: Date
  deadlineAt: Date
  attemptNo: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  randomQuestionCount: number | null
  ipAddress: string
  deviceInfo: string
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export async function createAttemptSafe(input: CreateAttemptInput) {
  return prisma.$transaction(async (transaction) => {
    const questions = await transaction.examQuestion.findMany({
      where: { examId: input.examId },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, options: { orderBy: { orderIndex: 'asc' }, select: { id: true } } },
    })
    const ordered = input.shuffleQuestions ? shuffled(questions) : questions
    const selected = input.randomQuestionCount ? ordered.slice(0, input.randomQuestionCount) : ordered
    const attempt = await transaction.examAttempt.create({
      data: {
        examScheduleId: input.scheduleId,
        courseOfferingId: input.courseOfferingId,
        studentId: input.studentId,
        attemptNo: input.attemptNo,
        startedAt: input.startedAt,
        deadlineAt: input.deadlineAt,
        lastSavedAt: input.startedAt,
        status: 'IN_PROGRESS',
      },
      select: { id: true, startedAt: true, deadlineAt: true },
    })
    await transaction.examSession.create({
      data: {
        attemptId: attempt.id,
        lastHeartbeat: input.startedAt,
        isOnline: true,
        ipAddress: input.ipAddress,
        deviceInfo: input.deviceInfo,
      },
    })
    if (selected.length) {
      await transaction.examAttemptQuestion.createMany({
        data: selected.map((question, index) => {
          const optionIds = question.options.map((option) => option.id)
          return {
            attemptId: attempt.id,
            examQuestionId: question.id,
            displayOrder: index + 1,
            shuffledOptionIds: input.shuffleOptions ? shuffled(optionIds) : optionIds,
          }
        }),
      })
    }
    return attempt
  })
}

export async function submitAttempt(
  attemptId: string,
  scheduleId: string,
  studentId: string,
  submittedAt: Date,
) {
  return prisma.examAttempt.updateMany({
    where: {
      id: attemptId,
      examScheduleId: scheduleId,
      studentId,
      status: 'IN_PROGRESS',
      deadlineAt: { gt: submittedAt },
    },
    data: { status: 'SUBMITTED', submittedAt, endedBy: 'STUDENT' },
  })
}

export async function findAttemptIdentity(attemptId: string) {
  return prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: { examScheduleId: true, studentId: true, status: true, deadlineAt: true },
  })
}

export async function findAttemptStatus(attemptId: string, scheduleId: string, studentId: string) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    select: {
      id: true,
      status: true,
      startedAt: true,
      deadlineAt: true,
      submittedAt: true,
      endedBy: true,
      lastSavedAt: true,
      examSession: { select: { lastHeartbeat: true } },
      _count: { select: { studentAnswers: true, attemptQuestions: true } },
    },
  })
}
