import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('final exam workflow notifies the review group and the author at the correct links', async (context) => {
  const sent: Array<{ users: string[]; title: string; link: string | null | undefined }> = []
  const repositoryId = require.resolve('../repositories/teacher-exams.repository')
  const lifecycleId = require.resolve('../repositories/teacher-exam-lifecycle.repository')
  const mapperId = require.resolve('../mappers/teacher-exam.mapper')
  const notificationsId = require.resolve('../../notifications/notifications.service')
  const serviceId = require.resolve('./teacher-exams.service')
  const originals = new Map([repositoryId, lifecycleId, mapperId, notificationsId, serviceId]
    .map((id) => [id, require.cache[id]]))
  function stub(id: string, exports: unknown) {
    const module = new Module(id)
    module.exports = exports
    module.loaded = true
    require.cache[id] = module
  }
  const exam = {
    id: 'exam', title: 'Final exam', type: 'FINAL', status: 'DRAFT', approvalStatus: 'NOT_REQUIRED',
    createdById: 'author', subject: { departmentId: 'department' }, createdBy: { userId: 'user-author' },
    reviewedBy: { userId: 'user-reviewer' }, _count: { examQuestions: 2 },
  }
  stub(repositoryId, {
    findExam: async () => exam,
    findReviewNotificationTargets: async () => [
      { teacher: { userId: 'user-reviewer' } }, { teacher: { userId: 'user-author' } },
      { teacher: { userId: 'user-other' } },
    ],
  })
  stub(lifecycleId, {
    submitFinalExam: async () => exam,
    reviewExam: async (_id: string, _reviewerId: string, _approved: boolean, _reason?: string,
      notes?: Array<{ questionId: string; note: string }>) => {
      if (notes?.length) assert.equal(notes[0].questionId, 'question')
      return exam
    },
  })
  stub(mapperId, { toTeacherExamDto: () => ({ id: 'exam' }) })
  stub(notificationsId, {
    notifyUsers: async (users: string[], title: string, _content: string, options: { link?: string | null }) => {
      sent.push({ users, title, link: options.link })
    },
  })
  delete require.cache[serviceId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })
  const service = require('./teacher-exams.service') as typeof import('./teacher-exams.service')
  await service.submit('author', 'exam')
  await service.approve('reviewer', 'exam')
  await service.reject('reviewer', 'exam', undefined, [
    { questionId: 'question', note: 'Check the answer key' },
  ])
  assert.deepEqual(sent.map(({ users, link }) => ({ users, link })), [
    { users: ['user-reviewer', 'user-author', 'user-other'], link: '/teacher/department-approvals' },
    { users: ['user-author'], link: '/teacher/exams/exam' },
    { users: ['user-other'], link: '/teacher/department-approvals' },
    { users: ['user-author'], link: '/teacher/exams/exam' },
    { users: ['user-other'], link: '/teacher/department-approvals' },
  ])
  assert.match(sent[0].title, /cần duyệt/)
  assert.match(sent[1].title, /đã được duyệt/)
  assert.match(sent[3].title, /cần chỉnh sửa/)
})
