import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import Module from 'node:module'
import express, { type ErrorRequestHandler, type RequestHandler } from 'express'

// Isolate route wiring from database, Redis and controller side effects.
function stubModule(path: string, exports: unknown) {
  const id = require.resolve(path)
  const stub = new Module(id)
  stub.exports = exports
  stub.loaded = true
  require.cache[id] = stub
}

const authenticate: RequestHandler = (req, _res, next) => {
  req.user = {
    id: 'user', profileId: 'profile',
    role: req.headers['x-role'] === 'ADMIN' ? 'ADMIN' : 'EDUCATION_OFFICER',
  }
  next()
}
stubModule('../middlewares/authenticate', { authenticate })
stubModule('../middlewares/requireBackoffice', {
  requireBackoffice: (...permissions: string[]): RequestHandler => (req, res, next) => {
    const allowed = String(req.headers['x-permissions'] ?? '').split(',')
    if (permissions.length && !permissions.some((key) => allowed.includes(key))) {
      res.sendStatus(403)
      return
    }
    next()
  },
})
const ok: RequestHandler = async (_req, res) => { res.sendStatus(200) }
stubModule('../../admin-permissions/controllers/admin-permissions.controller', { me: ok, list: ok, update: ok, updateRole: ok })
stubModule('../../admin-audit-logs/controllers/admin-audit-logs.controller', {
  listAuditLogs: ok, getAuditLogOverview: ok, exportAuditLogs: ok, getAuditLog: ok,
})
stubModule('../../exam-schedules/controllers/exam-schedule.controller', {
  listReadyExams: ok, list: ok, create: ok, get: ok, update: ok, cancel: ok,
})
stubModule('../../admin-monitoring/admin-monitoring.controller', { proctoring: ok, reports: ok })
stubModule('../../admin-users/controllers/admin-users.controller', {
  getNextCode: ok, listUsers: ok, listReferences: ok, createUser: ok, updateUser: ok,
  setStatus: ok, resetPassword: ok, enroll: ok, listEnrollments: ok, withdraw: ok,
})
stubModule('../../admin-academic/controllers/academic.controller', {
  listSemesters: ok, createSemester: ok, updateSemester: ok, activateSemester: ok,
  listDepartments: ok, createDepartment: ok, updateDepartment: ok, assignDepartmentHead: ok,
  listSubjects: ok, createSubject: ok, updateSubject: ok,
  listCourseOfferings: ok, createCourseOffering: ok, updateCourseOffering: ok,
})

test('shared admin routers enforce only the permissions of the matched endpoint', async () => {
  const app = express()
  app.use('/api/admin', require('../../admin-academic/routes/academic.routes').default)
  app.use('/api/admin', require('../../admin-users/routes/admin-users.routes').default)
  app.use('/api/admin', require('../../admin-permissions/routes/admin-permissions.routes').default)
  app.use('/api/admin', require('../../exam-schedules/routes/exam-schedule.routes').default)
  app.use('/api/admin', require('../../admin-audit-logs/routes/admin-audit-logs.routes').default)
  app.use('/api/admin', require('../../admin-monitoring/admin-monitoring.routes').default)
  const onError: ErrorRequestHandler = (error, _req, res, _next) => { res.sendStatus(error.statusCode ?? 500) }
  app.use(onError)
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/admin`
  try {
    for (const [path, permissions, status] of [
      ['/permissions/me', '', 200],
      ['/permissions', '', 403],
      ['/users', 'SCHEDULES_VIEW', 403],
      ['/users', 'USERS_VIEW', 200],
      ['/users/references', 'SCHEDULES_VIEW', 200],
      ['/users/references', '', 403],
      ['/departments', 'USERS_VIEW', 200],
      ['/subjects', 'QUESTION_BANK_VIEW', 200],
      ['/semesters', 'EXAMS_VIEW', 200],
      ['/course-offerings/course/enrollments', 'ACADEMIC_VIEW', 200],
      ['/exam-schedules', 'SCHEDULES_VIEW', 200],
      ['/exam-schedules/ready-final-exams', 'SCHEDULES_VIEW', 200],
      ['/exam-schedules', '', 403],
      ['/audit-logs', '', 403],
      ['/audit-logs', 'AUDIT_VIEW', 200],
      ['/monitoring/proctoring', 'MONITORING_VIEW', 200],
      ['/monitoring/reports', 'REPORTS_VIEW', 200],
      ['/monitoring/reports', '', 403],
    ] as const) {
      const response = await fetch(`${base}${path}`, { headers: { 'x-permissions': permissions } })
      await response.text()
      assert.equal(response.status, status, `${path} with ${permissions}`)
    }
    for (const [method, path, permissions, status] of [
      ['PUT', '/permissions/roles/EDUCATION_OFFICER/REPORTS_VIEW', '', 403],
      ['POST', '/exam-schedules', 'SCHEDULES_VIEW', 403],
      ['POST', '/exam-schedules', 'SCHEDULES_MANAGE', 200],
      ['POST', '/course-offerings/course/enrollments', 'ACADEMIC_VIEW', 403],
      ['POST', '/course-offerings/course/enrollments', 'ACADEMIC_MANAGE', 200],
      ['POST', '/users', 'USERS_VIEW', 403],
      ['POST', '/users', 'USERS_MANAGE', 200],
      ['POST', '/semesters', 'SCHEDULES_MANAGE', 403],
    ] as const) {
      const response = await fetch(`${base}${path}`, { method, headers: { 'x-permissions': permissions } })
      await response.text()
      assert.equal(response.status, status, `${method} ${path} with ${permissions}`)
    }
    const roleUpdate = await fetch(`${base}/permissions/roles/EDUCATION_OFFICER/REPORTS_VIEW`, {
      method: 'PUT', headers: { 'x-role': 'ADMIN' },
    })
    await roleUpdate.text()
    assert.equal(roleUpdate.status, 200)
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
