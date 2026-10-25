import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { runSerializable } from '../src/utils/transaction'
import { readExamReviewSnapshot } from '../src/modules/teacher-exams/repositories/exam-review-snapshot.repository'

const apply = process.argv.includes('--apply')

async function inspect() {
  const [departments, pending, legacyApproved, scheduleCount] = await Promise.all([
    prisma.department.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, code: true,
        teachers: { where: { position: 'DEPARTMENT_HEAD', status: 'ACTIVE', user: { status: 'ACTIVE' } }, select: { id: true } },
        reviewGroup: { select: { id: true, status: true, members: { where: { status: 'ACTIVE' }, select: { teacherId: true } } } },
      },
    }),
    prisma.exam.findMany({
      where: { type: 'FINAL', approvalStatus: 'PENDING', reviewRounds: { none: {} } },
      select: { id: true, subject: { select: { departmentId: true } } },
    }),
    prisma.exam.count({ where: { type: 'FINAL', approvalStatus: 'APPROVED', reviewRounds: { none: {} } } }),
    prisma.examSchedule.count(),
  ])
  const usable = new Set(departments.filter((department) => department.teachers.length === 1 && (!department.reviewGroup || department.reviewGroup.status === 'ACTIVE')).map((department) => department.id))
  return {
    groupsToCreate: departments.filter((department) => department.teachers.length === 1 && !department.reviewGroup).length,
    headMembershipsToActivate: departments.filter((department) => department.teachers.length === 1 && department.reviewGroup && !department.reviewGroup.members.some((member) => member.teacherId === department.teachers[0].id)).length,
    pendingRoundsToCreate: pending.filter((exam) => usable.has(exam.subject.departmentId)).length,
    pendingWithoutUsableGroup: pending.filter((exam) => !usable.has(exam.subject.departmentId)).map((exam) => exam.id),
    departmentsWithoutOneActiveHead: departments.filter((department) => department.teachers.length !== 1).map((department) => department.code),
    legacyApprovedExamsPreserved: legacyApproved,
    examSchedulesPreserved: scheduleCount,
  }
}

async function reconcile() {
  await runSerializable(async (tx) => {
    const departments = await tx.department.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, code: true,
        teachers: { where: { position: 'DEPARTMENT_HEAD', status: 'ACTIVE', user: { status: 'ACTIVE' } }, select: { id: true } },
        reviewGroup: { select: { id: true, status: true } },
      },
    })
    const usableGroups = new Map<string, string>()
    for (const department of departments) {
      if (department.teachers.length !== 1) continue
      const headId = department.teachers[0].id
      const group = department.reviewGroup ?? await tx.departmentReviewGroup.create({
        data: {
          departmentId: department.id,
          name: `Nhóm duyệt đề ${department.code}`,
          createdById: headId,
        },
        select: { id: true, status: true },
      })
      const membership = await tx.departmentReviewMember.findUnique({
        where: { groupId_teacherId: { groupId: group.id, teacherId: headId } },
      })
      if (!membership) {
        await tx.departmentReviewMember.create({ data: { groupId: group.id, teacherId: headId } })
      } else if (membership.status !== 'ACTIVE') {
        await tx.departmentReviewMember.update({ where: { id: membership.id }, data: { status: 'ACTIVE', joinedAt: new Date(), leftAt: null } })
      }
      if (group.status === 'ACTIVE') usableGroups.set(department.id, group.id)
    }

    const pending = await tx.exam.findMany({
      where: { type: 'FINAL', approvalStatus: 'PENDING', reviewRounds: { none: {} } },
      select: { id: true, createdById: true, updatedAt: true, subject: { select: { departmentId: true } } },
    })
    for (const exam of pending) {
      const groupId = usableGroups.get(exam.subject.departmentId)
      if (!groupId) continue
      const eligibleReviewers = await tx.departmentReviewMember.count({
        where: {
          groupId, status: 'ACTIVE',
          teacher: { departmentId: exam.subject.departmentId, status: 'ACTIVE', user: { status: 'ACTIVE' } },
        },
      })
      await tx.examReviewRound.create({
        data: {
          examId: exam.id, groupId, version: 1, submittedById: exam.createdById,
          submittedAt: exam.updatedAt,
          status: eligibleReviewers ? 'PENDING' : 'WAITING_FOR_REVIEWERS',
          snapshot: await readExamReviewSnapshot(tx, exam.id),
        },
      })
    }
  })
}

async function main() {
  const before = await inspect()
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', before }, null, 2))
  if (apply) {
    await reconcile()
    console.log(JSON.stringify({ after: await inspect() }, null, 2))
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(async () => { await prisma.$disconnect() })
