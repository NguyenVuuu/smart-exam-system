import { Prisma, type ExamStudentVisibility } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { createExamQuestion, deleteExamQuestions } from './exam-question-snapshot.repository'
import { examInclude } from './teacher-exams.repository'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { runSerializable } from '../../../utils/transaction'
import { readExamReviewSnapshot } from './exam-review-snapshot.repository'
import type { ExamQuestionReviewNote } from '../validators/teacher-exams.validator'

const copySuffix = ' - Bản sao'
const toCopyTitle = (title: string) => `${title.replace(/( - Bản sao)+$/u, '')}${copySuffix}`

export const transitionExam = (
  id: string,
  expected: Prisma.ExamWhereInput,
  data: Prisma.ExamUpdateManyMutationInput,
) => prisma.exam.updateMany({ where: { id, ...expected }, data })

export function submitFinalExam(examId: string, teacherId: string) {
  return runSerializable(async (tx) => {
    const exam = await tx.exam.findUnique({
      where: { id: examId },
      select: {
        id: true, type: true, status: true, approvalStatus: true, createdById: true, updatedAt: true,
        subject: { select: { departmentId: true } },
        _count: { select: { examQuestions: true } },
        reviewRounds: { orderBy: { version: 'desc' }, take: 1, select: { version: true, status: true } },
      },
    })
    if (!exam || exam.createdById !== teacherId) throw new NotFoundError('Exam not found')
    if (exam.type !== 'FINAL' || exam.status !== 'DRAFT' || exam.approvalStatus === 'PENDING') {
      throw new ConflictError('Final exam is not editable')
    }
    if (!exam._count.examQuestions) throw new ValidationError('Exam must contain at least one question')
    const previous = exam.reviewRounds[0]
    if (previous && previous.status !== 'REVISION_REQUESTED') {
      throw new ConflictError('Previous review round has not requested a revision')
    }
    const author = await tx.teacher.findUnique({
      where: { id: teacherId },
      select: {
        status: true, departmentId: true, userId: true,
        user: { select: { status: true } },
      },
    })
    if (!author || author.status !== 'ACTIVE' || author.user.status !== 'ACTIVE' || author.departmentId !== exam.subject.departmentId) {
      throw new ForbiddenError('Active teacher must belong to the exam department')
    }
    const group = await tx.departmentReviewGroup.findUnique({
      where: { departmentId: exam.subject.departmentId }, select: { id: true, status: true },
    })
    if (!group || group.status !== 'ACTIVE') {
      throw new ConflictError('Department review group is unavailable; contact the department head')
    }
    const eligibleReviewers = await tx.departmentReviewMember.count({
      where: {
        groupId: group.id, status: 'ACTIVE',
        teacher: { departmentId: exam.subject.departmentId, status: 'ACTIVE', user: { status: 'ACTIVE' } },
      },
    })
    const claimed = await tx.exam.updateMany({
      where: {
        id: examId, createdById: teacherId, type: 'FINAL', status: 'DRAFT',
        approvalStatus: { not: 'PENDING' }, updatedAt: exam.updatedAt,
      },
      data: { approvalStatus: 'PENDING', rejectionReason: null, reviewedAt: null, reviewedById: null },
    })
    if (!claimed.count) throw new ConflictError('Exam changed; reload and try again')
    const round = await tx.examReviewRound.create({
      data: {
        examId, groupId: group.id, version: (previous?.version ?? 0) + 1,
        submittedById: teacherId,
        status: eligibleReviewers ? 'PENDING' : 'WAITING_FOR_REVIEWERS',
        snapshot: await readExamReviewSnapshot(tx, examId),
      },
      select: { id: true, version: true, status: true },
    })
    await writeAuditLog(tx, {
      userId: author.userId, action: 'SUBMIT_FINAL_EXAM_FOR_REVIEW', entityType: 'Exam', entityId: examId,
      metadata: { roundId: round.id, version: round.version, status: round.status },
    })
    return tx.exam.findUniqueOrThrow({ where: { id: examId }, include: examInclude })
  })
}

export function setDistributionLock(
  examId: string,
  teacherId: string,
  userId: string,
  locked: boolean,
) {
  return prisma.$transaction(async (tx) => {
    const from = locked ? 'READY' : 'LOCKED'
    const to = locked ? 'LOCKED' : 'READY'
    const now = new Date()
    const exam = await tx.exam.findFirst({
      where: { id: examId, createdById: teacherId, type: { not: 'FINAL' }, status: from },
      select: {
        id: true,
        schedules: {
          select: { status: true, startTime: true, _count: { select: { attempts: true } } },
        },
      },
    })
    if (!exam) return { changed: false, blocked: false }
    if (locked && exam.schedules.every((schedule) => schedule.status === 'CANCELLED')) {
      return { changed: false, blocked: true }
    }

    const blocked = !locked && exam.schedules.some((schedule) =>
      schedule._count.attempts > 0
      || (schedule.status !== 'DRAFT' && schedule.status !== 'CANCELLED' && schedule.startTime <= now),
    )
    if (blocked) return { changed: false, blocked: true }

    const changed = await tx.exam.updateMany({
      where: { id: examId, createdById: teacherId, status: from },
      data: { status: to },
    })
    if (!changed.count) return { changed: false, blocked: false }

    await writeAuditLog(tx, {
      userId,
      action: locked ? 'LOCK_EXAM_DISTRIBUTION' : 'UNLOCK_EXAM_DISTRIBUTION',
      entityType: 'Exam',
      entityId: examId,
      metadata: { from, to },
    })
    return { changed: true, blocked: false }
  })
}

export function setStudentVisibility(
  examId: string,
  teacherId: string,
  userId: string,
  visibility: ExamStudentVisibility,
) {
  return prisma.$transaction(async (tx) => {
    const exam = await tx.exam.findFirst({
      where: {
        id: examId,
        createdById: teacherId,
        type: { not: 'FINAL' },
        status: { in: ['READY', 'LOCKED'] },
      },
      select: { id: true, studentVisibility: true, updatedAt: true },
    })
    if (!exam || exam.studentVisibility === visibility) return Boolean(exam)

    const changed = await tx.exam.updateMany({
      where: {
        id: exam.id,
        updatedAt: exam.updatedAt,
      },
      data: { studentVisibility: visibility },
    })
    if (!changed.count) return false

    await writeAuditLog(tx, {
      userId,
      action: 'UPDATE_EXAM_STUDENT_VISIBILITY',
      entityType: 'Exam',
      entityId: examId,
      metadata: { from: exam.studentVisibility, to: visibility },
    })
    return true
  })
}

export function reviewExam(id: string, reviewerId: string, approved: boolean, reason?: string, questionNotes: ExamQuestionReviewNote[] = []) {
  return runSerializable(async (tx) => {
    const revisionReason = reason?.trim() || null
    if (!approved && !revisionReason && questionNotes.length === 0) throw new ValidationError('At least one revision note is required')
    const reviewer = await tx.teacher.findUnique({
      where: { id: reviewerId },
      select: { id: true, status: true, departmentId: true, userId: true, user: { select: { status: true } } },
    })
    if (!reviewer || reviewer.status !== 'ACTIVE' || reviewer.user.status !== 'ACTIVE' || !reviewer.departmentId) {
      throw new ForbiddenError('Active review group membership required')
    }
    const round = await tx.examReviewRound.findFirst({
      where: { examId: id }, orderBy: { version: 'desc' },
      select: {
        id: true, version: true, status: true, groupId: true, snapshot: true,
        exam: { select: {
          id: true, type: true, status: true, approvalStatus: true,
          subject: { select: { departmentId: true } },
        } },
        group: { select: { departmentId: true, status: true, department: { select: { status: true } } } },
      },
    })
    if (!round || round.exam.type !== 'FINAL' || round.exam.subject.departmentId !== reviewer.departmentId
      || round.group.departmentId !== reviewer.departmentId) {
      throw new NotFoundError('Approval request not found')
    }
    const membership = await tx.departmentReviewMember.findUnique({
      where: { groupId_teacherId: { groupId: round.groupId, teacherId: reviewerId } },
      select: { status: true },
    })
    if (round.group.status !== 'ACTIVE' || round.group.department.status !== 'ACTIVE' || membership?.status !== 'ACTIVE') {
      throw new ForbiddenError('Active review group membership required')
    }
    if (round.status !== 'PENDING' || round.exam.approvalStatus !== 'PENDING' || round.exam.status !== 'DRAFT') {
      throw new ConflictError('Review round has already been decided or is not ready')
    }
    const snapshot = round.snapshot as { examQuestions?: Array<{ id: string; orderIndex: number; title: string }> }
    const snapshotQuestions = Array.isArray(snapshot?.examQuestions) ? snapshot.examQuestions : []
    const questionFeedback = approved ? [] : questionNotes.map(({ questionId, note }) => {
      const question = snapshotQuestions.find(({ id: snapshotId }) => snapshotId === questionId)
      if (!question) throw new ValidationError('Revision note refers to a question outside this review round')
      return { questionId, order: question.orderIndex, title: question.title, note: note.trim() }
    })
    const now = new Date()
    const nextRoundStatus = approved ? 'APPROVED' : 'REVISION_REQUESTED'
    const claimedRound = await tx.examReviewRound.updateMany({
      where: { id: round.id, status: 'PENDING' },
      data: { status: nextRoundStatus, decidedAt: now },
    })
    if (!claimedRound.count) throw new ConflictError('Review round has already been decided')
    await tx.examReviewDecision.create({
      data: {
        roundId: round.id, reviewerId, type: approved ? 'APPROVE' : 'REQUEST_REVISION',
        reason: approved ? null : revisionReason,
        questionFeedback: questionFeedback.length ? questionFeedback : Prisma.DbNull,
      },
    })
    const claimedExam = await tx.exam.updateMany({
      where: { id, type: 'FINAL', status: 'DRAFT', approvalStatus: 'PENDING' },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        status: approved ? 'READY' : 'DRAFT',
        reviewedById: reviewerId,
        reviewedAt: now,
        rejectionReason: approved ? null : revisionReason,
      },
    })
    if (!claimedExam.count) throw new ConflictError('Exam state changed during review')
    await writeAuditLog(tx, {
      userId: reviewer.userId,
      action: approved ? 'APPROVE_FINAL_EXAM' : 'REQUEST_FINAL_EXAM_REVISION',
      entityType: 'ExamReviewRound', entityId: round.id,
      metadata: { examId: id, version: round.version, decision: approved ? 'APPROVE' : 'REQUEST_REVISION', reason: approved ? null : revisionReason, questionFeedback },
    })
    return tx.exam.findUniqueOrThrow({ where: { id }, include: examInclude })
  })
}

export function copyExam(sourceId: string, teacherId: string) {
  return prisma.$transaction(async (tx) => {
    const source = await tx.exam.findUniqueOrThrow({
      where: { id: sourceId },
      include: {
        sections: true,
        examQuestions: { include: { options: true, programmingConfig: true, programmingTests: true } },
      },
    })
    const activeSemester = await tx.semester.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
      select: { id: true },
    })
    const copy = await tx.exam.create({
      data: {
        title: toCopyTitle(source.title),
        description: source.description,
        subjectId: source.subjectId,
        semesterId: activeSemester?.id ?? source.semesterId,
        defaultDurationMinutes: source.defaultDurationMinutes,
        totalPoints: source.totalPoints,
        format: source.format,
        type: source.type,
        creationMethod: source.creationMethod,
        createdById: teacherId,
        status: 'DRAFT',
        approvalStatus: 'NOT_REQUIRED',
      },
    })
    const sectionIds = new Map<string, string>()
    for (const section of source.sections) {
      const copied = await tx.examSection.create({
        data: {
          examId: copy.id,
          title: section.title,
          description: section.description,
          type: section.type,
          targetPoints: section.targetPoints,
          orderIndex: section.orderIndex,
        },
      })
      sectionIds.set(section.id, copied.id)
    }
    for (const question of source.examQuestions) {
      await createExamQuestion(tx, copy.id, {
        question,
        sourceQuestionId: question.sourceQuestionId,
        points: Number(question.points),
        orderIndex: question.orderIndex,
        sectionId: question.sectionId ? sectionIds.get(question.sectionId) : undefined,
      })
    }
    return tx.exam.findUniqueOrThrow({ where: { id: copy.id }, include: examInclude })
  })
}

export function deleteDraftExam(examId: string, teacherId: string) {
  return prisma.$transaction(async (tx) => {
    const exam = await tx.exam.findFirst({
      where: { id: examId, createdById: teacherId, status: 'DRAFT', approvalStatus: { not: 'PENDING' } },
      select: { id: true, _count: { select: { schedules: true } } },
    })
    if (!exam || exam._count.schedules) return false
    await deleteExamQuestions(tx, examId)
    return Boolean((await tx.exam.deleteMany({
      where: { id: examId, createdById: teacherId, status: 'DRAFT' },
    })).count)
  })
}
