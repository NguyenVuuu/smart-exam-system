import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('role grant changes are atomic and audited with dependent permissions', async (context) => {
  const grants = new Set<string>()
  const audits: Array<{ action: string; metadata: { permission: string; allowed: boolean } }> = []
  const transaction = {
    backofficeRolePermission: {
      findUnique: async ({ where }: { where: { role_permission: { permission: string } } }) =>
        grants.has(where.role_permission.permission) ? { permission: where.role_permission.permission } : null,
      upsert: async ({ create }: { create: { permission: string } }) => { grants.add(create.permission) },
      deleteMany: async ({ where }: { where: { permission: string } }) => { grants.delete(where.permission) },
    },
    auditLog: {
      create: async ({ data }: { data: (typeof audits)[number] }) => { audits.push(data) },
    },
  }

  const prismaId = require.resolve('../../../lib/prisma')
  const repositoryId = require.resolve('./admin-permissions.repository')
  const originalPrisma = require.cache[prismaId]
  const originalRepository = require.cache[repositoryId]
  const stub = new Module(prismaId)
  stub.exports = { __esModule: true, default: { $transaction: async (run: (tx: typeof transaction) => Promise<unknown>) => run(transaction) } }
  stub.loaded = true
  require.cache[prismaId] = stub
  delete require.cache[repositoryId]
  context.after(() => {
    if (originalPrisma) require.cache[prismaId] = originalPrisma
    else delete require.cache[prismaId]
    if (originalRepository) require.cache[repositoryId] = originalRepository
    else delete require.cache[repositoryId]
  })

  const repository = require('./admin-permissions.repository') as typeof import('./admin-permissions.repository')
  const input = {
    role: 'EDUCATION_OFFICER' as const,
    reason: 'Approved by administrator',
    actorUserId: 'actor',
  }

  await repository.updateRolePermission({ ...input, permission: 'ACADEMIC_MANAGE', allowed: true })
  assert.deepEqual([...grants], ['ACADEMIC_MANAGE', 'ACADEMIC_VIEW'])
  assert.deepEqual(audits.map(({ metadata }) => metadata.allowed), [true, true])

  await repository.updateRolePermission({ ...input, permission: 'ACADEMIC_VIEW', allowed: false })
  assert.equal(grants.size, 0)
  assert.deepEqual(audits.map(({ metadata }) => metadata.permission), [
    'ACADEMIC_MANAGE', 'ACADEMIC_VIEW', 'ACADEMIC_VIEW', 'ACADEMIC_MANAGE',
  ])
  assert.equal(audits.every(({ action }) => action === 'BACKOFFICE_ROLE_PERMISSION_CHANGED'), true)
})

test('granting account management stores only its override and clears a prior view denial', async (context) => {
  const overrides = new Map<string, boolean>()
  const audits: Array<{ metadata: { permission: string; allowed: boolean | null; requestedPermission: string } }> = []
  const transaction = {
    adminPermissionOverride: {
      findUnique: async ({ where }: { where: { adminId_permission: { permission: string } } }) => {
        const permission = where.adminId_permission.permission
        return overrides.has(permission) ? { allowed: overrides.get(permission) } : null
      },
      upsert: async ({ create }: { create: { permission: string; allowed: boolean } }) => {
        overrides.set(create.permission, create.allowed)
      },
      deleteMany: async ({ where }: { where: { permission: string } }) => { overrides.delete(where.permission) },
    },
    auditLog: {
      create: async ({ data }: { data: (typeof audits)[number] }) => { audits.push(data) },
    },
  }

  const prismaId = require.resolve('../../../lib/prisma')
  const repositoryId = require.resolve('./admin-permissions.repository')
  const originalPrisma = require.cache[prismaId]
  const originalRepository = require.cache[repositoryId]
  const stub = new Module(prismaId)
  stub.exports = { __esModule: true, default: { $transaction: async (run: (tx: typeof transaction) => Promise<unknown>) => run(transaction) } }
  stub.loaded = true
  require.cache[prismaId] = stub
  delete require.cache[repositoryId]
  context.after(() => {
    if (originalPrisma) require.cache[prismaId] = originalPrisma
    else delete require.cache[prismaId]
    if (originalRepository) require.cache[repositoryId] = originalRepository
    else delete require.cache[repositoryId]
  })

  const repository = require('./admin-permissions.repository') as typeof import('./admin-permissions.repository')
  const input = {
    adminId: 'account',
    permission: 'ACADEMIC_MANAGE' as const,
    allowed: true,
    reason: 'Assigned academic management',
    actorUserId: 'actor',
  }

  await repository.updateOverride(input)
  assert.deepEqual([...overrides], [['ACADEMIC_MANAGE', true]])
  assert.equal(audits.length, 1)

  overrides.set('ACADEMIC_VIEW', false)
  await repository.updateOverride(input)
  assert.deepEqual([...overrides], [['ACADEMIC_MANAGE', true]])
  assert.deepEqual(audits.slice(-2).map(({ metadata }) => [metadata.permission, metadata.allowed]), [
    ['ACADEMIC_MANAGE', true], ['ACADEMIC_VIEW', null],
  ])
  assert.equal(audits[audits.length - 1]?.metadata.requestedPermission, 'ACADEMIC_MANAGE')
})
