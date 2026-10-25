import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import prisma from '../../lib/prisma'
import { reviewExam, submitFinalExam } from '../teacher-exams/repositories/teacher-exam-lifecycle.repository'
import { listReadyExams } from '../exam-schedules/services/exam-schedule.service'
import { reviewBankItem, submitToSharedBank } from '../teacher-questions/repositories/teacher-questions.repository'

test('PostgreSQL accepts one group decision per submitted exam and question', { skip: !process.env.DATABASE_URL }, async () => {
  const suffix = randomUUID().slice(0, 12)
  const ids = { users: [] as string[], teachers: [] as string[], exams: [] as string[], examQuestions: [] as string[], questions: [] as string[], rounds: [] as string[] }
  let departmentId = ''
  let subjectId = ''
  let semesterId = ''
  let groupId = ''
  let bankId = ''
  try {
    const department = await prisma.department.create({ data: { code: `T${suffix}`, name: 'Integration review group' } })
    departmentId = department.id
    const subject = await prisma.subject.create({ data: { code: `S${suffix}`, name: 'Integration subject', departmentId } })
    subjectId = subject.id
    const semester = await prisma.semester.create({ data: {
      code: `K${suffix}`, name: 'Integration semester', academicYear: `TEST-${suffix}`,
      term: 'TERM_1', startDate: new Date('2026-01-01'), endDate: new Date('2026-06-01'),
    } })
    semesterId = semester.id
    for (const position of ['DEPARTMENT_HEAD', 'LECTURER'] as const) {
      const user = await prisma.user.create({ data: { username: `review-${position}-${suffix}`, fullName: position, password: 'test-only', roles: ['TEACHER'] } })
      ids.users.push(user.id)
      const teacher = await prisma.teacher.create({ data: { teacherCode: `GV${ids.users.length}${suffix}`, departmentId, userId: user.id, position } })
      ids.teachers.push(teacher.id)
    }
    const [headId, lecturerId] = ids.teachers
    const group = await prisma.departmentReviewGroup.create({ data: {
      departmentId, name: 'Integration group', createdById: headId,
      members: { create: [{ teacherId: headId }, { teacherId: lecturerId }] },
    } })
    groupId = group.id

    const exam = await prisma.exam.create({ data: {
      title: 'Concurrent final review', subjectId, semesterId, defaultDurationMinutes: 60,
      format: 'OBJECTIVE', type: 'FINAL', createdById: headId, approvalStatus: 'PENDING', status: 'DRAFT',
    } })
    ids.exams.push(exam.id)
    const round = await prisma.examReviewRound.create({ data: {
      examId: exam.id, groupId, version: 1, submittedById: headId, status: 'PENDING', snapshot: {},
    } })
    ids.rounds.push(round.id)
    const decisions = await Promise.allSettled([
      reviewExam(exam.id, headId, true),
      reviewExam(exam.id, lecturerId, false, 'Cần sửa đề và đáp án.'),
    ])
    assert.equal(decisions.filter((decision) => decision.status === 'fulfilled').length, 1)
    assert.equal(await prisma.examReviewDecision.count({ where: { roundId: round.id } }), 1)
    assert.notEqual((await prisma.examReviewRound.findUniqueOrThrow({ where: { id: round.id } })).status, 'PENDING')

    const revisedExam = await prisma.exam.create({ data: {
      title: 'Revision workflow', subjectId, semesterId, defaultDurationMinutes: 60,
      format: 'OBJECTIVE', type: 'FINAL', createdById: headId,
    } })
    ids.exams.push(revisedExam.id)
    const examQuestion = await prisma.examQuestion.create({ data: {
      examId: revisedExam.id, orderIndex: 1, points: 10,
      title: 'Original question', content: 'Original content', type: 'SINGLE_CHOICE', difficulty: 'EASY',
      options: { create: [
        { orderIndex: 0, content: 'Correct', isCorrect: true },
        { orderIndex: 1, content: 'Wrong', isCorrect: false },
      ] },
    } })
    ids.examQuestions.push(examQuestion.id)
    await submitFinalExam(revisedExam.id, headId)
    assert.equal((await prisma.exam.findUniqueOrThrow({ where: { id: revisedExam.id } })).approvalStatus, 'PENDING')
    assert.equal((await listReadyExams()).some((item) => item.id === revisedExam.id), false)
    await reviewExam(revisedExam.id, lecturerId, false, 'Cần sửa ma trận và đáp án.', [
      { questionId: examQuestion.id, note: 'Kiểm tra lại đáp án câu 1.' },
    ])
    assert.equal((await prisma.exam.findUniqueOrThrow({ where: { id: revisedExam.id } })).rejectionReason, 'Cần sửa ma trận và đáp án.')
    const revisionDecision = await prisma.examReviewDecision.findFirstOrThrow({
      where: { round: { examId: revisedExam.id, version: 1 } },
    })
    assert.deepEqual(revisionDecision.questionFeedback, [{
      questionId: examQuestion.id, order: 1, title: 'Original question', note: 'Kiểm tra lại đáp án câu 1.',
    }])
    await prisma.examQuestion.update({ where: { id: examQuestion.id }, data: { title: 'Revised question' } })
    await submitFinalExam(revisedExam.id, headId)
    const latest = await prisma.examReviewRound.findFirstOrThrow({ where: { examId: revisedExam.id }, orderBy: { version: 'desc' } })
    assert.equal(latest.version, 2)
    assert.equal((latest.snapshot as { examQuestions: Array<{ title: string }> }).examQuestions[0].title, 'Revised question')
    await prisma.departmentReviewMember.update({
      where: { groupId_teacherId: { groupId, teacherId: lecturerId } }, data: { status: 'INACTIVE', leftAt: new Date() },
    })
    await assert.rejects(reviewExam(revisedExam.id, lecturerId, true), { statusCode: 403 })
    await reviewExam(revisedExam.id, headId, true)
    assert.equal((await listReadyExams()).some((item) => item.id === revisedExam.id), true)
    await prisma.departmentReviewMember.update({
      where: { groupId_teacherId: { groupId, teacherId: lecturerId } }, data: { status: 'ACTIVE', leftAt: null },
    })

    const question = await prisma.question.create({ data: {
      title: 'Concurrent shared question', content: 'Question content', type: 'SINGLE_CHOICE',
      difficulty: 'EASY', source: 'MANUAL', ownerId: headId, subjectId,
    } })
    ids.questions.push(question.id)
    const pending = await submitToSharedBank(question.id, subjectId, ids.users[0], headId)
    bankId = (await prisma.questionBank.findUniqueOrThrow({ where: { subjectId } })).id
    assert.equal(pending.status, 'PENDING')
    const questionDecisions = await Promise.allSettled([
      reviewBankItem(pending.id, headId, true),
      reviewBankItem(pending.id, lecturerId, false, 'Cần sửa câu hỏi và đáp án.'),
    ])
    assert.equal(questionDecisions.filter((decision) => decision.status === 'fulfilled').length, 1)
    assert.notEqual((await prisma.questionBankItem.findUniqueOrThrow({ where: { id: pending.id } })).status, 'PENDING')
  } finally {
    await prisma.auditLog.deleteMany({ where: { userId: { in: ids.users } } })
    await prisma.questionBankItem.deleteMany({ where: { questionId: { in: ids.questions } } })
    await prisma.question.deleteMany({ where: { id: { in: ids.questions } } })
    if (bankId) await prisma.questionBank.delete({ where: { id: bankId } })
    await prisma.examReviewDecision.deleteMany({ where: { round: { examId: { in: ids.exams } } } })
    await prisma.examReviewRound.deleteMany({ where: { examId: { in: ids.exams } } })
    await prisma.examQuestionOption.deleteMany({ where: { examQuestionId: { in: ids.examQuestions } } })
    await prisma.examQuestion.deleteMany({ where: { id: { in: ids.examQuestions } } })
    await prisma.exam.deleteMany({ where: { id: { in: ids.exams } } })
    if (groupId) {
      await prisma.departmentReviewMember.deleteMany({ where: { groupId } })
      await prisma.departmentReviewGroup.delete({ where: { id: groupId } })
    }
    if (subjectId) await prisma.subject.delete({ where: { id: subjectId } })
    if (semesterId) await prisma.semester.delete({ where: { id: semesterId } })
    await prisma.teacher.deleteMany({ where: { id: { in: ids.teachers } } })
    await prisma.user.deleteMany({ where: { id: { in: ids.users } } })
    if (departmentId) await prisma.department.delete({ where: { id: departmentId } })
    await prisma.$disconnect()
  }
})
