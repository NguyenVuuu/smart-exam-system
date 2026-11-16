import { Prisma, PrismaClient } from '@prisma/client'
import { studentInsights } from '../src/modules/learning-analytics/services/learning-analytics.service'

const prisma = new PrismaClient()

const STUDENT_CODE = process.argv[2] ?? 'US000006'
const PREFIX = 'demo-learning-insights'
const QUESTION_COUNT = 5

function demoId(kind: string, ownerId: string, index?: number): string {
  return [PREFIX, kind, ownerId, index].filter((part) => part !== undefined).join('-')
}

async function seedDemo(client: Prisma.TransactionClient, studentCode: string) {
  const student = await client.student.findUnique({
    where: { studentCode },
    select: {
      id: true,
      user: { select: { fullName: true } },
      enrollments: {
        orderBy: { enrolledAt: 'desc' },
        take: 1,
        select: {
          courseOfferingId: true,
          semesterId: true,
          subjectId: true,
          courseOffering: {
            select: {
              code: true,
              teacherId: true,
              subject: { select: { name: true } },
            },
          },
        },
      },
    },
  })
  if (!student) throw new Error(`Student ${studentCode} was not found`)

  const enrollment = student.enrollments[0]
  if (!enrollment) throw new Error(`Student ${studentCode} has no course enrollment`)

  const ownerId = student.id
  const examId = demoId('exam', ownerId)
  const scheduleId = demoId('schedule', ownerId)
  const defaultAttemptId = demoId('attempt', ownerId)
  const topicCode = `DEMO-WEAK-${studentCode}`
  const now = new Date()
  const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const endTime = new Date(now.getTime() - 60 * 60 * 1000)

  const topic = await client.learningTopic.upsert({
    where: { subjectId_code: { subjectId: enrollment.subjectId, code: topicCode } },
    update: { name: 'Kiến thức nền tảng cần ôn' },
    create: {
      id: demoId('topic', ownerId),
      subjectId: enrollment.subjectId,
      code: topicCode,
      name: 'Kiến thức nền tảng cần ôn',
    },
  })

  await client.exam.upsert({
    where: { id: examId },
    update: {
      title: `[Dữ liệu mẫu] Phân tích học tập - ${studentCode}`,
      subjectId: enrollment.subjectId,
      semesterId: enrollment.semesterId,
      createdById: enrollment.courseOffering.teacherId,
      status: 'READY',
    },
    create: {
      id: examId,
      title: `[Dữ liệu mẫu] Phân tích học tập - ${studentCode}`,
      description: `Dữ liệu mẫu để hiển thị chủ đề cần chú ý cho ${student.user.fullName}`,
      subjectId: enrollment.subjectId,
      semesterId: enrollment.semesterId,
      createdById: enrollment.courseOffering.teacherId,
      defaultDurationMinutes: 60,
      totalPoints: '10.00',
      format: 'OBJECTIVE',
      status: 'READY',
      approvalStatus: 'NOT_REQUIRED',
      creationMethod: 'MANUAL',
      type: 'QUIZ',
    },
  })

  const questions: Array<{ id: string; correctOptionId: string }> = []
  for (let index = 0; index < QUESTION_COUNT; index += 1) {
    const questionId = demoId('question', ownerId, index + 1)
    await client.examQuestion.upsert({
      where: { id: questionId },
      update: {
        orderIndex: index,
        title: `Câu hỏi nền tảng ${index + 1}`,
        content: `Câu hỏi dữ liệu mẫu số ${index + 1} của môn ${enrollment.courseOffering.subject.name}.`,
        points: '2.00',
      },
      create: {
        id: questionId,
        examId,
        orderIndex: index,
        title: `Câu hỏi nền tảng ${index + 1}`,
        content: `Câu hỏi dữ liệu mẫu số ${index + 1} của môn ${enrollment.courseOffering.subject.name}.`,
        explanation: 'Dữ liệu mẫu phục vụ minh họa phân tích chủ đề học tập.',
        type: 'SINGLE_CHOICE',
        difficulty: 'MEDIUM',
        points: '2.00',
      },
    })

    await client.examQuestionTopic.upsert({
      where: { examQuestionId_topicId: { examQuestionId: questionId, topicId: topic.id } },
      update: { code: topic.code, name: topic.name },
      create: {
        examQuestionId: questionId,
        topicId: topic.id,
        code: topic.code,
        name: topic.name,
      },
    })

    const options = await Promise.all([
      client.examQuestionOption.upsert({
        where: { examQuestionId_orderIndex: { examQuestionId: questionId, orderIndex: 0 } },
        update: { content: 'Phương án đúng', isCorrect: true },
        create: { examQuestionId: questionId, orderIndex: 0, content: 'Phương án đúng', isCorrect: true },
      }),
      client.examQuestionOption.upsert({
        where: { examQuestionId_orderIndex: { examQuestionId: questionId, orderIndex: 1 } },
        update: { content: 'Phương án chưa đúng', isCorrect: false },
        create: { examQuestionId: questionId, orderIndex: 1, content: 'Phương án chưa đúng', isCorrect: false },
      }),
    ])
    questions.push({ id: questionId, correctOptionId: options[0].id })
  }

  await client.examSchedule.upsert({
    where: { id: scheduleId },
    update: {
      title: `[Dữ liệu mẫu] Kết quả đã công bố - ${studentCode}`,
      startTime,
      endTime,
      status: 'CLOSED',
      resultReleaseMode: 'IMMEDIATE',
      resultsPublishedAt: endTime,
      reviewPolicy: 'FULL_AFTER_RELEASE',
      publishedAt: startTime,
    },
    create: {
      id: scheduleId,
      examId,
      title: `[Dữ liệu mẫu] Kết quả đã công bố - ${studentCode}`,
      startTime,
      endTime,
      durationMinutes: 60,
      maxAttempts: 1,
      status: 'CLOSED',
      resultReleaseMode: 'IMMEDIATE',
      resultsPublishedAt: endTime,
      reviewPolicy: 'FULL_AFTER_RELEASE',
      publishedAt: startTime,
      createdById: (await client.teacher.findUniqueOrThrow({
        where: { id: enrollment.courseOffering.teacherId },
        select: { userId: true },
      })).userId,
    },
  })

  await client.examScheduleCourse.upsert({
    where: {
      examScheduleId_courseOfferingId: {
        examScheduleId: scheduleId,
        courseOfferingId: enrollment.courseOfferingId,
      },
    },
    update: {},
    create: {
      id: demoId('schedule-course', ownerId),
      examScheduleId: scheduleId,
      courseOfferingId: enrollment.courseOfferingId,
    },
  })

  await client.examScheduleStudent.upsert({
    where: { examScheduleId_studentId: { examScheduleId: scheduleId, studentId: student.id } },
    update: {},
    create: {
      id: demoId('schedule-student', ownerId),
      examScheduleId: scheduleId,
      studentId: student.id,
    },
  })

  const attempt = await client.examAttempt.upsert({
    where: {
      examScheduleId_studentId_attemptNo: {
        examScheduleId: scheduleId,
        studentId: student.id,
        attemptNo: 1,
      },
    },
    update: {
      status: 'PUBLISHED',
      totalScore: '2.00',
      autoScore: '2.00',
      manualScore: '0.00',
      invalidatedAt: null,
    },
    create: {
      id: defaultAttemptId,
      examScheduleId: scheduleId,
      courseOfferingId: enrollment.courseOfferingId,
      studentId: student.id,
      attemptNo: 1,
      startedAt: startTime,
      deadlineAt: endTime,
      submittedAt: endTime,
      lastSavedAt: endTime,
      endedBy: 'STUDENT',
      status: 'PUBLISHED',
      totalScore: '2.00',
      autoScore: '2.00',
      manualScore: '0.00',
    },
  })

  for (const [index, question] of questions.entries()) {
    await client.examAttemptQuestion.upsert({
      where: { attemptId_examQuestionId: { attemptId: attempt.id, examQuestionId: question.id } },
      update: { displayOrder: index + 1 },
      create: {
        attemptId: attempt.id,
        examQuestionId: question.id,
        displayOrder: index + 1,
        shuffledOptionIds: [],
      },
    })

    const isCorrect = index === 0
    await client.studentAnswer.upsert({
      where: { attemptId_examQuestionId: { attemptId: attempt.id, examQuestionId: question.id } },
      update: {
        selectedOptionIds: isCorrect ? [question.correctOptionId] : [],
        isCorrect,
        score: isCorrect ? '2.00' : '0.00',
      },
      create: {
        attemptId: attempt.id,
        examQuestionId: question.id,
        selectedOptionIds: isCorrect ? [question.correctOptionId] : [],
        isCorrect,
        score: isCorrect ? '2.00' : '0.00',
      },
    })
  }

  return { studentId: student.id, studentCode, topicId: topic.id }
}

async function main() {
  const seeded = await seedDemo(prisma, STUDENT_CODE)
  const insights = await studentInsights(seeded.studentId)
  const topic = insights.topics.find(({ topicId }) => topicId === seeded.topicId)
  if (!topic?.sufficientData || !topic.needsPractice) {
    throw new Error(`Seed verification failed for ${STUDENT_CODE}`)
  }

  console.log(`Seeded learning insights for ${STUDENT_CODE}`)
  console.log(`${topic.name}: ${topic.percentage}% (${topic.questionCount} observations, needs practice)`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
