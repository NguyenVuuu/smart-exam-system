import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('department group management enforces the current head and pending-round rules', async (context) => {
  type Actor = {
    id: string
    departmentId: string
    position: 'DEPARTMENT_HEAD' | 'LECTURER'
    status: 'ACTIVE' | 'INACTIVE'
    userId: string
    user: { status: 'ACTIVE' | 'INACTIVE' }
    department: { status: 'ACTIVE' | 'INACTIVE' }
  }
  const actors = new Map<string, Actor>([
    ['head', { id: 'head', departmentId: 'department', position: 'DEPARTMENT_HEAD', status: 'ACTIVE', userId: 'user-head', user: { status: 'ACTIVE' }, department: { status: 'ACTIVE' } }],
    ['teacher', { id: 'teacher', departmentId: 'department', position: 'LECTURER', status: 'ACTIVE', userId: 'user-teacher', user: { status: 'ACTIVE' }, department: { status: 'ACTIVE' } }],
    ['other', { id: 'other', departmentId: 'other-department', position: 'DEPARTMENT_HEAD', status: 'ACTIVE', userId: 'user-other', user: { status: 'ACTIVE' }, department: { status: 'ACTIVE' } }],
    ['inactive', { id: 'inactive', departmentId: 'department', position: 'LECTURER', status: 'INACTIVE', userId: 'user-inactive', user: { status: 'ACTIVE' }, department: { status: 'ACTIVE' } }],
  ])
  type Group = { id: string; departmentId: string; name: string; status: 'ACTIVE' | 'INACTIVE'; members: { teacherId: string }[] }
  const state: { group: Group | null } = { group: null }
  let pendingRounds = 0
  let pendingQuestions = 0
  const memberships = new Map<string, { id: string; teacherId: string; status: 'ACTIVE' | 'INACTIVE' }>()
  const audits: string[] = []
  let refreshes = 0
  const tx = {
    questionBankItem: { count: async () => pendingQuestions },
    departmentReviewGroup: {
      create: async ({ data }: { data: { departmentId: string; name: string; members: { create: { teacherId: string } } } }) => {
        state.group = { id: 'group', departmentId: data.departmentId, name: data.name, status: 'ACTIVE', members: [data.members.create] }
      },
      update: async ({ data }: { data: { name?: string; status?: 'ACTIVE' | 'INACTIVE' } }) => {
        state.group = { ...state.group!, ...data }
      },
    },
    departmentReviewMember: {
      findUnique: async ({ where }: { where: { groupId_teacherId: { teacherId: string } } }) => memberships.get(where.groupId_teacherId.teacherId) ?? null,
      create: async ({ data }: { data: { teacherId: string } }) => {
        memberships.set(data.teacherId, { id: data.teacherId, teacherId: data.teacherId, status: 'ACTIVE' })
        state.group!.members.push({ teacherId: data.teacherId })
      },
      update: async ({ where, data }: { where: { id: string }; data: { status: 'ACTIVE' | 'INACTIVE' } }) => {
        memberships.get(where.id)!.status = data.status
        state.group!.members = [...memberships.values()].filter((member) => member.status === 'ACTIVE').map((member) => ({ teacherId: member.teacherId }))
        state.group!.members.unshift({ teacherId: 'head' })
      },
    },
    auditLog: { create: async ({ data }: { data: { action: string } }) => { audits.push(data.action) } },
  }
  const transactionId = require.resolve('../../../utils/transaction')
  const repositoryId = require.resolve('../repositories/review-group.repository')
  const serviceId = require.resolve('./review-group.service')
  const originals = new Map([transactionId, repositoryId, serviceId].map((id) => [id, require.cache[id]]))
  function stub(id: string, exports: unknown) {
    const module = new Module(id)
    module.exports = exports
    module.loaded = true
    require.cache[id] = module
  }
  stub(transactionId, { runSerializable: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) })
  stub(repositoryId, {
    findActor: async (_tx: typeof tx, id: string) => actors.get(id) ?? null,
    findGroup: async (_tx: typeof tx, departmentId: string) => state.group?.departmentId === departmentId ? state.group : null,
    hasOpenRounds: async () => pendingRounds,
    findCandidate: async (_tx: typeof tx, id: string) => actors.get(id) ?? null,
    listCandidates: async () => [...actors.values()].filter((actor) => actor.departmentId === 'department' && actor.status === 'ACTIVE'),
    refreshOpenRounds: async () => { refreshes += 1 },
  })
  delete require.cache[serviceId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })

  const service = require('./review-group.service') as typeof import('./review-group.service')
  await assert.rejects(service.create('teacher', 'Review group'), { statusCode: 403 })
  await assert.rejects(service.get('other'), { statusCode: 404 })
  await service.create('head', 'Review group')
  assert.deepEqual(state.group?.members.map((member) => member.teacherId), ['head'])
  await assert.rejects(service.create('head', 'Second group'), { statusCode: 409 })
  await assert.rejects(service.rename('teacher', 'Changed'), { statusCode: 403 })

  actors.get('head')!.position = 'LECTURER'
  await assert.rejects(service.rename('head', 'Former head change'), { statusCode: 403 })
  actors.get('head')!.position = 'DEPARTMENT_HEAD'
  actors.get('head')!.user.status = 'INACTIVE'
  await assert.rejects(service.rename('head', 'Inactive account change'), { statusCode: 403 })
  actors.get('head')!.user.status = 'ACTIVE'

  pendingRounds = 1
  await assert.rejects(service.setStatus('head', 'INACTIVE'), { statusCode: 409 })
  pendingRounds = 0
  pendingQuestions = 1
  await assert.rejects(service.setStatus('head', 'INACTIVE'), { statusCode: 409 })
  pendingQuestions = 0
  await service.setStatus('head', 'INACTIVE')
  assert.equal(state.group?.status, 'INACTIVE')
  await service.setStatus('head', 'ACTIVE')
  assert.equal(state.group?.status, 'ACTIVE')
  await assert.rejects(service.get('teacher'), { statusCode: 403 })
  await service.rename('head', 'Renamed group')
  assert.equal(state.group?.name, 'Renamed group')

  await assert.rejects(service.addMember('head', 'user-head', 'other'), { statusCode: 403 })
  await assert.rejects(service.addMember('head', 'user-head', 'inactive'), { statusCode: 404 })
  await service.addMember('head', 'user-head', 'teacher')
  await assert.rejects(service.addMember('head', 'user-head', 'teacher'), { statusCode: 409 })
  assert.deepEqual(state.group?.members.map((member) => member.teacherId), ['head', 'teacher'])
  await assert.rejects(service.removeMember('head', 'user-head', 'head'), { statusCode: 403 })
  await service.removeMember('head', 'user-head', 'teacher')
  assert.deepEqual(state.group?.members.map((member) => member.teacherId), ['head'])
  await service.addMember('head', 'user-head', 'teacher')
  assert.equal(refreshes, 3)
  assert.deepEqual(audits, ['REVIEW_GROUP_MEMBER_ADDED', 'REVIEW_GROUP_MEMBER_REMOVED', 'REVIEW_GROUP_MEMBER_ADDED'])
})
